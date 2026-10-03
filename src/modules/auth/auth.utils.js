import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
export const hashPassword = async (password) => {
  try {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw new Error("Failed to hash password");
  }
}

export const createToken = (user,duration=null) => {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
  };

  const token = jwt.sign(payload, "your_jwt_secret_key",duration ? { expiresIn: duration } : undefined);

  return token;
}

export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, "your_jwt_secret_key");
    return decoded;
  } catch (error) {
    console.error("Error verifying token:", error);
    throw new Error("Invalid token");
  }
}


export const verifyPassword = async (password, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error("Error verifying password:", error);
    throw new Error("Failed to verify password");
  }
}

export const isAdmin = (nationalId,birthDate) => {
  if(nationalId && birthDate){
    return true;
  }
  return false;
}

