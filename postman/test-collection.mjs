#!/usr/bin/env node
/**
 * Tests the HospitalOS Postman collection against local Supabase.
 *
 * Usage:
 *   node postman/test-collection.mjs <service_role_key>
 *
 * Validates collection structure, then runs all 59 requests in order,
 * capturing IDs and passing them as FK references to subsequent requests.
 */

const SUPABASE_URL = 'http://127.0.0.1:54331';
const DEV_PASSWORD = 'DevAdmin@2026!';

// ── Helpers ──────────────────────────────────────────────────────────────────

function replaceVars(str, vars) {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

function log(icon, msg) {
  console.log(`  ${icon} ${msg}`);
}

function logSection(title) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'─'.repeat(60)}`);
}

// ── Structure Validation ─────────────────────────────────────────────────────

function validateStructure(collection) {
  logSection('PHASE 1: Validate Collection Structure');
  let errors = 0;

  // Check top-level schema
  if (collection.info?.schema !== 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json') {
    log('X', 'Missing or wrong Postman schema version');
    errors++;
  } else {
    log('OK', 'Postman v2.1 schema');
  }

  // Check collection auth
  if (collection.auth?.type !== 'apikey') {
    log('X', 'Missing collection-level auth');
    errors++;
  } else {
    log('OK', 'Collection-level apikey auth');
  }

  // Check variables exist
  if (!Array.isArray(collection.variable) || collection.variable.length === 0) {
    log('X', 'No collection variables defined');
    errors++;
  } else {
    log('OK', `${collection.variable.length} collection variables defined`);
  }

  // Check folders
  const folders = collection.item;
  if (!Array.isArray(folders) || folders.length !== 8) {
    log('X', `Expected 8 folders, found ${folders?.length ?? 0}`);
    errors++;
  } else {
    log('OK', `${folders.length} folders`);
  }

  // Check each request has required headers
  let totalRequests = 0;
  let missingHeaders = 0;
  let missingTests = 0;

  for (const folder of folders) {
    for (const item of folder.item) {
      totalRequests++;
      const req = item.request;
      const headers = req.header || [];
      const headerKeys = headers.map(h => h.key);

      if (!headerKeys.includes('Authorization')) {
        log('X', `Missing Authorization header: ${item.name}`);
        missingHeaders++;
      }
      if (!headerKeys.includes('Content-Type')) {
        log('X', `Missing Content-Type header: ${item.name}`);
        missingHeaders++;
      }

      // Check test scripts exist for POST requests
      const testEvent = (item.event || []).find(e => e.listen === 'test');
      if (!testEvent) {
        log('?', `No test script: ${item.name}`);
        missingTests++;
      }
    }
  }

  log('OK', `${totalRequests} total requests`);
  if (missingHeaders === 0) log('OK', 'All requests have Authorization + Content-Type headers');
  if (missingTests === 0) log('OK', 'All requests have test scripts');

  const folderSummary = folders.map(f => `${f.name}: ${f.item.length}`).join(', ');
  log('INFO', folderSummary);

  return errors === 0;
}

// ── API Test Runner ──────────────────────────────────────────────────────────

async function runRequest(item, vars) {
  const req = item.request;
  const method = req.method;

  // Build URL
  let url = replaceVars(req.url.raw, vars);

  // Build headers
  const headers = {};
  for (const h of req.header || []) {
    headers[h.key] = replaceVars(h.value, vars);
  }

  // Build body
  let body = null;
  if (req.body?.raw) {
    body = replaceVars(req.body.raw, vars);
  }

  // Execute pre-request script to compute dynamic dates
  const preReq = (item.event || []).find(e => e.listen === 'prerequest');
  if (preReq) {
    const scriptLines = preReq.script.exec;
    const script = scriptLines.join('\n');
    // Simple eval of date computations — mimics Postman pre-request scripts
    const mockPm = {
      collectionVariables: {
        set: (key, value) => { vars[key] = value; },
        get: (key) => vars[key],
      }
    };
    try {
      const fn = new Function('pm', script);
      fn(mockPm);
      // Re-replace vars after pre-request script
      url = replaceVars(req.url.raw, vars);
      body = req.body?.raw ? replaceVars(req.body.raw, vars) : null;
    } catch (e) {
      log('WARN', `Pre-request script error for ${item.name}: ${e.message}`);
    }
  }

  // Send request
  const fetchOpts = { method, headers };
  if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    fetchOpts.body = body;
  }

  const response = await fetch(url, fetchOpts);
  const status = response.status;
  let data = null;

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    if (text) {
      try { data = JSON.parse(text); } catch { data = text; }
    }
  }

  // Execute test script to save IDs
  const testEvent = (item.event || []).find(e => e.listen === 'test');
  if (testEvent && data) {
    const script = testEvent.script.exec.join('\n');
    const mockPm = {
      collectionVariables: {
        set: (key, value) => { vars[key] = value; },
        get: (key) => vars[key],
      },
      response: {
        json: () => data,
        to: {
          have: {
            status: (expected) => status === expected,
          }
        }
      },
      test: (name, fn) => {
        try { fn(); } catch {}
      }
    };
    try {
      const fn = new Function('pm', script);
      fn(mockPm);
    } catch {}
  }

  return { status, data };
}

async function runCollection(collection, serviceRoleKey) {
  logSection('PHASE 2: Run API Tests Against Local Supabase');

  const vars = {
    supabase_url: SUPABASE_URL,
    service_role_key: serviceRoleKey,
    dev_password: DEV_PASSWORD,
  };

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const folder of collection.item) {
    console.log(`\n  >> ${folder.name}`);

    for (const item of folder.item) {
      try {
        const { status, data } = await runRequest(item, vars);
        const isSuccess = status >= 200 && status < 300;

        if (isSuccess) {
          passed++;
          log('PASS', `[${status}] ${item.name}`);
        } else {
          failed++;
          const errMsg = typeof data === 'object' ? JSON.stringify(data).slice(0, 120) : String(data).slice(0, 120);
          log('FAIL', `[${status}] ${item.name} — ${errMsg}`);
          failures.push({ name: item.name, status, error: errMsg });
        }
      } catch (err) {
        failed++;
        log('FAIL', `[ERR] ${item.name} — ${err.message}`);
        failures.push({ name: item.name, status: 'ERR', error: err.message });
      }
    }
  }

  // ── Summary ──
  logSection('RESULTS');
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total:  ${passed + failed}`);

  if (failures.length > 0) {
    console.log('\n  Failures:');
    for (const f of failures) {
      console.log(`    [${f.status}] ${f.name}`);
      console.log(`           ${f.error}`);
    }
  }

  // ── Verify saved variables ──
  logSection('SAVED VARIABLES (FK chain)');
  const importantVars = [
    'hospital_city_general_id', 'hospital_riverside_id',
    'user_admin_cg_id', 'user_doctor1_cg_id', 'user_doctor2_cg_id',
    'user_nurse_cg_id', 'user_receptionist_cg_id', 'user_doctor_rv_id',
    'dept_emergency_cg_id', 'dept_internal_med_cg_id',
    'patient_1_id', 'patient_3_id', 'patient_5_id',
    'admission_1_id', 'admission_2_id', 'admission_3_id',
  ];
  for (const key of importantVars) {
    const val = vars[key];
    if (val && val !== '' && !val.startsWith('{{')) {
      log('OK', `${key} = ${val.slice(0, 36)}`);
    } else {
      log('MISS', `${key} — not captured`);
    }
  }

  return failed === 0;
}

