import express from "express"
import dotenv from "dotenv"
import {start} from "./config/db.js"
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

start(); //for starting db 


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port = ${PORT}`);
});