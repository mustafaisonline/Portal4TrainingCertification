---
name: deploy-full
description: Run a full (first-time or from-scratch) deploy: server bootstrap check, full release upload, and verification. Use for the first deploy to a new server or when no current release exists.
---

Confirm the working directory is the repository, `git status` is clean, and the remote is `mustafaisonline/Portal4TrainingCertification`. Prefix Node commands with `export PATH="/opt/homebrew/opt/node@24/bin:$PATH"`. Read `deploy/README.md` and the latest deploy CR (e.g. CR-2026-10-02-0710) first. Deploy only on the founder's word or in Buddy Autonomous mode. Never use or add a bypass flag.

A full deploy is what the pipeline does automatically when the server has no `current` release (full upload instead of a delta). Server bootstrap (`deploy/10-server-bootstrap-serverscript.sh`) is run **as root on the server by the founder**; never attempt it yourself. Steps: run `deploy-audit` first; confirm bootstrap state from `00-discovery.sh` output; then follow `deploy-incremental` steps 1–6. A new server also needs the founder to type secrets into `/etc/p4tc/production.env` (never transmitted by this framework). Provisioning or changing production infrastructure is a RED gate: stop and ask.
