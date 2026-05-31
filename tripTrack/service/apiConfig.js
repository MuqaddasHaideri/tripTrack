

//  export const API_BASE = "http://192.168.0.104:3001/api";
export const API_BASE = "https://fyp-atio.onrender.com/api"; 
// export const API_BASE = "https://fyp-atio.onrender.com/api"; 
export const endpoints = {
  login: "/auth/login",
  signup: "/auth/signup",
  checkApprovalStatus: "/auth/check-approval-status",
  getRoutes: '/data/routes',  
  getBuses: '/data/buses',    
  locations: '/data/locations',
  verify : 'api/auth/verify',
  profile:"/auth/profile",
  report : "/data/reports",
  myreport : "/data/reports/my-reports",
  favourites : "/data/favorites",
  fcmToken: "/auth/fcm-token",
  
  getPendingDrivers : "/data/admin/drivers/pending",
  approveDriver : "/data/admin/drivers/approve",
  getAllDrivers : "/data/admin/drivers/all",
  getAllReports : "/data/admin/reports",
  updateReportStatus : "/data/admin/reports",
  getNotifications : "/data/admin/notifications",
  markNotificationRead : "/data/admin/notifications",
  markAllNotificationsRead : "/data/admin/notifications/read-all",

  createAnnouncement : "/data/admin/announcements",
  getAdminAnnouncements : "/data/admin/announcements",
  deleteAnnouncement : "/data/admin/announcements",
  getUserAnnouncements : "/data/announcements",
  adminRoute:'/data/admin/routes',
  addAdmin:'/data/admin/addAdmin',
  getAllAdmins:'/data/admin/all-admins',
  removeAdmin:'/data/admin/remove-admin'

};