import express from "express";
import { createRoute, getAllRoutes, createBus, getAllBuses } from "../controller/data_Controller.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js"; 

const router = express.Router();

// GET routes (Public - No login needed to see map)
router.get("/routes", getAllRoutes);
router.get("/buses", getAllBuses);

// POST routes (Protected - Must have Token)
router.post("/routes", isAuthenticated, createRoute);
router.post("/buses", isAuthenticated, createBus);

export default router;