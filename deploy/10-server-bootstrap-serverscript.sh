#!/usr/bin/env bash
# =============================================================================
# 10-server-bootstrap-serverscript.sh   (run on: SERVER, as root, once —
# re-runnable; every step is idempotent)
#
# Turns a fresh Ubuntu 24.04 DigitalOcean Droplet into the governed host
# described in MILESTONE_11_EXECUTION_PLAN.md §2 item 2 (K2, K4, K5, K8, K9,
# K12; K2/K6/K9 supersession 2026-09-27 — rsync + PM2, no Docker/registry):
#   packages   Node.js (NODE_MAJOR), PM2 (global), Caddy, postgresql-client-16,
#              ufw, unattended-upgrades, curl, openssl
#   users      `deploy` (no password, SSH key copied from root)
#   layout     /etc/p4tc  (root-owned: env file, HMAC key)
#              /opt/p4tc  (deploy/, backups/, staging/, releases/, markers/, logs/)
#   wrapper    /usr/local/bin/p4tc-deploy  — the only sudo entry for deploy
#   sudoers    deploy ALL=(root) NOPASSWD: p4tc-deploy promote|rollback *,
#              plus the narrow pm2 commands the wrapper runs on deploy's behalf
#   caddy      /etc/caddy/Caddyfile from deploy/Caddyfile.example
#   systemd    p4tc-reminders.timer (01:00 UTC → POST /api/jobs/certificate-reminders)
#              p4tc-backup.timer   (02:00 UTC → 01-backup for production)
#              pm2 startup (deploy's PM2 process list survives a reboot)
#   firewall   ufw: 22, 80, 443
#
# First run, from the laptop (as root, before `deploy` exists):
#   rsync -az deploy/ root@<droplet>:/opt/p4tc/deploy/
#   ssh root@<droplet> 'bash /opt/p4tc/deploy/10-server-bootstrap-serverscript.sh --domain <apex>'
# Then copy /etc/p4tc/governance-hmac.key to deploy/.governance-hmac.key
# on the laptop (chmod 600) and type the env file (§3 of deploy/README.md).
# (eCard 10-runtime-privileges + 11-deployment-governance, merged)
# =============================================================================
set -euo pipefail
[ "$(id -u)" -eq 0 ] || { echo "must run as root" >&2; exit 1; }
DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck disable=SC1091
. "$DEPLOY_DIR/config.env"; [ -f "$DEPLOY_DIR/config.local.env" ] && . "$DEPLOY_DIR/config.local.env"
ETC="/etc/p4tc"; OPT="/opt/p4tc"; WRAPPER="/usr/local/bin/p4tc-deploy"
DOMAIN_ARG=""
while [ $# -gt 0 ]; do case "$1" in --domain) DOMAIN_ARG="$2"; shift 2 ;; *) echo "unknown $1" >&2; exit 1 ;; esac; done
DOMAIN="${DOMAIN_ARG:-$DOMAIN}"
case "$DOMAIN" in *"<"*|"") echo "pass --domain <apex-domain> (config.env still has a placeholder)" >&2; exit 1 ;; esac
log() { printf '\033[34m[bootstrap] %s\033[0m\n' "$*" >&2; }

log "1/8 packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ca-certificates curl gnupg openssl ufw unattended-upgrades postgresql-client-16 debian-keyring debian-archive-keyring apt-transport-https >/dev/null
if ! command -v node >/dev/null || [ "$(node --version | cut -c2- | cut -d. -f1)" != "${NODE_MAJOR:-24}" ]; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR:-24}.x" | bash - >/dev/null
  apt-get install -y -qq nodejs >/dev/null
fi
command -v pm2 >/dev/null || npm install -g pm2 >/dev/null
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' >/etc/apt/sources.list.d/caddy-stable.list
  apt-get update -qq; apt-get install -y -qq caddy >/dev/null
fi
log "node $(node --version) · npm $(npm --version) · pm2 $(pm2 --version) · caddy $(caddy version | cut -d' ' -f1) · pg_dump $(pg_dump --version | awk '{print $3}')"

