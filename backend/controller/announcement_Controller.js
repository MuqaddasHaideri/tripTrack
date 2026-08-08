import announcement_model from "../models/announcement_model.js";

// ==========================================
// ADMIN: CREATE ANNOUNCEMENT
// Creates a new announcement for passengers,
// drivers, or all users.
// ==========================================
export const createAnnouncement = async (req, res) => {
  try {
    const { title, body, targetAudience } = req.body;

    if (!title || !body || !targetAudience) {
      return res.status(400).json({
        success: false,
        message: "Title, body, and target audience are required."
      });
    }

    if (!['all', 'passenger', 'driver'].includes(targetAudience)) {
      return res.status(400).json({
        success: false,
        message: "Invalid target audience. Must be 'all', 'passenger', or 'driver'."
      });
    }

    const newAnnouncement = new announcement_model({
      title,
      body,
      targetAudience,
      createdBy: req.user._id
    });

    await newAnnouncement.save();

    res.status(201).json({
      success: true,
      message: "Announcement created successfully.",
      announcement: newAnnouncement
    });
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ==========================================
// ADMIN: GET ALL ANNOUNCEMENTS
// Retrieves all announcements created by admins,
// sorted from newest to oldest.
// ==========================================
export const getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await announcement_model.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, announcements });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ==========================================
// USER: GET ANNOUNCEMENTS FOR THEIR ROLE
// Retrieves active announcements based on the
// user's role.
// ==========================================
export const getAnnouncementsForUser = async (req, res) => {
  try {
    const userRole = req.user.role;

    const announcements = await announcement_model.find({
      isActive: true,
      targetAudience: { $in: ['all', userRole] }
    })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, announcements });
  } catch (error) {
    console.error("Error fetching user announcements:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ==========================================
// ADMIN: DELETE ANNOUNCEMENT
// Deletes an announcement using its ID and
// returns an error if it does not exist.
// ==========================================
export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await announcement_model.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }

    res.status(200).json({
      success: true,
      message: "Announcement deleted successfully."
    });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
