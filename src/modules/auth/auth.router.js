import express from "express";

import { createInitialAdmin } from "./auth.controller.js";
import { validateSetupAdmin } from "./auth.validate.js";

const router = express.Router();

router.post(
  "/setup-admin",
  validateSetupAdmin,
  createInitialAdmin
);

export default router;