// ── Database Reset ───────────────────────────────────────────────────────────

async function cleanDatabase(serviceRoleKey) {
  logSection('PHASE 0: Clean Existing Test Data');

  const headers = {
    'Authorization': `Bearer ${serviceRoleKey}`,
    'apikey': serviceRoleKey,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
  };

  // Delete in FK-safe order
  const tables = [
    'medical_records', 'admissions', 'appointments',
    'patients', 'rooms', 'departments',
    'message_attachments', 'messages', 'conversation_members', 'conversations',
    'audit_logs',
  ];

  for (const table of tables) {
    // Delete all rows (using a filter that matches everything)
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=neq.00000000-0000-0000-0000-000000000000`, {
      method: 'DELETE',
      headers,
    });
    log(res.ok ? 'OK' : 'WARN', `${table} — ${res.status}`);
  }

  // Delete user_profiles (except platform admin)
  const profRes = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?role=neq.PLATFORM_ADMIN`, {
    method: 'DELETE',
    headers,
  });
  log(profRes.ok ? 'OK' : 'WARN', `user_profiles (non-platform) — ${profRes.status}`);

  // Delete hospitals
  const hospRes = await fetch(`${SUPABASE_URL}/rest/v1/hospitals?id=neq.00000000-0000-0000-0000-000000000000`, {
    method: 'DELETE',
    headers,
  });
  log(hospRes.ok ? 'OK' : 'WARN', `hospitals — ${hospRes.status}`);

  // Delete auth users (non-platform) via admin API
  const usersRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
    },
  });
  if (usersRes.ok) {
    const usersData = await usersRes.json();
    const users = usersData.users || usersData;
    let deleted = 0;
    for (const user of users) {
      const meta = user.app_metadata || {};
      if (meta.role !== 'PLATFORM_ADMIN') {
        const delRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
          },
        });
        if (delRes.ok) deleted++;
      }
    }
    log('OK', `Deleted ${deleted} non-platform auth users`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const serviceRoleKey = process.argv[2];
  if (!serviceRoleKey) {
    console.error('Usage: node postman/test-collection.mjs <service_role_key>');
    console.error('  Get the key from: npx supabase status');
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('  HospitalOS Postman Collection Test Runner');
  console.log('='.repeat(60));

  // Check Supabase is reachable
  try {
    const health = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: { 'apikey': serviceRoleKey },
      signal: AbortSignal.timeout(5000),
    });
    log('OK', `Supabase reachable (${health.status})`);
  } catch {
    console.error('\n  ERROR: Cannot reach Supabase at ' + SUPABASE_URL);
    console.error('  Run: npx supabase start');
    process.exit(1);
  }

  // Load collection
  const fs = await import('fs');
  const path = await import('path');
  const collectionPath = path.join(import.meta.dirname, 'HospitalOS.postman_collection.json');
  const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

  // Phase 1: Validate structure
  const structureOk = validateStructure(collection);
  if (!structureOk) {
    console.error('\n  Structure validation failed. Fix collection before running API tests.');
    process.exit(1);
  }

  // Phase 0: Clean existing data
  await cleanDatabase(serviceRoleKey);

  // Phase 2: Run API tests
  const allPassed = await runCollection(collection, serviceRoleKey);

  console.log('\n' + '='.repeat(60));
  console.log(allPassed ? '  ALL TESTS PASSED' : '  SOME TESTS FAILED');
  console.log('='.repeat(60) + '\n');

  process.exit(allPassed ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
