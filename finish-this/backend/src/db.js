/**
 * @ Author: Levi Agostinho Horta
 * @ Create Time: 2025-06-18 10:39:18
 * @ Modified by: Your name
 * @ Modified time: 2025-06-23 16:37:21
 * @ Description: Connects the Game with the Database PostgreSQL
 */

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
