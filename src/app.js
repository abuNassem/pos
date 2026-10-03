import express from "express";
import dotenv from 'dotenv';
dotenv.config();
import cookieParser from "cookie-parser";
import authRouter from "./modules/auth/auth.router.js";
import adminRouter from "./modules/admin/admin.router.js";


const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);

export default app;
