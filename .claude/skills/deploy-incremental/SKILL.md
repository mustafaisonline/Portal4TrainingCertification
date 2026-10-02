---
name: deploy-incremental
description: Deploy the latest changes to production as an incremental (delta) release with deploy/start.sh. Use for any normal deploy after the first one.
---

Confirm the working directory is the repository, `git status` is clean, and the remote is `mustafaisonline/Portal4TrainingCertification`. Prefix Node commands with `export PATH="/opt/homebrew/opt/node@24/bin:$PATH"`. Read `deploy/README.md` and the latest deploy CR (e.g. CR-2026-10-02-0710) first. Deploy only on the founder's word or in Buddy Autonomous mode. Never use or add a bypass flag.

Incremental behaviour is built in: when a `current` release exists, only changes are uploaded against it (`deploy/05-deploy.sh`).
1. Tag the commit that carries the changes (`vYYYY.MM.DD-N`, next free N; check `git tag`). 2. Optional rehearsal: `deploy/start.sh --dry-run --env production --tag <tag>`. 3. Deploy: `deploy/start.sh --env production --tag <tag>` (add `--auto-approve` only when the founder said so; it skips prompts only, every gate still runs). 4. Verify the live site and `/api/health`, and the specific change. 5. Update the CR(s) and `docs/execution/PROJECT_STATUS.md` with the tag. 6. The tool offers/prints the GitHub push; push only per the founder's word or Autonomous mode.
If the gate fails, fix the root cause (a failing test is a real catch), re-tag with a new N; never bypass.
