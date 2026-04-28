import express from "express";
import { signupController, loginController,deleteUserProfile, updateUserProfile,getUserProfile } from "../controller/auth_Controller.js";
import { signupValidation, loginValidation } from "../middleware/validation.js"; 
import { isAuthenticated } from "../middleware/isAuthenticated.js"; 
const router = express.Router();

router.post("/signup", signupValidation, signupController); 

router.post("/login", loginValidation, loginController); 
router.get("/profile", isAuthenticated, getUserProfile);
router.put("/profile", isAuthenticated, updateUserProfile);
router.delete("/profile", isAuthenticated, deleteUserProfile);
export default router;