import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
dotenv.config();
import authRouter from "./modules/auth/auth.router.js";
const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the POS System API",
  });
});

app.listen(4000,  () => {
    console.log("Server running on port 4000");
});