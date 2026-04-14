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

// --- HAVERSINE HELPER FUNCTION ---
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distance in km
};

export const getNearbyRoutes = async (req, res) => {
  try {
    // 1. Get user's location and search radius from the query parameters
    const { lat, lng, radius = 5 } = req.query; // Default radius is 5 km

    if (!lat || !lng) {
      return res.status(400).json({ 
        success: false, 
        message: "Latitude (lat) and longitude (lng) are required." 
      });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const searchRadius = parseFloat(radius);

    // 2. Fetch all routes from the database
    const allRoutes = await route_model.find();
    const nearbyRoutes = [];

    // 3. Filter routes based on distance
    for (let route of allRoutes) {
      let isNearby = false;

      // Check if ANY stop on this route is within the user's radius
      for (let stop of route.stops) {
        const distance = getDistanceFromLatLonInKm(userLat, userLng, stop.latitude, stop.longitude);
        
        if (distance <= searchRadius) {
          isNearby = true;
          break; // We found a nearby stop, no need to check the rest of the stops for this route
        }
      }

      if (isNearby) {
        nearbyRoutes.push(route);
      }
    }

    res.status(200).json({ 
      success: true, 
      count: nearbyRoutes.length,
      radius_km: searchRadius,
      data: nearbyRoutes 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};