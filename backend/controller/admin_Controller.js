
import user_models from "../models/user_models.js"
import bcrypt from "bcrypt";

// ==========================================
// GET ALL PENDING DRIVER ACCOUNTS
// Fetches unverified drivers and excludes
// their passwords from the response.
// ==========================================
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

// ==========================================
// APPROVE DRIVER ACCOUNT
// Finds the driver by ID and updates their
// account status to verified.
// ==========================================
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

// ==========================================
// GET ALL DRIVER ACCOUNTS
// Retrieves every registered driver,
// regardless of verification status.
// ==========================================
export const getAllDrivers = async (req, res) => {
  try {
    const drivers = await user_models.find({ role: 'driver' }).select('-password');
    res.status(200).json({ success: true, count: drivers.length, data: drivers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// ==========================================
// CREATE NEW ADMIN ACCOUNT
// Allows an existing administrator to
// register another administrator.
// ==========================================
export const addAdmin = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required." });
    }
    const existingUser = await user_models.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "An account with this email already exists." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const encodedName = encodeURIComponent(name);
    const avatar = `https://ui-avatars.com/api/?name=${encodedName}&background=b82c33&color=fff&size=256`; 
    const newAdmin = new user_models({
      name,
      email,
      password: hashedPassword,
      profilePic: avatar,
      role: 'admin', 
      phone: phone || "",
      isVerified: true,      
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
// GET ALL ADMIN ACCOUNTS
// Returns a list of registered
// administrators in descending order
// of creation date.
// ==========================================
export const getAllAdmins = async (req, res) => {
  try {
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
// REMOVE ADMIN ACCOUNT
// Deletes an administrator account while
// preventing self-deletion for security.
// ==========================================
export const removeAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user._id.toString() === id) {
      return res.status(400).json({ 
        success: false, 
        message: "Action denied: You cannot delete your own admin account." 
      });
    }
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