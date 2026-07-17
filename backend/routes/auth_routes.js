import express from "express";
import { signupController, loginController,deleteUserProfile, updateUserProfile,getUserProfile, checkApprovalStatus,logout} from "../controller/auth_Controller.js";
import { signupValidation, loginValidation } from "../middleware/validation.js"; 
import { isAuthenticated } from "../middleware/isAuthenticated.js"; 
import { registerFcmToken } from "../controller/notification_Controller.js";
// import { sendVerificationEmail } from "../utils/verifyEmail.js";
const router = express.Router();

router.post("/signup", signupValidation, signupController); 

router.post("/login", loginValidation, loginController); 
router.post("/check-approval-status", checkApprovalStatus);
// router.post("/verify", verifyOtpController);  
router.get("/profile", isAuthenticated, getUserProfile);
router.put("/profile", isAuthenticated, updateUserProfile);
router.delete("/profile", isAuthenticated, deleteUserProfile);
router.put("/fcm-token", isAuthenticated, registerFcmToken);
router.post("/logout", isAuthenticated, logout);
export default router;