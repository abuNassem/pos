import express from "express";

import { validateLoginUser, validateSetupAdmin } from "./auth.validate.js";
import { createUsers,login} from "./auth.controllar.js";
const router = express.Router();

router.post(
  "/setup-user",
  validateSetupAdmin,
  createUsers
);

router.post(
  "/login",
  validateLoginUser,
  login
);

export default router;