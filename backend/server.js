import express from "express";
import dotenv from "dotenv";
import http from "http"; 
import { Server } from "socket.io"; 
import { start } from "./config/db.js";
import router from "./routes/auth_routes.js"; 
import dataRoutes from "./routes/data_routes.js";
import { getLiveETA } from "./controller/data_Controller.js";

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

io.on("connection", (socket) => {
  console.log(`🟢 New device connected: ${socket.id}`);

  socket.on("join_route", (routeId) => {
    socket.join(routeId);
    console.log(`User joined room: ${routeId}`);
  });
  socket.on("driver_location_update", async (data) => {
    const driverLat = data.lat;
    const driverLng = data.lng;
    const passengerStopLat = 24.8530; 
    const passengerStopLng = 67.0000;
    const etaData = await getLiveETA(driverLat, driverLng, passengerStopLat, passengerStopLng);
    io.to(data.routeId).emit("bus_moved", {
       latitude: driverLat,
       longitude: driverLng,
       eta: etaData ? etaData.durationInTraffic : "Calculating..." 
    });
  });


  socket.on("disconnect", () => {
    console.log(`🔴 Device disconnected: ${socket.id}`);
  });
});

// ==========================================
// START SERVER
// ==========================================

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server & Live Tracking Engine running on port = ${PORT}`);
});