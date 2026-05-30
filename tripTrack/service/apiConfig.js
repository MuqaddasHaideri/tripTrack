

export const API_BASE = "https://fyp-atio.onrender.com/api"; 

export const endpoints = {
  login: "/auth/login",
  signup: "/auth/signup",
  getRoutes: '/data/routes',  
  getBuses: '/data/buses',    
  locations: '/data/locations',
  verify : 'api/auth/verify',
  profile:"/auth/profile",
  report : "/data/reports",
  myreport : "/data/reports/my-reports",
  favourites : "/data/favorites",
  
  getPendingDrivers : "/data/admin/drivers/pending",
  approveDriver : "/data/admin/drivers/approve",
  getAllDrivers : "/data/admin/drivers/all",
  getAllReports : "/data/admin/reports",
  updateReportStatus : "/data/admin/reports"
};