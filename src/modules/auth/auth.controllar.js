import { setupAdmin } from "./auth.service.js";

export const createInitialAdmin = async (req, res) => {
  try {
    const admin = await setupAdmin(req.body);

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