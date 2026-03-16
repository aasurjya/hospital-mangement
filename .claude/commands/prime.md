---
description: Load the hospital platform context before planning or implementation
---

# Knowledge Prime

Run this command at the start of every task.

## Purpose

Load the smallest set of high-signal context first so AI agents do not need to scan the entire repository.

## Required Read Order

1. `md/ai-context.md`
2. `md/structure.md`
3. `md/automation.md`
4. `md/ai-clinical-assistant.md`
5. `md/pre-build-roadmap.md`
6. `.claude/knowledge/project-context.md`
7. Relevant `.claude/knowledge/*.jsonl` files

## Knowledge Files

- `.claude/knowledge/web-patterns.jsonl`
- `.claude/knowledge/supabase-patterns.jsonl`
- `.claude/knowledge/hospital-platform-decisions.jsonl`
- `.claude/knowledge/ai-clinical-safety.jsonl`

## What To Extract

- Critical rules
- Security constraints
- Multi-tenant rules
- Architectural decisions
- Current open questions

## Critical Rules For This Project

- All hospital-scoped data must be isolated by `hospitalId`.
- Platform admin can access all hospitals and cross-tenant views.
- Hospital admin can only manage one hospital.
- Passwords must be hashed, never stored in plain text.
- Temporary passwords may be shown once during creation or reset, then never stored in readable form.
- Chat and document exchange must enforce hospital membership and role-based access.
- Audit logs are required for user creation, password resets, and role changes.
- AI is clinician-assistive only and must not act autonomously.
- AI outputs require human review, explainability, and audit logs.

## Usage

### Step 1: Read Context Docs

Read the `md/` folder and `.claude/knowledge/project-context.md` before any broad search.

### Step 2: Read Knowledge Files

```bash
python3 -c "
import json

files = [
    '.claude/knowledge/web-patterns.jsonl',
    '.claude/knowledge/supabase-patterns.jsonl',
    '.claude/knowledge/hospital-platform-decisions.jsonl',
    '.claude/knowledge/ai-clinical-safety.jsonl',
]

categories = {'must_follow': [], 'gotcha': [], 'pattern': [], 'decision': [], 'security': [], 'performance': []}

for path in files:
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if line:
                    fact = json.loads(line)
                    fact_type = fact.get('type', 'pattern')
                    if fact_type in categories:
                        categories[fact_type].append(fact)
    except FileNotFoundError:
        pass

print('# Loaded Knowledge Base Facts\n')
for category, facts in categories.items():
    if facts:
        print(f'## {category.upper().replace(\"_\", \" \")} ({len(facts)} facts)\n')
        for fact in facts:
            conf = fact.get('confidence', 'medium')
            tags = ', '.join(fact.get('tags', []))
            print(f'- [{conf}] {fact[\"fact\"]}')
            if tags:
                print(f'  Tags: {tags}')
        print()
"
```

### Step 3: Filter By Topic

```bash
python3 -c "
import json, sys

keyword = sys.argv[1].lower() if len(sys.argv) > 1 else ''
files = [
    '.claude/knowledge/web-patterns.jsonl',
    '.claude/knowledge/supabase-patterns.jsonl',
    '.claude/knowledge/hospital-platform-decisions.jsonl',
    '.claude/knowledge/ai-clinical-safety.jsonl',
]

for path in files:
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                fact = json.loads(line)
                haystack = fact['fact'].lower()
                tags = [t.lower() for t in fact.get('tags', [])]
                if not keyword or keyword in haystack or any(keyword in t for t in tags):
                    print(f\"[{fact.get('type', 'pattern')}] {fact['fact']}\")
    except FileNotFoundError:
        pass
" -- <KEYWORD>
```

## Output Format

```markdown
# Knowledge Base Loaded

_N facts loaded from 4 files_

## MUST FOLLOW
- [high] All hospital data is scoped by `hospitalId` unless the actor is `PLATFORM_ADMIN`
- [high] Passwords are hashed and never stored in plain text
- [high] AI is assistive only and requires clinician review

## SECURITY
- [high] RLS must be enforced on hospital-scoped tables
- [high] Audit log sensitive account actions
- [high] AI requests must run server-side and minimize PHI exposure

## DECISIONS
- [high] Stack is Next.js + TypeScript + Supabase
- [high] Chat is socket-based with document sharing
- [high] AI uses deterministic red-flag rules plus retrieval-guided LLM assistance

## Verification

After priming, confirm you can answer:

1. Which roles and scopes apply to this task?
2. Which folders are relevant without scanning the whole repo?
3. Which security and multi-tenant rules constrain the implementation?
4. Which AI safety rules constrain the implementation?
5. Which context files need updating if architecture changes?
