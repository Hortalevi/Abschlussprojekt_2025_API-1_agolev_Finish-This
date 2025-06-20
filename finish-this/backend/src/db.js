const { Pool } = require("pg");
const { password } = require("pg/lib/defaults.js");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "gamedb",
  password: "admin123",
  port: 5432,
});

module.exports = pool;
