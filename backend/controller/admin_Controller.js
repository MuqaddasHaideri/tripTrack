
import user_models from "../models/user_models.js"
import bcrypt from "bcrypt";
// all drivers who are waiting for approval
export const getPendingDrivers = async (req, res) => {
  try {
    const pendingDrivers = await user_models.find({ 
      role: 'driver', 
      isVerified: false 
    }).select('-password');
    res.status(200).json({ 
      success: true, 
      count: pendingDrivers.length, 
      data: pendingDrivers 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve a driver
export const approveDriver = async (req, res) => {
  try {
    const driverId = req.params.id;
    const updatedDriver = await user_models.findByIdAndUpdate(
      driverId,
      { isVerified: true },
      { new: true } 
    ).select('-password');

    if (!updatedDriver) {
      return res.status(404).json({ success: false, message: "Driver not found" });
    }

    res.status(200).json({ 
      success: true, 
      message: "Driver has been successfully approved!", 
      data: updatedDriver 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//Get all drivers, verified or not
export const getAllDrivers = async (req, res) => {
  try {
    const drivers = await user_models.find({ role: 'driver' }).select('-password');
    res.status(200).json({ success: true, count: drivers.length, data: drivers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// ==========================================
// CREATE A NEW ADMIN (Admin Only)
// ==========================================
export const addAdmin = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // 1. Basic Validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required." });
    }

    // 2. Check if a user with this email already exists
    const existingUser = await user_models.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "An account with this email already exists." });
    }

    // 3. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a default avatar
    const encodedName = encodeURIComponent(name);
    const avatar = `https://ui-avatars.com/api/?name=${encodedName}&background=b82c33&color=fff&size=256`; // Red background for admin

    // 4. Create the new Admin user
    const newAdmin = new user_models({
      name,
      email,
      password: hashedPassword,
      profilePic: avatar,
      role: 'admin', // FORCING THE ROLE TO ADMIN
      phone: phone || "",
      isVerified: true,      // Pre-verified because an admin made it 
    });

    await newAdmin.save();

    res.status(201).json({
      success: true,
      message: `Admin account for ${name} created successfully!`,
      admin: {
        _id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });

  } catch (error) {
    console.error("Error creating new admin:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ==========================================
// GET ALL ADMINS (Admin Only)
// ==========================================
export const getAllAdmins = async (req, res) => {
  try {
    // Find all users where the role is 'admin'
    // .select('-password') ensures we don't accidentally send hashed passwords to the frontend
    const admins = await user_models.find({ role: 'admin' })
      .select('-password') 
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      admins 
    });
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ==========================================
// REMOVE AN ADMIN (Admin Only)
// ==========================================
export const removeAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // 🛡️ SECURITY CHECK: Prevent an admin from deleting themselves!
    // Assuming your `isAuthenticated` middleware attaches the logged-in user's ID to req.user._id
    if (req.user._id.toString() === id) {
      return res.status(400).json({ 
        success: false, 
        message: "Action denied: You cannot delete your own admin account." 
      });
    }

    // Find and delete the user, but ONLY if their role is actually 'admin'
    const deletedAdmin = await user_models.findOneAndDelete({ _id: id, role: 'admin' });

    if (!deletedAdmin) {
      return res.status(404).json({ success: false, message: "Admin account not found." });
    }

    res.status(200).json({ 
      success: true, 
      message: "Admin account removed successfully." 
    });
  } catch (error) {
    console.error("Error removing admin:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};