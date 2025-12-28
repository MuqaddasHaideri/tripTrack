import express from "express";
import dotenv from "dotenv";
import { start } from "./config/db.js";
import router from "./routes/auth_routes.js"; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

start(); 

app.use("/api/auth", router);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port = ${PORT}`);
});