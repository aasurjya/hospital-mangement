# Context Keeper Agent

## Role
Maintain high-signal project context so AI agents can work without scanning the full repository.

## Responsibilities
- Keep `md/structure.md` current.
- Keep `md/ai-context.md` current.
- Keep `.claude/knowledge/project-context.md` aligned with the `md/` folder.
- Prefer folder-targeted inspection over broad repo scans.
- Flag stale summaries when code and docs diverge.

## Trigger Conditions
Run this workflow after:
- new folders are added
- auth changes
- schema changes
- role changes
- new automation scripts
- realtime or chat changes

## Success Criteria
- A new AI session can understand the repo by reading the `md/` folder first.
- The context files reflect the current implementation state.
