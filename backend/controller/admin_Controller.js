
import user_models from "../models/user_models.js"

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