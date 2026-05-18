import report_models from "../models/report_model.js";

export const createReport = async (req, res) => {
  try {
    // 1. Grab everything from the request body
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

    // 2. Validate that we have a valid report type
    if (!['transit_issue', 'app_bug', 'suggestion'].includes(reportType)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid report type." 
      });
    }

    // 3. Determine who is reporting
    // If they choose anonymous, we save 'null'. Otherwise, we link their user ID.
    const reporterId = isAnonymous ? null : req.user._id;

    // 4. Custom validation for Transit Issue location
    if (reportType === 'transit_issue' && (!location || !location.lat || !location.lng)) {
      return res.status(400).json({
        success: false,
        message: "Location coordinates are required for transit issues."
      });
    }

    // 5. Build the report object
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

    // 6. Save to database
    await newReport.save();

    res.status(201).json({
      success: true,
      message: "Thank you! Your report has been submitted successfully.",
      report: newReport
    });

  } catch (error) {
    console.error("Error creating report:", error);
    
    // Handle Mongoose validation errors (e.g., missing description for a bug)
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

export const getAllReports = async (req, res) => {
  try {
    const reports = await report_models.find()
      .populate('reportedBy', 'name email') // Gets the user who reported it
      // ✅ Add this line to pull the full bus route data!
      .populate('busRoute', 'routeName startLocation endLocation') 
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};