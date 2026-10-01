// Throwaway PostgreSQL database for the local release proof (deploy/lib/local-release.sh).
//
//   node deploy/lib/proof-db.mjs create <adminUrl> <dbName>   → prints the new database's URL
//   node deploy/lib/proof-db.mjs drop   <adminUrl> <dbName>
//
// <adminUrl> is any connection URL on the local PostgreSQL server whose role may
// CREATE DATABASE (the repository's own DATABASE_URL_TEST qualifies). The new
// database is created empty, set to UTC (as production must be), used once, and
// dropped. Uses the `pg` driver already installed with the application — nothing new.
import { createRequire } from "node:module";
import path from "node:path";

const [, , command, adminUrl, dbName] = process.argv;
if (!command || !adminUrl || !dbName || !/^[a-z0-9_]+$/.test(dbName)) {
  console.error("usage: proof-db.mjs create|drop <adminUrl> <dbName>   (dbName: a-z 0-9 _)");
  process.exit(2);
}

const require = createRequire(path.join(process.cwd(), "package.json"));
const { Client } = require("pg");

const client = new Client({ connectionString: adminUrl });
await client.connect();
try {
  if (command === "create") {
    await client.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
    await client.query(`CREATE DATABASE "${dbName}"`);
    await client.query(`ALTER DATABASE "${dbName}" SET timezone TO 'UTC'`);
    const url = new URL(adminUrl);
    url.pathname = `/${dbName}`;
    url.search = "";
    process.stdout.write(url.toString());
  } else if (command === "drop") {
    await client.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
  } else {
    console.error(`unknown command: ${command}`);
    process.exit(2);
  }
} finally {
  await client.end();
}
