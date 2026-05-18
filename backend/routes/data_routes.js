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
  // getNearbyRoutes 
} from "../controller/data_Controller.js";
import { 
  getPendingDrivers, 
  approveDriver, 
  getAllDrivers 
} from "../controller/admin_Controller.js";
import { createReport, getAllReports } from "../controller/report_Controller.js"; 
import { isAuthenticated } from "../middleware/isAuthenticated.js"; 
import { isAdmin } from "../middleware/isAdmin.js"; 
const router = express.Router();

// ==========================================
// PUBLIC DATA ROUTES (Anyone can view)
// ==========================================
router.get("/routes", getAllRoutes);
router.get("/buses", getAllBuses);
// router.get("/routes/nearby", getNearbyRoutes); 

// ==========================================
// ADMIN DATA ROUTES (Requires Auth AND Admin)
// ==========================================
router.post("/routes", isAuthenticated, isAdmin, createRoute);
router.post("/buses", isAuthenticated, isAdmin, createBus);

// ==========================================
// DRIVER MANAGEMENT ROUTES (Requires Auth AND Admin)
// ==========================================
router.get("/admin/drivers/pending", isAuthenticated, isAdmin, getPendingDrivers);
router.put("/admin/drivers/approve/:id", isAuthenticated, isAdmin, approveDriver);
router.get("/admin/drivers/all", isAuthenticated, isAdmin, getAllDrivers);
router.get('/admin/reports', isAuthenticated, isAdmin, getAllReports);
// ==========================================
// USER LOCATION ROUTES (Requires Auth)
// ==========================================
router.post('/reports', isAuthenticated, createReport);
router.post('/locations', isAuthenticated, addLocation);
router.get('/locations', isAuthenticated, getUserLocations);
router.put('/locations/:id', isAuthenticated, updateLocationType);
router.delete('/locations/:id', isAuthenticated, deleteLocation);

export default router;