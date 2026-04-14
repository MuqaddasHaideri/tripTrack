import express from "express";
import { 
  createRoute, 
  getAllRoutes, 
  createBus, 
  getAllBuses,
 getNearbyRoutes,
    addLocation, 
  getUserLocations, 
  updateLocationType, 
  deleteLocation 
} from "../controller/data_Controller.js";

import { isAuthenticated } from "../middleware/isAuthenticated.js"; 

const router = express.Router();

// ==========================================
// PUBLIC DATA ROUTES (Anyone can view)
// ==========================================
router.get("/routes", getAllRoutes);
router.get("/buses", getAllBuses);
router.get("/routes/nearby", getNearbyRoutes);
// ==========================================
// ADMIN DATA ROUTES (Requires Auth)
// ==========================================
router.post("/routes", isAuthenticated, createRoute);
router.post("/buses", isAuthenticated, createBus);

// ==========================================
// USER LOCATION ROUTES (Requires Auth)
// ==========================================

router.post('/locations',isAuthenticated, addLocation)
  router.get('/locations',isAuthenticated, getUserLocations);
router.put('/locations/:id',isAuthenticated, updateLocationType)
  router.delete('/locations/:id',isAuthenticated, deleteLocation);
export default router;