#!/usr/bin/env python3
"""PreToolUse guard (CR-2026-10-03-1122, capability gap G2).

Turns the critical CLAUDE.md rules from prose into enforcement. Reads the tool
call as JSON on stdin and prints a permission decision ONLY when a rule applies;
otherwise prints nothing, so normal permission handling continues.
  deny : git add -A/./--all - force-push - git reset --hard - git clean -f -
         git checkout -- . - database reset - recursive delete of protected folders -
         schema/migration edits without an OPEN CR spec carrying
         'SCHEMA CHANGE APPROVED BY FOUNDER'
  ask  : database restore (deploy rollback --restore-db)
  warn : application code edited with no CR modified or created today (context only)
Quoted strings and heredoc bodies in a Bash command are treated as data, not commands
(except when passed to bash -c / eval / xargs), so a commit message or document may
mention a forbidden command without tripping the guard.
Registered in .claude/settings.json (PreToolUse, matchers Bash and Edit|Write|MultiEdit|NotebookEdit).
"""
import datetime, glob, json, os, re, subprocess, sys

d = json.load(sys.stdin)
tool = d.get("tool_name", "")
ti = d.get("tool_input", {}) or {}
root = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
REF = " [guard hook: .claude/hooks/guard.py]"


def decide(decision, reason):
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": decision, "permissionDecisionReason": reason + REF}}))
    sys.exit(0)


def context(msg):
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse", "additionalContext": msg + REF}}))
    sys.exit(0)


def scan_text(c):
    """What to match the Bash rules against.
    1. Heredoc bodies are data (documents, Python/SQL scripts) and are blanked,
       UNLESS the heredoc is fed to a shell (bash/sh/zsh <<EOF), where it runs.
    2. On what remains, quoted strings are data and are blanked, UNLESS the
       command hands text to an evaluator (bash/sh/zsh -c, eval, xargs, source,
       a pipe into a shell), where quoted text is executable.
    A brake against accident and drift, not a lock: text executed indirectly
    from inside a script (e.g. subprocess in Python) is not seen."""
    def heredoc(m):
        lead = m.group(1)
        return m.group(0) if re.search(r"\b(bash|sh|zsh)\b", lead) else lead + " <<HEREDOC>>"
    s = re.sub(r"([^\n]*<<-?\s*['\"]?(\w+)['\"]?[ \t]*\n).*?\n\2[ \t]*$", heredoc, c, flags=re.S | re.M)
    if re.search(r"\b(bash|sh|zsh)\s+-l?c\b|\beval\b|\bxargs\b|\bsource\b|\|\s*(ba|z)?sh\b", s):
        return s
    s = re.sub(r"'[^']*'", "''", s)
    s = re.sub(r'"(?:[^"\\]|\\.)*"', '""', s)
    return s


if tool == "Bash":
    c = scan_text(ti.get("command", "") or "")
    deny = [
        (r"\bgit\s+add\s+(-A|--all|\.)(?=\s|$|[\"';&|)])", "`git add -A`, `git add .` and `--all` are forbidden: stage files by name (CLAUDE.md, repository protection)."),
        (r"\bgit\s+push\b[^\n;&|]*(\s--force(?=\s|$|[\"';&|)])|\s-f(?=\s|$|[\"';&|)])|--force-with-lease)", "Force-push is forbidden."),
        (r"\bgit\s+reset\s+--hard", "`git reset --hard` is forbidden (destructive; CLAUDE.md destructive-action protection)."),
        (r"\bgit\s+clean\b[^\n;&|]*\s-[a-zA-Z]*f", "`git clean -f` is forbidden (destructive)."),
        (r"\bgit\s+checkout\s+--\s+\.(?=\s|$|[\"';&|)])", "`git checkout -- .` discards every change; name the files instead."),
        (r"prisma\s+migrate\s+reset|npm\s+run\s+db:reset|prisma\s+db\s+push\b[^\n]*--force-reset", "Database reset is forbidden: it destroys data (RED gate)."),
        (r"\brm\s+-[a-zA-Z]*[rR][a-zA-Z]*\s+(\S+\s+)*\.?/?(prisma|CR|framework|\.git|deploy|src|app|docs)(/|\s|$)", "Recursive delete of a protected folder is forbidden."),
    ]
    for pattern, why in deny:
        if re.search(pattern, c):
            decide("deny", why)
    if re.search(r"rollback[^\n]*--restore-db", c):
        decide("ask", "Database restore is destructive: it needs the founder's explicit word for this run.")
    sys.exit(0)

if tool in ("Edit", "Write", "MultiEdit", "NotebookEdit"):
    f = ti.get("file_path", "") or ""
    rel = os.path.relpath(f, root) if os.path.isabs(f) else f
    if rel == "prisma/schema.prisma" or rel.startswith("prisma/migrations/"):
        approved = False
        for spec in glob.glob(os.path.join(root, "CR", "specs", "*.md")):
            try:
                text = open(spec, encoding="utf-8", errors="ignore").read()
            except OSError:
                continue
            if "SCHEMA CHANGE APPROVED BY FOUNDER" not in text:
                continue
            cr = os.path.join(root, "CR", os.path.basename(spec).replace("CR-SPEC-", "CR-", 1))
            if not os.path.exists(cr):
                continue
            head = open(cr, encoding="utf-8", errors="ignore").read(2000)
            if re.search(r"\*\*Status:\*\*[^\n]*(DEPLOYED|DONE|CLOSED)", head):
                continue
            approved = True
            break
        if not approved:
            decide("deny", "Physical data-model change (CLAUDE.md Rule 1): no OPEN CR spec in CR/specs/ carries the line 'SCHEMA CHANGE APPROVED BY FOUNDER'. Run the schema-proposal skill, get the founder's approval in chat, record it in the spec, then retry.")
        context("Schema edit permitted by an approved, open CR spec. Keep the change exactly as approved (additive unless the approval says otherwise) and update framework/metadata/technical/table-*.md.")
    if re.match(r"(src|app|prisma|tests|deploy)/", rel):
        today = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=8)).strftime("%Y-%m-%d")
        try:
            dirty = subprocess.run(["git", "status", "--porcelain", "--", "CR"], cwd=root, capture_output=True, text=True, timeout=5).stdout.strip()
        except Exception:
            dirty = ""
        if not dirty and not glob.glob(os.path.join(root, "CR", f"CR-{today}-*.md")):
            context("WARNING: you are editing application code but no CR file is modified or was created today. CLAUDE.md requires a CR before code: create one with the new-cr skill, or state which open CR this edit belongs to and touch its progress log.")
    sys.exit(0)
