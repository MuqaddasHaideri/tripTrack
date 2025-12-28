import express from "express";
import { signupController, loginController } from "../controller/auth_Controller.js";
import { signupValidation, loginValidation } from "../middleware/validation.js"; 

const router = express.Router();

router.post("/signup", signupValidation, signupController); 

router.post("/login", loginValidation, loginController); 

export default router;