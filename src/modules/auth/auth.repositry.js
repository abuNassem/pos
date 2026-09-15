export const findAdmin = async (connection) => {
  const [rows] = await connection.execute(
    `
      SELECT id
      FROM users
      WHERE role = 'admin'
      LIMIT 1
    `
  );

  return rows[0] ?? null;
};


export const findUserByUsername = async (
  connection,
  username
) => {
  const [rows] = await connection.execute(
    `
      SELECT id
      FROM users
      WHERE username = ?
      LIMIT 1
    `,
    [username]
  );

  return rows[0] ?? null;
};


export const findAdminByNationalId = async (
  connection,
  nationalId
) => {
  const [rows] = await connection.execute(
    `
      SELECT user_id
      FROM admin_profiles
      WHERE national_id = ?
      LIMIT 1
    `,
    [nationalId]
  );

  return rows[0] ?? null;
};


export const createUser = async (
  connection,
  username,
  passwordHash
) => {
  const [result] = await connection.execute(
    `
      INSERT INTO users (
        username,
        password_hash,
        role
      )
      VALUES (?, ?, 'admin')
    `,
    [
      username,
      passwordHash,
    ]
  );

  return result.insertId;
};


export const createAdminProfile = async (
  connection,
  userId,
  nationalId,
  birthDate
) => {
  await connection.execute(
    `
      INSERT INTO admin_profiles (
        user_id,
        national_id,
        birth_date
      )
      VALUES (?, ?, ?)
    `,
    [
      userId,
      nationalId,
      birthDate,
    ]
  );
};