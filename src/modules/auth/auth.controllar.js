import { loginUser, setupUser} from "./auth.service.js";
export const createUsers = async (req, res) => {
  try {
   
    const admin = await setupUser({...req.body,res});

    return res.status(201).json({
      message: "User created successfully",
      user: admin,
    });
  } catch (error) {
    console.error("Create initial admin error:", error);

   
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

