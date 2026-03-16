# Start Task

Determine task complexity and use the appropriate workflow. This is the entry point for every development session.

## Usage

```text
/start-task <task-description>
```

## Steps

### 0. Pre-Task Checklist

**Context Recovery Check**:

- [ ] Check `git status` — any in-progress work?
- [ ] Check `git log --oneline -3` — what was last done?
- [ ] If active work exists: ask user "Resume previous work or start fresh?"

**Knowledge Priming**:

- [ ] Run `/prime` to load knowledge base facts
- [ ] Read `md/ai-context.md` and `md/structure.md`
- [ ] Review role scope, hospital isolation, and security constraints before proceeding

**PR Check**:

- [ ] Check if there are active PRs with pending comments:
  ```bash
  gh pr list --author @me --state open
  ```
- [ ] For each open PR, check for unresolved comments before starting new work

### 1. Task Assessment

Consider:
- Number of files likely to be modified
- Whether database/migration changes are needed
- Whether new Supabase tables, storage buckets, or RLS policies are required
- Whether new Next.js routes, layouts, or API handlers are required
- Whether auth/session/role logic changes
- Impact on existing functionality
- Whether it touches multi-tenant safety (`hospitalId` scoping)
- Testing requirements

Then confirm with user:

> **Proposed complexity**: [Simple / Complex] — Does this match your expectation?

**Simple Task (streamlined flow):**

- Bug fixes
- Small UI tweaks (color, padding, copy changes)
- Simple configuration updates
- Small form, component, or docs updates

**Complex Task (full checklist):**

- New feature routes or dashboards
- New Supabase tables or migrations
- Changes to authentication/authorization/routing
- Multi-file refactoring
- New role-based screens
- Realtime chat or document sharing
- Cross-hospital or platform-level functionality

### 1.5. Problem Definition Phase

Before implementation, ensure the problem is well-defined:

**If a GitHub Issue exists:**

```bash
gh issue view <number> --json title,body,labels,comments
```

Extract and verify:
- Clear scope (what's in, what's out)
- Definition of Done items (verifiable acceptance criteria)
- File scope (which files will be affected)
- Human checkpoints (where to pause for review)

**If no GitHub Issue exists:**

- For **simple tasks**: No issue needed. Proceed.
- For **complex tasks**: Ask:
  > "This is a complex task. Should I create a GitHub Issue to track it?"

**If the problem is unclear:**

- Run `/brainstorm` to refine the idea into a design
- After brainstorm commits a design document, run `/review-design` (5-agent parallel review)
- Wait for ALL APPROVED before proceeding to planning

### 2. Simple Task Flow

Essential steps:

- [ ] Run `/prime` to load knowledge base
- [ ] Read relevant files before touching them
- [ ] Check existing patterns for similar functionality
- [ ] Make the change following existing patterns
- [ ] Check against current context files for multi-tenant, auth, and security constraints
- [ ] Run the validation commands relevant to the current stack
- [ ] Write/update tests if logic changes
- [ ] Update context docs if structure or architecture changed

### 3. Complex Task Flow

Full workflow:

1. **Plan First** — Use `/plan` command (invokes `planner` agent)
2. **Design Review Gate (if new feature)** — `/review-design <design-doc>` — all 5 agents APPROVED
3. **TDD** — Write tests before implementation where practical
4. **Implement** — Follow the plan
5. **Validate** — run lint, tests, and build commands appropriate to the current stack
6. **Code Review** — review changed files against security and architecture rules
7. **UX Review** (if UI changed) — `/ux-review <screen-file>`
8. **Supabase Review** (if DB changed) — `/supabase-review`
9. **Self-Reflect** — `/self-reflect` to extract learnings
10. **PR** — Create with comprehensive description

**Pre-Implementation Checklist:**

- [ ] Migration needed? (New table, column, index, RLS policy, storage rule)
- [ ] New route or layout segment needed?
- [ ] New role-based access rule needed?
- [ ] `hospitalId` on all tenant-scoped tables?
- [ ] RLS policies on new tables?
- [ ] RLS policies on storage paths if files are involved?
- [ ] Audit logging needed for sensitive actions?
- [ ] Pagination on new list screens?
- [ ] Empty, error, and loading states covered?
- [ ] Context docs need updating after implementation?

### 4. Task Escalation

If a "simple task" becomes complex during implementation:

- Stop and reassess
- Create a GitHub Issue if not already done
- Switch to full workflow
- Inform user of complexity change
- Consider breaking into multiple PRs

### 5. Per-Task Quality Gates

Before marking ANY task complete:

```bash
# MANDATORY — choose the commands relevant to the current stack
npm run lint
npm run test
npm run build
```

For Supabase changes:
```bash
supabase migration list  # Confirm migration applied
```

