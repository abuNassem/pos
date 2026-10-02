import pool from "../../config/db.js";
import { check_user_by_id, deleteUserById } from "../auth/auth.repositry.js";
import { searchUser } from "./admin.repositry.js";

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
    const users = await getUsers(connection);
    connection.release();
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error",
    });
  }}

  export const searchUserByUsername=async(req,res)=>{
    try {
      const { username } = req.query;
      const connection = await pool.getConnection();
      const user = await searchUser(connection, username);
   
  
      if (!user) {
           connection.release();
        return res.status(404).json({ message: "User not found" });
      }
               connection.release();

      return res.status(200).json({ user });
      
    }
      catch (error) {
        return res.status(error.statusCode || 500).json({
          message: error.message || "Internal server error",
        });
      } 
    }