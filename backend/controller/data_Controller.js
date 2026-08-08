import route_model from "../models/route_models.js";
import bus_model from "../models/bus_model.js";
import UserLocation from '../models/userLocation.js';

// ==========================================
// GET ALL ROUTES
// Fetches all routes from the database and
// returns them in the response.
// ==========================================
export const getAllRoutes = async (req, res) => {
  try {
    const routes = await route_model.find();
    res.status(200).json({ success: true, data: routes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// GET ALL BUSES
// Fetches all buses from the database and
// returns them in the response.
// ==========================================
export const getAllBuses = async (req, res) => {
  try {
    const buses = await bus_model.find();
    res.status(200).json({ success: true, data: buses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// CREATE A NEW ROUTE
// Checks for duplicate routes and saves the
// new route details to the database.
// ==========================================
export const createRoute = async (req, res) => {
  try {
    const { route_name, color_hex, origin, destination, stops, polyline } = req.body;

    // Check if a route with this name already exists
    const existingRoute = await route_model.findOne({ route_name });
    if (existingRoute) {
      return res.status(400).json({ success: false, message: "A route with this name already exists." });
    }

    const newRoute = new route_model({
      route_name,
      color_hex,
      origin,
      destination,
      stops,
      polyline
    });

    await newRoute.save();

    res.status(201).json({ 
      success: true, 
      message: "Route created successfully!", 
      route: newRoute 
    });
  } catch (error) {
    console.error("Error creating route:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
// ==========================================
// CREATE A NEW BUS
// Saves a new bus with the provided details
// to the database.
// ==========================================
export const createBus = async (req, res) => {
  try {
    const newBus = new bus_model(req.body);
    await newBus.save();
    res.status(201).json({ success: true, message: "Bus Added!", data: newBus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// ADD USER LOCATION
// Saves a user's location with its details
// and location type in the database.
// ==========================================
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
// ==========================================
// GET USER LOCATIONS
// Fetches the user's saved locations and
// optionally filters them by location type.
// ==========================================
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
// ==========================================
// UPDATE LOCATION TYPE
// Finds the user's location and updates
// its type.
// ==========================================
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
// ==========================================
// DELETE LOCATION
// Deletes a saved location belonging to
// the logged-in user.
// ==========================================
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
// ==========================================
// CALCULATE DISTANCE
// Calculates the distance between two points
// using their latitude and longitude.
// ==========================================
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
};
// ==========================================
// FORMAT ETA MESSAGE
// Calculates the estimated travel time and
// returns it as a readable message.
// ==========================================
export const formatETAMessage = (distanceKm, stopName) => {
  const speedKmh = 20; 
  const timeHours = distanceKm / speedKmh;
  const timeMinutes = Math.round(timeHours * 60);

  const shortDistance = distanceKm.toFixed(1);

  if (timeMinutes < 1) {
    const timeSeconds = Math.round(timeHours * 3600);
    return `This bus is ${shortDistance}km far from ${stopName} and will reach in about ${timeSeconds} secs`;
  } else {
    return `This bus is ${shortDistance}km far from ${stopName} and will reach in about ${timeMinutes} mins`;
  }
};

// ==========================================
// GET LIVE ETA
// Uses Google Maps API to get the distance
// and estimated travel time to a bus stop.
// ==========================================
export const getLiveETA = async (busLat, busLng, stopLat, stopLng) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${busLat},${busLng}&destinations=${stopLat},${stopLng}&departure_time=now&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    //  read Google's array correctly
    if (data.status === "OK" && data.rows.elements.status === "OK") {
      const element = data.rows.elements;
      
      return {
        distanceText: element.distance.text, 
        durationText: element.duration.text, 
        durationInTraffic: element.duration_in_traffic ? element.duration_in_traffic.text : element.duration.text 
      };
    } else {
      throw new Error("Could not calculate route");
    }
  } catch (error) {
    console.error("Google API Error:", error);
    return null;
  }
};

// ==========================================
// UPDATE A ROUTE (Admin Only)
// Finds the route by ID and updates its
// details in the database.
// ==========================================
export const updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // findByIdAndUpdate automatically applies the changes and returns the new document
    const updatedRoute = await route_model.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true } 
    );

    if (!updatedRoute) {
      return res.status(404).json({ success: false, message: "Route not found" });
    }

    res.status(200).json({ 
      success: true, 
      message: "Route updated successfully", 
      route: updatedRoute 
    });
  } catch (error) {
    console.error("Error updating route:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ==========================================
// DELETE A ROUTE (Admin Only)
// Finds the route by ID and removes it
// from the database.
// ==========================================
export const deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRoute = await route_model.findByIdAndDelete(id);

    if (!deletedRoute) {
      return res.status(404).json({ success: false, message: "Route not found" });
    }

    res.status(200).json({ 
      success: true, 
      message: "Route deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting route:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};