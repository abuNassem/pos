import express from "express";
import authRouter from "./auth/auth.router.js";

const app = express();

app.use(express.json());

app.use("/api/auth", authRouter);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});