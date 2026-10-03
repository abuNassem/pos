export const findAdmin = async (connection,nationalId, birthDate) => {
   if(!nationalId || !birthDate){
    return null;
  }
  
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
export const createAdminSingleton = async (connection, userId) => {
  const [result] = await connection.execute(
    `
      INSERT INTO admin_singleton (id, user_id)
      VALUES (1, ?)
    `,
    [userId]
  );

  return result;
};
export const check_user = async (connection,username) => {
  const [rows] = await connection.execute(
    `
      SELECT id, username, role, password_hash
      FROM users
      WHERE username = ?
      `,
    [username]
  );
  return rows[0]?? null;
};


export const check_user_by_id = async (connection,userId) => {
  const [rows] = await connection.execute(
    `
      SELECT id, username, role, password_hash
      FROM users
      WHERE id = ?
      `,
    [userId]
  );
  return rows[0]?? null;
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
  passwordHash,is_Admin
) => {
  const [result] = await connection.execute(
    `
      INSERT INTO users (
        username,
        password_hash,
        role
      )
      VALUES (?, ?, ?)
    `,
    [
      username,
      passwordHash,
      is_Admin
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

export const deleteUserById = async (connection, userId) => {
  await connection.execute(
    `
      DELETE FROM users
      WHERE id = ?
    `,
    [userId]
  );
}

export const getUsers=async (connection) => {
  const [rows] = await connection.execute(
    `
      SELECT id, username, role
      FROM users
    `
  );
  return rows;
}


