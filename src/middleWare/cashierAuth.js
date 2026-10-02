import pool from "../config/db.js";
import jwt from "jsonwebtoken";
import { check_user_by_id } from "../modules/auth/auth.repositry.js";

export const authCashier = async (req, res, next) => {
  const token = req.cookies.token;
const connection = await pool.getConnection();
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, "your_jwt_secret_key");
    const isExistingUser = await check_user_by_id(connection, decoded.id);
    if (!isExistingUser || isExistingUser.role !== "cashier") {
      return res.status(403).json({ message: "Forbidden: Cashiers only" });
    }

    req.user = decoded; 
    next();
  } catch (error) {
    console.error("Cashier authentication error:", error);
    return res.status(403).json({ message: "Forbidden: Invalid token" });
  }}