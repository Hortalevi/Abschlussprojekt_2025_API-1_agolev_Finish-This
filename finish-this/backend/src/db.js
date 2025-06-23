const { Pool } = require("pg");

let pool;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
} else {
  pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "gamedb",
    password: "admin123",
    port: 5432,
  });
}

module.exports = pool;
