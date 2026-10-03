import pool from "../../config/db.js";
import {
  check_user_by_id,
  deleteUserById,
  getUsers,
} from "../auth/auth.repositry.js";
import { searchUser } from "./admin.repositry.js";

export const deleteUserService = async (userId) => {
  const connection = await pool.getConnection();

  try {
    const isExistingUser = await check_user_by_id(connection, userId);

    if (!isExistingUser || isExistingUser.role === "admin") {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    await deleteUserById(connection, userId);

    return {
      username: isExistingUser.username,
    };
  } finally {
    connection.release();
  }
};

export const getUsersService = async () => {
  const connection = await pool.getConnection();

  try {
    const users = await getUsers(connection);

    return users;
  } finally {
    connection.release();
  }
};

export const searchUserByUsernameService = async (username) => {
  const connection = await pool.getConnection();

  try {
    const user = await searchUser(connection, username);

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    return user;
  } finally {
    connection.release();
  }
};
