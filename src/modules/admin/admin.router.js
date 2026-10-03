import express from "express";
import { deleteUser, getUsersAll, searchUserByUsername } from "./admin.controllar.js";
import { authAdmin } from "../../middleWare/adminAuth.js";
const router = express.Router();


router.delete("/users/:userId", authAdmin, deleteUser);

router.get("/users", authAdmin, getUsersAll);
router.get("/users/search", authAdmin, searchUserByUsername);

export default router;