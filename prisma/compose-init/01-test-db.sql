-- Runs once when the Compose volume is first created: adds the separate test
-- database alongside POSTGRES_DB (p4tc_dev). Mirrors what `createdb p4tc_test`
-- does on the Homebrew service.
CREATE DATABASE p4tc_test OWNER portal;

-- Session timezone MUST be UTC: the Prisma pg adapter sends zone-less
-- timestamps, which PostgreSQL interprets in the session timezone. Found
-- 2026-09-21 (every app-written timestamp 8 h early on a KL-zoned instance).
-- tests/integration/timestamps.test.ts guards this.
ALTER DATABASE p4tc_dev SET timezone TO 'UTC';
ALTER DATABASE p4tc_test SET timezone TO 'UTC';
