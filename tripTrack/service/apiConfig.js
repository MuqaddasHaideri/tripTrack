// app/services/apiConfig.js

// 1. The Base URL (Change this if your IP changes)
export const API_BASE = "http://192.168.10.5:3000/api"; 

// 2. The Endpoints List
export const endpoints = {
  login: "/auth/login",
  signup: "/auth/signup",
  // Add these later:
  // getRoutes: "/routes",
  // updateLocation: "/trips/update"
};