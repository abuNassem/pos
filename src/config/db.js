import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port:3306,
  user: process.env.DB_USER || "pos_user",
  password: process.env.DB_PASSWORD || "pass-sql",
  database: process.env.DB_NAME || "POSSystem",
});

export default pool;