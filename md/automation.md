# Automation Rules

## Goal
Reduce unnecessary full-repo scanning by keeping small, current markdown context files that AI can read first.

## Required Files To Keep Updated
- `md/structure.md`
- `md/ai-context.md`
- `md/ai-clinical-assistant.md`
- `md/pre-build-roadmap.md`
- `.claude/knowledge/project-context.md`
- `.claude/knowledge/ai-clinical-safety.jsonl`

## When To Update Context
Update the context files whenever any of the following changes:
- New top-level folders are added
- A major module is introduced
- Roles or permission rules change
- Auth logic changes
- Database structure changes
- Realtime or messaging architecture changes
- AI safety rules change
- AI prompt or evaluation strategy changes
- Deployment strategy changes
- New scripts are added that AI should prefer

## Update Checklist
1. Update `md/structure.md` if folder structure changed.
2. Update `md/ai-context.md` if product rules or architecture changed.
3. Update `md/ai-clinical-assistant.md` if AI scope, safety, or rollout changes.
4. Update `md/pre-build-roadmap.md` if build sequencing changes.
5. Mirror the important summary into `.claude/knowledge/project-context.md`.
6. Update `.claude/knowledge/ai-clinical-safety.jsonl` if AI rules change.
7. If a new repeated task appears, add a workflow in `.windsurf/workflows/`.

## Search Strategy For AI
1. Read `md/ai-context.md`.
2. Read `md/structure.md`.
3. Read `md/ai-clinical-assistant.md` for AI-related work.
4. Read `md/pre-build-roadmap.md` for sequencing decisions.
5. Read `.claude/knowledge/project-context.md`.
6. Search only the most relevant folder.
7. Avoid broad repo-wide searches unless the context files are outdated.

## Future Automation Targets
- Script to regenerate `md/structure.md` from the filesystem
- Script to sync `md/ai-context.md` summary into `.claude/knowledge/project-context.md`
- Script to validate required project folders
- Script to seed platform admin from env
- Script to validate AI knowledge files and prompt versions
- Script to run offline AI safety and regression evaluations

## Constraint
Context files are summaries, not replacements for source code. If there is a conflict, source code wins and the context files must be corrected in the same task.
