
import "dotenv/config";
import pg from "pg";

pg.types.setTypeParser(1082, (value) => value);
pg.types.setTypeParser(1114, (value) => value);

export const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === "true"
    ? { rejectUnauthorized: false }
    : undefined,
});

export const q = async (sql, params = []) =>
  (await pool.query(sql, params)).rows;

export const one = async (sql, params = []) =>
  (await q(sql, params))[0];
