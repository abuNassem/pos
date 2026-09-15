import bcrypt from "bcrypt";

import pool from "../config/database.js";
import {
  findAdmin,
  findUserByUsername,
  findAdminByNationalId,
  createUser,
  createAdminProfile,
} from "./auth.repository.js";

export const setupAdmin = async ({
  username,
  password,
  nationalId,
  birthDate,
}) => {
  const connection = await pool.getConnection();

  try {
    /*
    |--------------------------------------------------------------------------
    | Start transaction
    |--------------------------------------------------------------------------
    */

    await connection.beginTransaction();

    /*
    |--------------------------------------------------------------------------
    | 1. Make sure an admin does not already exist
    |--------------------------------------------------------------------------
    */

    const existingAdmin = await findAdmin(connection);

    if (existingAdmin) {
      const error = new Error("Admin account already exists");
      error.statusCode = 409;
      throw error;
    }

    /*
    |--------------------------------------------------------------------------
    | 2. Check username
    |--------------------------------------------------------------------------
    */

    const existingUsername = await findUserByUsername(
      connection,
      username
    );

    if (existingUsername) {
      const error = new Error("Username already exists");
      error.statusCode = 409;
      throw error;
    }

    /*
    |--------------------------------------------------------------------------
    | 3. Check national ID
    |--------------------------------------------------------------------------
    */

    const existingNationalId = await findAdminByNationalId(
      connection,
      nationalId
    );

    if (existingNationalId) {
      const error = new Error("National ID already exists");
      error.statusCode = 409;
      throw error;
    }

    /*
    |--------------------------------------------------------------------------
    | 4. Hash password
    |--------------------------------------------------------------------------
    */

    const passwordHash = await bcrypt.hash(password, 12);

    /*
    |--------------------------------------------------------------------------
    | 5. Create user
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | The role is NOT coming from the client.
    | The server sets it to "admin".
    |
    */

    const userId = await createUser(
      connection,
      username,
      passwordHash
    );

    /*
    |--------------------------------------------------------------------------
    | 6. Create admin profile
    |--------------------------------------------------------------------------
    */

    await createAdminProfile(
      connection,
      userId,
      nationalId,
      birthDate
    );

    /*
    |--------------------------------------------------------------------------
    | 7. Commit transaction
    |--------------------------------------------------------------------------
    */

    await connection.commit();

    /*
    |--------------------------------------------------------------------------
    | 8. Return safe data
    |--------------------------------------------------------------------------
    */

    return {
      id: userId,
      username,
      role: "admin",
    };
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | Rollback
    |--------------------------------------------------------------------------
    */

    await connection.rollback();

    /*
    |--------------------------------------------------------------------------
    | Race-condition protection
    |--------------------------------------------------------------------------
    |
    | Even if two requests pass the "findAdmin" check at the
    | same time, MySQL's UNIQUE constraint on admin_singleton
    | will reject the second admin.
    |
    */

    if (error.code === "ER_DUP_ENTRY") {
      const duplicateError = new Error(
        "Admin account or unique data already exists"
      );

      duplicateError.statusCode = 409;

      throw duplicateError;
    }

    throw error;
  } finally {
    connection.release();
  }
};