import { loginUser, setupAdmin } from "./auth.service.js";
import pool from "../../config/db.js";
import { check_user, check_user_by_id, deleteUserById, getUsers } from "./auth.repositry.js";
export const createInitialAdmin = async (req, res) => {
  try {
    console.log("🔥 setup-admin controller started");
    const admin = await setupAdmin({...req.body,res});

    return res.status(201).json({
      message: "Admin account created successfully",
      user: admin,
    });
  } catch (error) {
    console.error("Create initial admin error:", error);

    /*
     * Errors created intentionally by our service
     */
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    /*
     * Unexpected server error
     */
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const login = async (req, res) => {
  try {
  
    const { username, password } = req.body;
  
    const result=await loginUser(username, password,res);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Login error:", error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error",
    });
  }
}

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const connection = await pool.getConnection();    
    const isExistingUser = await check_user_by_id(connection, userId);
    if (!isExistingUser || isExistingUser.role === "admin") {
      return res.status(404).json({ message: "User not found" });
    }
    
    await deleteUserById(connection, userId);
    return res.status(200).json({ message: `User ${isExistingUser.username} deleted successfully` });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error",
    });
  }
};


export const getUsersAll=async(req,res)=>{
  try {
    const connection = await pool.getConnection();
  console.log("🔥 get-users controller started",req.cookies);
    const users = await getUsers(connection);
    connection.release();
    return res.status(200).json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error",
    });
  }}