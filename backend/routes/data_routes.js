import express from "express";
import { 
  createRoute, 
  getAllRoutes, 
  createBus, 
  getAllBuses,
  addLocation, 
  getUserLocations, 
  updateLocationType, 
  deleteLocation,
  updateRoute,
  deleteRoute
  // getNearbyRoutes 
} from "../controller/data_Controller.js";
import { 
  getPendingDrivers, 
  approveDriver, 
  getAllDrivers,
  addAdmin,
  getAllAdmins,
  removeAdmin 
} from "../controller/admin_Controller.js";
import { createReport, getAllReports, getMyReports, updateReportStatus } from "../controller/report_Controller.js"; 
import { getNotifications, markAsRead, markAllAsRead } from "../controller/notification_Controller.js";
import { createAnnouncement, getAllAnnouncements, getAnnouncementsForUser, deleteAnnouncement } from "../controller/announcement_Controller.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js"; 
import { isAdmin } from "../middleware/isAdmin.js"; 
import { 
  addFavoriteRoute, 
  getFavoriteRoutes, 
  removeFavoriteRoute 
} from "../controller/auth_Controller.js";
const router = express.Router();

// ==========================================
// PUBLIC DATA ROUTES (Anyone can view)
// ==========================================
router.get("/routes", getAllRoutes);
router.get("/buses", getAllBuses);
// router.get("/routes/nearby", getNearbyRoutes); 
router.post("/admin/addAdmin", isAuthenticated, isAdmin, addAdmin); // Admin Only Route to add new admins
router.get("/admin/all-admins", isAuthenticated, isAdmin, getAllAdmins);
router.delete("/admin/remove-admin/:id", isAuthenticated, isAdmin, removeAdmin);
// ==========================================
// ADMIN DATA ROUTES (Requires Auth AND Admin)
// ==========================================
router.post("/admin/routes", isAuthenticated, isAdmin, createRoute);
router.put("/admin/routes/:id", isAuthenticated, isAdmin, updateRoute);
router.delete("/admin/routes/:id", isAuthenticated, isAdmin, deleteRoute);
router.post("/admin/buses", isAuthenticated, isAdmin, createBus); //unused
// ==========================================
// DRIVER MANAGEMENT ROUTES (Requires Auth AND Admin)
// ==========================================
router.get("/admin/drivers/pending", isAuthenticated, isAdmin, getPendingDrivers);
router.put("/admin/drivers/approve/:id", isAuthenticated, isAdmin, approveDriver);
router.get("/admin/drivers/all", isAuthenticated, isAdmin, getAllDrivers);
router.get('/admin/reports', isAuthenticated, isAdmin, getAllReports);
router.put('/admin/reports/:id', isAuthenticated, isAdmin, updateReportStatus);
router.get('/admin/notifications', isAuthenticated, isAdmin, getNotifications);
router.put('/admin/notifications/:id/read', isAuthenticated, isAdmin, markAsRead);
router.put('/admin/notifications/read-all', isAuthenticated, isAdmin, markAllAsRead);

// ==========================================
// ANNOUNCEMENT ROUTES (Admin CRUD)
// ==========================================
router.post('/admin/announcements', isAuthenticated, isAdmin, createAnnouncement);
router.get('/admin/announcements', isAuthenticated, isAdmin, getAllAnnouncements);
router.delete('/admin/announcements/:id', isAuthenticated, isAdmin, deleteAnnouncement);

// ==========================================
// USER LOCATION ROUTES (Requires Auth)
// ==========================================
router.get('/announcements', isAuthenticated, getAnnouncementsForUser);
router.post('/reports', isAuthenticated, createReport);
router.get('/reports/my-reports', isAuthenticated, getMyReports);
router.post('/locations', isAuthenticated, addLocation);
router.get('/locations', isAuthenticated, getUserLocations);
router.put('/locations/:id', isAuthenticated, updateLocationType);
router.delete('/locations/:id', isAuthenticated, deleteLocation);
router.post('/favorites', isAuthenticated, addFavoriteRoute);
router.get('/favorites', isAuthenticated, getFavoriteRoutes);
router.delete('/favorites/:routeId', isAuthenticated, removeFavoriteRoute);

export default router;