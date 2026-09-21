-- Runs once when the Compose volume is first created: adds the separate test
-- database alongside POSTGRES_DB (p4tc_dev). Mirrors what `createdb p4tc_test`
-- does on the Homebrew service.
CREATE DATABASE p4tc_test OWNER portal;