log "2/8 deploy user"
id deploy >/dev/null 2>&1 || adduser --disabled-password --gecos "p4tc deploy" deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
[ -s /home/deploy/.ssh/authorized_keys ] || { cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys; chown deploy:deploy /home/deploy/.ssh/authorized_keys; chmod 600 /home/deploy/.ssh/authorized_keys; }
gpasswd -d deploy sudo >/dev/null 2>&1 || true

log "3/8 layout"
install -d -m 750 -o root -g deploy "$ETC"
install -d -m 755 "$OPT"
install -d -m 755 -o deploy -g deploy "$OPT/deploy" "$OPT/logs"
install -d -m 750 -o deploy -g deploy "$OPT/backups" "$OPT/staging"
install -d -m 755 -o root -g deploy "$OPT/releases"
install -d -m 755 "$OPT/markers" "$OPT/markers/production"
chown -R deploy:deploy "$OPT/deploy"; chmod +x "$OPT/deploy"/*.sh "$OPT/deploy"/lib/*.sh 2>/dev/null || true
if [ ! -s "$ETC/governance-hmac.key" ]; then openssl rand -hex 32 >"$ETC/governance-hmac.key"; log "generated HMAC key"; fi
chown root:root "$ETC/governance-hmac.key"; chmod 600 "$ETC/governance-hmac.key"
f="$ETC/production.env"
if [ ! -f "$f" ]; then
  cat >"$f" <<EOF
# production environment — Training & Certification Portal. ROOT-OWNED (root:deploy 0640).
# Names from .env.example; VALUES ARE TYPED HERE BY THE FOUNDER, NEVER SENT THROUGH THE FRAMEWORK (ADR-030).
# Generate: openssl rand -base64 32   (BETTER_AUTH_SECRET, PROFILE_ENCRYPTION_KEY, JOBS_SECRET)
DATABASE_URL=
BETTER_AUTH_SECRET=
APP_BASE_URL=https://$DOMAIN
PROFILE_ENCRYPTION_KEY=
EMAIL_TRANSPORT=log
JOBS_SECRET=
# LIVE restricted key (rk_live_) with exactly: Checkout Sessions write, Refunds write, PaymentIntents/Charges/Balance transactions read
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
# Set only when counsel has published the legal documents (registration stays closed otherwise):
# LEGAL_DOCUMENT_VERSIONS={"terms":"<version>","privacy":"<version>"}
# ENQUIRY_NOTIFY_EMAIL=
EOF
  log "wrote names-only template $f — fill the values"
fi
chown root:deploy "$f"; chmod 640 "$f"

log "4/8 wrapper + sudoers"
cat >"$WRAPPER" <<EOF
#!/usr/bin/env bash
# p4tc-deploy — the sole governed entry point on this server (root, via sudo by deploy).
set -euo pipefail
[ "\$(id -u)" -eq 0 ] || { echo "ERROR: run via sudo" >&2; exit 1; }
[ "\${SUDO_USER:-}" = "deploy" ] || { echo "ERROR: only the deploy user may invoke p4tc-deploy" >&2; exit 1; }
cmd="\${1:-}"; shift || true
case "\$cmd" in
  promote|rollback) exec "$OPT/deploy/lib/server-promote.sh" "\$cmd" "\$@" ;;
  *) echo "usage: sudo -n p4tc-deploy promote|rollback --env E --tag T --governance-dir D [--restore-db F]" >&2; exit 1 ;;
esac
EOF
chown root:root "$WRAPPER"; chmod 755 "$WRAPPER"
PM2_BIN="$(command -v pm2)"
cat >/etc/sudoers.d/p4tc-deploy <<EOF
# p4tc governed deployment — least privilege (M11 K9)
Defaults:deploy !requiretty
deploy ALL=(root) NOPASSWD: $WRAPPER promote *
deploy ALL=(root) NOPASSWD: $WRAPPER rollback *
EOF
chmod 440 /etc/sudoers.d/p4tc-deploy; visudo -cf /etc/sudoers.d/p4tc-deploy >/dev/null
# No pm2-specific sudoers grant is needed: server-promote.sh runs as root
# (via the wrapper above) and root may always `sudo -u deploy -H pm2 ...`
# without a sudoers rule — that single, ordinary privilege-drop is what puts
# the app process under deploy's uid, never root's.

log "5/8 pm2 startup (survives reboot)"
env_line="$(su - deploy -c "pm2 startup systemd -u deploy --hp /home/deploy" 2>/dev/null | grep '^sudo ' || true)"
[ -n "$env_line" ] && eval "${env_line#sudo }" || true
su - deploy -c "pm2 save" >/dev/null 2>&1 || true

log "6/8 caddy"
sed -e "s/{{DOMAIN}}/$DOMAIN/g" -e "s/{{PRODUCTION_PORT}}/$PRODUCTION_PORT/g" "$DEPLOY_DIR/Caddyfile.example" >/etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile >/dev/null && systemctl enable --now caddy >/dev/null && systemctl reload caddy

log "7/8 systemd timers + firewall + unattended upgrades"
sed -e "s/{{DOMAIN}}/$DOMAIN/g" "$DEPLOY_DIR/systemd/p4tc-reminders.service" >/etc/systemd/system/p4tc-reminders.service
cp "$DEPLOY_DIR/systemd/p4tc-reminders.timer" /etc/systemd/system/p4tc-reminders.timer
sed -e "s#{{OPT}}#$OPT#g" "$DEPLOY_DIR/systemd/p4tc-backup.service" >/etc/systemd/system/p4tc-backup.service
cp "$DEPLOY_DIR/systemd/p4tc-backup.timer" /etc/systemd/system/p4tc-backup.timer
systemctl daemon-reload; systemctl enable --now p4tc-reminders.timer p4tc-backup.timer >/dev/null
ufw --force default deny incoming >/dev/null; ufw default allow outgoing >/dev/null
ufw allow 22/tcp >/dev/null; ufw allow 80/tcp >/dev/null; ufw allow 443/tcp >/dev/null; ufw --force enable >/dev/null
dpkg-reconfigure -f noninteractive unattended-upgrades >/dev/null 2>&1 || true

log "8/8 verification"
fail=0
su - deploy -c "test -w '$OPT/staging'" && log "OK deploy can write $OPT/staging" || { echo "FAIL staging not writable" >&2; fail=1; }
su - deploy -c "test -w '$ETC/production.env'" && { echo "FAIL production.env writable by deploy" >&2; fail=1; } || log "OK env file protected"
su - deploy -c "test -r '$ETC/production.env'" && log "OK env file readable by deploy (group)" || { echo "FAIL env file unreadable" >&2; fail=1; }
su - deploy -c "test -w '$OPT/releases'" && { echo "FAIL $OPT/releases writable by deploy" >&2; fail=1; } || log "OK releases directory protected (root-owned)"
su - deploy -c "sudo -n $WRAPPER" >/dev/null 2>&1 && { echo "FAIL wrapper accepted a bare call" >&2; fail=1; } || log "OK wrapper rejects bare invocation"
su - deploy -c "sudo -n $WRAPPER promote --env production --tag x --governance-dir /tmp" >/dev/null 2>&1 && { echo "FAIL promote without a valid bundle succeeded" >&2; fail=1; } || log "OK promote refuses without a valid bundle"
su - deploy -c "$PM2_BIN list" >/dev/null 2>&1 && log "OK deploy can run pm2 directly" || { echo "FAIL deploy cannot run pm2" >&2; fail=1; }
sudo -u deploy -H "$PM2_BIN" list >/dev/null 2>&1 && log "OK root can drop to deploy for pm2 (as server-promote.sh does)" || { echo "FAIL root cannot sudo -u deploy -H pm2" >&2; fail=1; }
systemctl is-active caddy >/dev/null && log "OK caddy active" || { echo "FAIL caddy" >&2; fail=1; }
[ "$fail" -eq 0 ] || { echo "bootstrap verification FAILED" >&2; exit 1; }

cat >&2 <<EOF

══ BOOTSTRAP COMPLETE ══
Next, on the laptop:
  ssh root@$SERVER_HOST cat $ETC/governance-hmac.key > deploy/.governance-hmac.key && chmod 600 deploy/.governance-hmac.key
On this server, as root (values are typed here and nowhere else):
  nano $ETC/production.env   # live restricted key, production database
Create the databases on the managed cluster (UTC!):  p4tc_production, $SANDBOX_DB_NAME
Then from the laptop:  deploy/start.sh --audit --env production
EOF
