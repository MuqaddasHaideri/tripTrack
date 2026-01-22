import route_model from "../models/route_models.js";
import bus_model from "../models/bus_model.js";


//  Fetching all routes to draw lines on the map
export const getAllRoutes = async (req, res) => {
  try {
    const routes = await route_model.find();
    res.status(200).json({ success: true, data: routes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Fetch available buses (For Driver Dropdown)
export const getAllBuses = async (req, res) => {
  try {
    const buses = await bus_model.find();
    res.status(200).json({ success: true, data: buses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createRoute = async (req, res) => {
  try {
    const newRoute = new route_model(req.body);
    await newRoute.save();
    res.status(201).json({ success: true, message: "Route Created!", data: newRoute });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createBus = async (req, res) => {
  try {
    const newBus = new bus_model(req.body);
    await newBus.save();
    res.status(201).json({ success: true, message: "Bus Added!", data: newBus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};