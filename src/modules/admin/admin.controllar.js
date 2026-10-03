import {
  deleteUserService,
  getUsersService,
  searchUserByUsernameService,
} from "./admin.service.js";

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await deleteUserService(userId);

    return res.status(200).json({
      message: `User ${result.username} deleted successfully`,
    });
  } catch (error) {
    console.error("Delete user error:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error",
    });
  }
};

export const getUsersAll = async (req, res) => {
  try {
    const users = await getUsersService();

    return res.status(200).json({ users });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error",
    });
  }
};

export const searchUserByUsername = async (req, res) => {
  try {
    const { username } = req.query;

    const user = await searchUserByUsernameService(username);

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error",
    });
  }
};
