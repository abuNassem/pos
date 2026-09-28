
import {
  createUser,
  createAdminProfile,
  check_user,
} from "./auth.repositry.js";
import pool from "../../config/db.js";
import { createToken, hashPassword, verifyPassword,isAdmin} from "./auth.utlis.js";

export const setupAdmin = async ({
  username,
  password,
  nationalId,
  birthDate,
  res,
}) => {
  const connection = await pool.getConnection();

  try {
    /*
    |--------------------------------------------------------------------------
    | Start transaction
    |--------------------------------------------------------------------------
    */

    await connection.beginTransaction();

    
 
    const passwordHash = await hashPassword(password);

   const is_Admin =  isAdmin(nationalId,birthDate);
console.log("isAdmin:", is_Admin);
   if(!is_Admin){

       const userId = await createUser(
      connection,
      username,
      passwordHash,
      "cashier"
    );
    await connection.commit();
  const token = await createToken({ id: userId, username, role: "cashier" });

  res.cookie("token",token,{httpOnly:false,secure:false,sameSite:"strict"});
     return {
      id: userId,
      username,
      role: "cashier",
      token
    };
   }

    const userId = await createUser(
      connection,
      username,
      passwordHash,
      "admin"
    );
    

      await createAdminProfile(
       connection,
       userId,
       nationalId,
       birthDate
     );

await connection.commit();

  const token = await createToken({ id: userId, username, role: "admin" });
  
  res.cookie("token",token,{httpOnly:false,secure:false,sameSite:"strict"});
     return {
      id: userId,
      username,
      role: "admin",
      token
    };
  } catch (error) {
  

    await connection.rollback();


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

export const loginUser = async (username, password,res) => {
  const connection = await pool.getConnection();
  const user=await check_user(connection,username);
if (!user) {
    connection.release();
    const error = new Error("Invalid username or password");
    error.statusCode = 401;
    throw error;  
  }
  console.log("User found:", user);
  const isPasswordValid = await verifyPassword(password, user.password_hash);

  if (!isPasswordValid) {
    connection.release();
    const error = new Error("Invalid username or password");
    error.statusCode = 401;
    throw error;  
  }

  switch (user?.role) {
    case "admin":
      const token = await createToken({ id: user.id, username, role: "admin" },'5min');
      res.cookie("token",token,{httpOnly:false,secure:false,sameSite:"strict"});
       connection.release();
      return {token,message:'to next step'}
    case "cashier":
      const token2 = await createToken({ id: user.id, username, role: "cashier" });
      res.cookie("token",token2,{httpOnly:false,secure:false,sameSite:"strict"});
       connection.release();
          
       return {token2,message:'login successfully'};
 
    default:
       connection.release();
      const error = new Error("Invalid username or password");
      error.statusCode = 401;
      throw error;  
  }
  
 
}

