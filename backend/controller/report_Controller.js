import report_models from "../models/report_model.js";
import { notifyAdmins } from "../utils/sendNotification.js";

// ==========================================
// CREATE REPORT
// Validates the report details, saves the
// report and notifies admins about it.
// ==========================================
export const createReport = async (req, res) => {
  try {
    
    const { 
      reportType, 
      priority, 
      busRoute, 
      issueType, 
      description, 
      location, 
      screenshotUrl, 
      isAnonymous 
    } = req.body;

    //  Validate that we have a valid report type
    if (!['transit_issue', 'app_bug', 'suggestion'].includes(reportType)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid report type." 
      });
    }

    // If they choose anonymous, we save 'null'. Otherwise, we link their user ID.
    const reporterId = isAnonymous ? null : req.user._id;

    // Custom validation for Transit Issue location
    if (reportType === 'transit_issue' && (!location || !location.lat || !location.lng)) {
      return res.status(400).json({
        success: false,
        message: "Location coordinates are required for transit issues."
      });
    }

    const newReport = new report_models({
      reportType,
      priority,
      busRoute,
      issueType,
      description,
      location,
      screenshotUrl,
      isAnonymous,
      reportedBy: reporterId
    });

    // Save to database
    await newReport.save();

    const reportTypeLabel = reportType.replace('_', ' ');
    notifyAdmins(
      'New User Report',
      `A new ${reportTypeLabel} report has been submitted${priority ? ` (Priority: ${priority})` : ''}.`,
      { type: 'user_report', reportId: newReport._id.toString(), reportType }
    );

    res.status(201).json({
      success: true,
      message: "Thank you! Your report has been submitted successfully.",
      report: newReport
    });

  } catch (error) {
    console.error("Error creating report:", error);
    
    // Handle Mongoose validation errors 
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(val => val.message).join(', ')
      });
    }

    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};
// ==========================================
// GET ALL REPORTS
// Fetches all reports with reporter and route
// details, sorted from newest to oldest.
// ==========================================
export const getAllReports = async (req, res) => {
  try {
    const reports = await report_models.find()
      .populate('reportedBy', 'name email') // Gets the user who reported it
      .populate('busRoute', 'routeName startLocation endLocation') 
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================================
// ADMIN: UPDATE REPORT STATUS
// Updates the report status and admin response
// after validating the new status.
// ==========================================
export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params; // The ID of the report in the URL
    const { status, adminResponse } = req.body;

    // Validate the new status
    if (!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status update" });
    }

    const updatedReport = await report_models.findByIdAndUpdate(
      id,
      { status, adminResponse },
      { new: true }
    );

    if (!updatedReport) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    res.status(200).json({ 
      success: true, 
      message: "Report updated successfully", 
      report: updatedReport 
    });
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================================
// PASSENGER: GET MY PAST REPORTS
// Fetches reports submitted by the logged-in
// user and sorts them from newest to oldest.
// ==========================================
export const getMyReports = async (req, res) => {
  try {
    // req.user._id comes from your isAuthenticated middleware
    const userId = req.user._id;

    // Find all reports created by this specific user, newest first
    const myReports = await report_models.find({ reportedBy: userId })
      .populate('busRoute', 'routeName') // Get the bus name if it was a transit issue
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, reports: myReports });
  } catch (error) {
    console.error("Error fetching user reports:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================================
// ADMIN: DELETE REPORT
// Finds the report by ID and removes it
// from the database.
// ==========================================
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedReport = await report_models.findByIdAndDelete(id);

    if (!deletedReport) {
      return res.status(404).json({ success: false, message: "Report not found or already deleted." });
    }

    res.status(200).json({ 
      success: true, 
      message: "Report deleted successfully." 
    });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};