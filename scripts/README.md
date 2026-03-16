# Scripts

This folder is reserved for automation scripts.

## Planned Scripts
- `refresh-context`
  - Rebuild or validate `md/structure.md`
  - Sync important context into `.claude/knowledge/project-context.md`
- `seed-platform-admin`
  - Seed the platform admin user from env
- `validate-folders`
  - Ensure required app and infra folders exist
- `sync-ai-knowledge`
  - Sync AI architecture decisions into `.claude/knowledge/ai-clinical-safety.jsonl`
  - Validate that `prime` references the active AI knowledge files
- `run-ai-evals`
  - Execute offline clinical-assistant evaluation cases
  - Report regression results for safety and usefulness
- `validate-context`
  - Check that `md/` and `.claude/knowledge/` files are aligned

## Working Rule
Any new script added here should also be mentioned in `md/automation.md` if AI agents should prefer it during future tasks.
