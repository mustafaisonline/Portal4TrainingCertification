---
name: deploy-audit
description: Run the read-only deploy audit (GO/NO-GO) for production. Use before a deploy or to check server readiness.
---

Confirm the working directory is the repository, `git status` is clean, and the remote is `mustafaisonline/Portal4TrainingCertification`. Prefix Node commands with `export PATH="/opt/homebrew/opt/node@24/bin:$PATH"`. Read `deploy/README.md` and the latest deploy CR (e.g. CR-2026-10-02-0710) first. Deploy only on the founder's word or in Buddy Autonomous mode. Never use or add a bypass flag.

Run `deploy/start.sh --audit --env production`. Read `deploy/reports/` and report GO/NO-GO with reasons. It changes nothing.
