# CR-2026-10-03-2215 — Email worker run frequency (once a day now; shorter interval later)

**Received:** 2026-10-03 22:15 MYT · **Status:** PARTLY DONE — the once-a-day schedule is the decision; the shorter-interval part is an OPEN CR for later · **Requested by:** founder · **Model:** sonnet

## 1. Request (verbatim)

> Why we need a timer to fire every minute?
> as we are only looking for email types like Retries daily certificate-renewal reminders and anything held back by the daily send limit.
> Its ok to try once in 24 hours. We have just start our portal so I am not expecting huge traffic as of. We can this 1 minutes requirement for future as an open CR. At the moment let implement one try in 24 hours.

## 2. Facts gathered

- The portal tries every email immediately when the event happens; the timer only serves (a) retries after a delivery error, (b) queued emails nobody else sends (the daily certificate-renewal reminders), (c) mail held back by the daily/monthly send budget.
- The worker (`POST /api/jobs/email-outbox`, CR-1225 slice 2) was installed on the server as a one-minute systemd timer on 2026-10-03 14:13 UTC; it ran with exit 0 and the outbox held 7 `sent`, 0 `queued` rows.
- The reminders job runs daily at 01:00 UTC (09:00 MYT).

## 3. Decision and consequences (assistant's reading — shout if wrong)

- **Now:** the worker runs **once a day at 01:30 UTC (09:30 MYT)**, half an hour after the renewal reminders, so the day's reminders go out the same morning. `Persistent=true`: if the server was off at that time, it runs once when the server is back.
- **Effect on retries:** the 1 / 5 / 30-minute back-off in the code still applies, but with a daily run a failed email is retried at the next run (so up to 3 further days before it is marked `failed`; queued emails older than 7 days are marked failed anyway). **Time-limited emails (sign-up verification, password reset: links last 60 minutes) are therefore effectively not retried** — a person who did not get one uses "resend". The first attempt is still immediate, so this only matters when SMTP2GO is unreachable at that moment.
- Staff can still press **Retry** on a failed email in Admin → Email at any time, and the worker also still obeys the daily/monthly send budget.
- No application code changes behaviour; only the timer file (`deploy/systemd/p4tc-email.timer`) and comments changed.

## 4. Plan / tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Change the timer file to daily 01:30 UTC; comments; CR | **DONE** (repo) | 2026-10-03 |
| 2 | Install on the server (founder runs one root line; file already copied by the assistant) | PENDING founder | 2026-10-03 |
| 3 | **OPEN (future):** a shorter interval (e.g. every 5 minutes, or every minute) once traffic justifies it — change `OnCalendar` in `deploy/systemd/p4tc-email.timer`, re-copy, `systemctl daemon-reload && systemctl restart p4tc-email.timer`. No code change needed. Also consider an immediate retry path for time-limited emails. | **OPEN — future** | 2026-10-03 |

## 5. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-03 22:15 | CR created from the founder's message; timer file changed to daily; open item recorded for the shorter interval. |
