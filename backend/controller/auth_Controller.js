import user_models from "../models/user_models.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "../utils/verifyEmail.js";
// ==========================================
// SINGUP
// ==========================================
export const signupController = async (req, res) => {
  try {
    const { name, email, password, role, phone, cnic, driverLicense } = req.body;

    const userExists = await user_models.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User Already Exists", success: false });
    }

    const encodedName = encodeURIComponent(name);
    const avatar = `https://ui-avatars.com/api/?name=${encodedName}&background=2d5a4c&color=fff&size=256`;
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const isUserVerified = role === 'passenger' ? true : false;
const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60000);
    const newUser = new user_models({
      name,
      email,
      password: hashedPassword,
      profilePic: avatar,
      role,
      phone: phone || "",
      ...(role === 'driver' && { cnic, driverLicense }),
      isVerified: isUserVerified,
      isEmailVerified: false, 
      otp: otp,
      otpExpires: otpExpires
    });

    await newUser.save();
    await sendVerificationEmail(newUser.email, otp);
    res.status(201).json({
      message: role === 'driver' ? "Application submitted! Waiting for Admin approval." : "User created successfully",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isVerified: newUser.isVerified,
        profilePic: newUser.profilePic 
      },
      success: true,
    });
  } catch (error) {
    console.log("Error in signup controller:", error);
    
    // Catch Mongoose Validation errors (like missing CNIC) safely
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(val => val.message).join(', ')
      });
    }

    return res.status(500).json({ message: "Internal server error", success: false });
  }
};
// ==========================================
// LOGIN
// ==========================================
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userExists = await user_models.findOne({ email });
    if (!userExists) {
      return res.status(403).json({
        message: "Auth failed! Email or password is wrong",
        success: false,
      });
    }
    const isPasswordEqual = await bcrypt.compare(password, userExists.password);

    if (!isPasswordEqual) {
      return res.status(403).json({ 
        message: "Auth failed! Email or password is wrong", 
        success: false 
      });
    }

    if (userExists.role === 'driver' && userExists.isVerified === false) {
      return res.status(403).json({ 
        message: "Your account is still pending admin approval. Please wait.", 
        success: false 
      });
    }

    const jwt_token = jwt.sign(
      {
        email: userExists.email,
        _id: userExists._id,
        role: userExists.role 
      },
      process.env.JWT_KEY,
      { expiresIn: "24hr" }
    );

    res.status(200).json({
      message: "Login successful",
      success: true,
      jwt_token,
      name: userExists.name,
      email,
      _id: userExists._id,
      role: userExists.role, 
      profilePic: userExists.profilePic
    });
    
  } catch (error) {
    console.log("Error in login controller : ", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

// ==========================================
// VIEW PROFILE
// ==========================================
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id; 

    const user = await user_models.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log("Error in getUserProfile: ", error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

// ==========================================
// EDIT PROFILE
// ==========================================
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const { 
      role, 
      isVerified, 
      password, 
      email, 
      cnic,  
      ...allowedUpdates 
    } = req.body;

    const updatedUser = await user_models.findByIdAndUpdate(
      userId,
      { $set: allowedUpdates },
      { new: true, runValidators: true } 
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    res.status(200).json({ 
      message: "Profile updated successfully", 
      success: true, 
      user: updatedUser 
    });
  } catch (error) {
    console.log("Error in updateUserProfile: ", error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

// ==========================================
// DELETE PROFILE
// ==========================================
export const deleteUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const deletedUser = await user_models.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    res.status(200).json({ 
      message: "Account deleted successfully", 
      success: true 
    });
  } catch (error) {
    console.log("Error in deleteUserProfile: ", error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

// ==========================================
// ADD TO FAVORITES 
// ==========================================
export const addFavoriteRoute = async (req, res) => {
  try {
    const userId = req.user._id; // From your isAuthenticated middleware
    const { routeId } = req.body;

    if (!routeId) {
      return res.status(400).json({ success: false, message: "Route ID is required" });
    }

    const updatedUser = await user_models.findByIdAndUpdate(
      userId,
      { $addToSet: { favoriteRoutes: routeId } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ 
      success: true, 
      message: "Route added to favorites",
      favoriteRoutes: updatedUser.favoriteRoutes 
    });

  } catch (error) {
    console.error("Error adding favorite route:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ==========================================
//  GET FAVORITES 
// ==========================================
export const getFavoriteRoutes = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await user_models.findById(userId)
      .populate('favoriteRoutes', 'route_name stops origin destination color_hex'); 

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ 
      success: true, 
      favorites: user.favoriteRoutes 
    });

  } catch (error) {
    console.error("Error fetching favorite routes:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ==========================================
//REMOVE FROM FAVORITES 
// ==========================================
export const removeFavoriteRoute = async (req, res) => {
  try {
    const userId = req.user._id;
    const { routeId } = req.params; 

    if (!routeId) {
      return res.status(400).json({ success: false, message: "Route ID is required" });
    }

    const updatedUser = await user_models.findByIdAndUpdate(
      userId,
      { $pull: { favoriteRoutes: routeId } }, 
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ 
      success: true, 
      message: "Route removed from favorites",
      favoriteRoutes: updatedUser.favoriteRoutes
    });

  } catch (error) {
    console.error("Error removing favorite route:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};