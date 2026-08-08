import user_models from "../models/user_models.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { notifyAdmins } from "../utils/sendNotification.js";

// ==========================================
// SIGNUP
// Checks existing user, hashes password,
// creates account and notifies admins for drivers.
// ==========================================
export const signupController = async (req, res) => {
  try {
    const { name, email, password, role, phone, cnic, driverLicense } = req.body;
    const trimmedEmail = email?.trim();

    const userExists = await user_models.findOne({ email: trimmedEmail });
    if (userExists) {
      return res.status(400).json({ message: "User Already Exists", success: false });
    }

    const encodedName = encodeURIComponent(name);
    const avatar = `https://ui-avatars.com/api/?name=${encodedName}&background=2d5a4c&color=fff&size=256`;
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const isUserVerified = role === 'passenger' ? true : false;
// const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const otpExpires = new Date(Date.now() + 10 * 60000);
    const newUser = new user_models({
      name,
      email: trimmedEmail,
      password: hashedPassword,
      profilePic: avatar,
      role,
      phone: phone || "",
      ...(role === 'driver' && { cnic, driverLicense }),
      isVerified: isUserVerified,
      // isEmailVerified: false, 
      // otp: otp,
      // otpExpires: otpExpires
    });

    await newUser.save();

    if (role === 'driver') {
      notifyAdmins(
        'New Driver Registration',
        `${name} has submitted a driver application and is pending approval.`,
        { type: 'driver_registration', driverId: newUser._id.toString() }
      );
    }

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
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(val => val.message).join(', ')
      });
    }

    return res.status(500).json({ message: "Internal server error", success: false });
  }
};
/// ==========================================
// LOGIN
// Verifies user credentials, checks driver
// approval and generates a JWT token.
// ==========================================
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const trimmedEmail = email?.trim();
    let userExists = await user_models.findOne({ email: trimmedEmail });
    if (!userExists) {
      userExists = await user_models.findOne({ email: new RegExp(`^\\s*${trimmedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i') });
    }
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
// Fetches the logged-in user's profile
// without returning the password.
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
// Updates allowed user details while keeping
// sensitive account fields protected.
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
// Deletes the logged-in user's account
// from the database.
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
// Adds a route to the user's favorite routes
// list without creating duplicate entries.
// ==========================================
export const addFavoriteRoute = async (req, res) => {
  try {
    const userId = req.user._id; // From isAuthenticated middleware
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
// GET FAVORITES
// Fetches the user's favorite routes along
// with their route details.
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
// CHECK DRIVER APPROVAL STATUS
// Checks if a driver account has been approved
// by the admin using the driver's email.
// ==========================================
export const checkApprovalStatus = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await user_models.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role !== 'driver') {
      return res.status(400).json({ success: false, message: "This endpoint is for drivers only" });
    }

    res.status(200).json({
      success: true,
      approved: user.isVerified === true,
    });
  } catch (error) {
    console.log("Error in checkApprovalStatus:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
// ==========================================
// REMOVE FROM FAVORITES
// Removes a route from the user's favorite
// routes list using the route ID.
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