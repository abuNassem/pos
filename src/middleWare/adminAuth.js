
import jwt from "jsonwebtoken";
export const authAdmin = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token,"your_jwt_secret_key");
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admins only" });
        }

    req.user = decoded; 
    next();
  } catch (error) {
   
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};