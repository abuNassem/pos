import pool from '../../../src/config/db.js';

const assertTestDatabase = () => {
  const name = process.env.DB_NAME || '';
  if (!name.toLowerCase().endsWith('_test')) {
    throw new Error(
      `Refusing to run integration tests on database "${name}". Name must end with "_test".`
    );
  }
};

export const resetDatabase = async () => {
  assertTestDatabase();
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  await pool.query('TRUNCATE TABLE admin_profiles');
   await pool.query('TRUNCATE TABLE admin_singleton');
  await pool.query('TRUNCATE TABLE users');
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');
};

export const closeDatabase = async () => {
  await pool.end();
};

export const findUserRow = async (username) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0] ?? null;
};

export const findAdminProfileRow = async (userId) => {
  const [rows] = await pool.query('SELECT * FROM admin_profiles WHERE user_id = ?', [userId]);
  return rows[0] ?? null;
};

export const countUsers = async () => {
  const [rows] = await pool.query('SELECT COUNT(*) AS c FROM users');
  return rows[0].c;
};

export { pool };