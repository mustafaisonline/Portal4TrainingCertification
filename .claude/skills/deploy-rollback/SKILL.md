---
name: deploy-rollback
description: Roll production back to the previous release using the governed rollback (deploy/07-rollback.sh). Use when a deploy misbehaves after going live.
---

Confirm the working directory is the repository, `git status` is clean, and the remote is `mustafaisonline/Portal4TrainingCertification`. Prefix Node commands with `export PATH="/opt/homebrew/opt/node@24/bin:$PATH"`. Read `deploy/README.md` and the latest deploy CR (e.g. CR-2026-10-02-0710) first. Deploy only on the founder's word or in Buddy Autonomous mode. Never use or add a bypass flag.

Read `deploy/README.md` on rollback first. Use `deploy/07-rollback.sh` via the governed path (signed token). `--restore-db` restores the database from backup and is **destructive**: require the founder's explicit word for it every time. After rollback, verify health, record it in the CR and `PROJECT_STATUS.md`, and report the cause.
