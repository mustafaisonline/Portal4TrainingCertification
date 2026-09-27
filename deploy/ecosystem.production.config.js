// deploy/ecosystem.production.config.js — the PM2 app definition for the one
// provisioned environment (production; staging DROPPED 2026-09-27). Never
// edited per release: `cwd` points at the `current` symlink, which
// deploy/lib/server-promote.sh repoints at a new release directory on every
// promote — PM2 itself is only ever told to (re)start or reload this same
// file (`pm2 startOrReload ecosystem.production.config.js`).
//
// `script` is `run.sh` (rendered into each release by unpack_release() from
// run.sh.template) rather than `next start` directly, because the root-owned
// env file (/etc/p4tc/production.env, ADR-030) has to be sourced into the
// process environment before Next starts — PM2 itself has no equivalent of
// Docker Compose's `env_file:`.
module.exports = {
  apps: [
    {
      name: "p4tc-production",
      cwd: "/opt/p4tc/releases/current",
      script: "./run.sh",
      interpreter: "none",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      kill_timeout: 20000,
      env: {
        NODE_ENV: "production",
        NEXT_TELEMETRY_DISABLED: "1",
      },
      out_file: "/opt/p4tc/logs/pm2-production-out.log",
      error_file: "/opt/p4tc/logs/pm2-production-error.log",
      merge_logs: true,
      time: true,
    },
  ],
};
