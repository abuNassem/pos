import express from "express";

import { validateLoginUser, validateSetupAdmin } from "./auth.validate.js";
import { createInitialAdmin, deleteUser, login,getUsersAll } from "./auth.controllar.js";
import {authAdmin} from "../../middleWare/adminAuth.js"
const router = express.Router();

router.post(
  "/setup-admin",
  validateSetupAdmin,
  createInitialAdmin
);

router.post(
  "/login",
  validateLoginUser,
  login
);
router.delete("/users/:userId", authAdmin, deleteUser);

router.get("/users", authAdmin, getUsersAll);
export default router;