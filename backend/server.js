import express from "express";
import dotenv from "dotenv";
import http from "http"; 
import { Server } from "socket.io"; 


import { start } from "./config/db.js";
import router from "./routes/auth_routes.js"; 
import dataRoutes from "./routes/data_routes.js";

import { calculateDistanceKm, formatETAMessage } from "./controller/data_Controller.js";
import route_model from "./models/route_models.js"; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

start(); 

app.use("/api/auth", router); 
app.use("/api/data", dataRoutes);

const server = http.createServer(app); 

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

const activeBusesCache = {};

// ==========================================
// SOCKET.IO REAL-TIME ENGINE
// ==========================================
io.on("connection", (socket) => {
  console.log(`🟢 New device connected: ${socket.id}`);

  // 1. PASSENGER JOINS ROUTE
  socket.on("join_route", (routeId) => {
    socket.join(routeId);
    console.log(`User joined room: ${routeId}`);

  
    Object.values(activeBusesCache).forEach((busData) => {
      if (busData.routeId === routeId) {
        socket.emit("bus_moved", busData); 
      }
    });
  });

  // 2. DRIVER SENDS LIVE LOCATION
  socket.on("driver_location_update", async (data) => {
    try {
      const driverLat = data.lat;
      const driverLng = data.lng;
      const busId = data.busId || socket.id; 

      const route = await route_model.findById(data.routeId);
      
      if (!route || !route.stops || route.stops.length === 0) return;

      let closestStopName = "Next Stop";
      let minDistance = Infinity;

      for (let stop of route.stops) {
        const distance = calculateDistanceKm(driverLat, driverLng, stop.latitude, stop.longitude);
        if (distance < minDistance) {
          minDistance = distance;
          closestStopName = stop.name || stop.stopName || "Next Stop"; 
        }
      }

      const etaMessage = formatETAMessage(minDistance, closestStopName);

      const payload = {
         busId: busId,
         routeId: data.routeId,
         latitude: driverLat,
         longitude: driverLng,
         displayMessage: etaMessage 
      };

      activeBusesCache[busId] = payload;

      io.to(data.routeId).emit("bus_moved", payload);

    } catch (error) {
      console.error("Socket DB Query Error:", error);
    }
  });

  socket.on("end_shift", (data) => {
    const { busId, routeId } = data;
    
    if (activeBusesCache[busId]) {
      delete activeBusesCache[busId];
      console.log(`🗑️ Cache invalidated for Bus ID: ${busId}`);
    }

    io.to(routeId).emit("bus_offline", { busId: busId });
  });

  socket.on("disconnect", () => {
    console.log(`🔴 Device disconnected: ${socket.id}`);
    
    for (const busId in activeBusesCache) {

      if (activeBusesCache[busId].busId === socket.id) {
        const routeId = activeBusesCache[busId].routeId;
        delete activeBusesCache[busId];
        io.to(routeId).emit("bus_offline", { busId: busId });
      }
    }
  });
});

// ==========================================
// START SERVER
// ==========================================
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server & Live Tracking Engine running on port = ${PORT}`);
});