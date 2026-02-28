import route_model from "../models/route_models.js";
import bus_model from "../models/bus_model.js";
import UserLocation from '../models/userLocation.js';

export const getAllRoutes = async (req, res) => {
  try {
    const routes = await route_model.find();
    res.status(200).json({ success: true, data: routes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


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


export const addLocation = async (req, res) => {
  try {
    const { name, address, latitude, longitude, type } = req.body;


    const newLocation = await UserLocation.create({
      user: req.user._id, 
      name,
      address,
      latitude,
      longitude,
      type: type || 'recent' 
    });

    res.status(201).json({
      success: true,
      data: newLocation
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserLocations = async (req, res) => {
  try {
    const query = { user: req.user._id };
    if (req.query.type) {
      query.type = req.query.type;
    }
    const locations = await UserLocation.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: locations.length,
      data: locations
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLocationType = async (req, res) => {
  try {
    const { type } = req.body;
    let location = await UserLocation.findOne({ _id: req.params.id, user: req.user._id });

    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found or unauthorized' });
    }

    location.type = type;
    await location.save();

    res.status(200).json({
      success: true,
      data: location
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteLocation = async (req, res) => {
  try {
    const location = await UserLocation.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};