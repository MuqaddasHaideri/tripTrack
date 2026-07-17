import { API_BASE, endpoints } from './apiConfig';
import { io } from 'socket.io-client';

const SOCKET_URL = 'https://fyp-atio.onrender.com'; 

const fetchApi = async (url, options = {}) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); 

    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);
    
    const data = await response.json();
    if (!response.ok) {
      throw data?.message || 'Request failed';
    }

    return data;

  } catch (error) {
    if (error.name === 'AbortError') {
      throw 'Request timeout';
    }
    throw error || 'Network Error';
  }
};

export const loginUserApi = async (email, password) => {
  return fetchApi(endpoints.login, {
    method: 'POST',
    body: JSON.stringify({ email, password }), 
  });
};

export const checkApprovalStatusApi = async (email) => {
  return fetchApi(endpoints.checkApprovalStatus, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

export const signupUserApi = async (name, email, password, role = '', phone = '') => {
  return fetchApi(endpoints.signup, {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role, phone }),
  });
};
export const signupdriver = async (name, email, password, role, phone, cnic, driverLicense) => {
  return fetchApi(endpoints.signup, {
    method: 'POST',
    body: JSON.stringify({ 
        name, 
        email, 
        password, 
        role,
        phone,
        cnic,           
        driverLicense     
    }),
  });
};
export const fetchRoutesApi = async () => {
  const response = await fetchApi(endpoints.getRoutes);
  return response.data || []; 
};

// export const fetchBusesApi = async () => {
//   const response = await fetchApi(endpoints.getBuses);
//   return response.data || [];
// };

export const fetchUserLocationsApi = async (token) => {
  const response = await fetchApi(endpoints.locations, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data || [];
};

export const addLocationApi = async (token, locationData) => {
  const response = await fetchApi(endpoints.locations, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(locationData) 
  });
  return response.data;
};

export const updateLocationTypeApi = async (token, locationId, type) => {
  const response = await fetchApi(`${endpoints.locations}/${locationId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ type })
  });
  return response.data;
};

export const deleteLocationApi = async (token, locationId) => {
  return fetchApi(`${endpoints.locations}/${locationId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const fetchNearbyRoutesApi = async (lat, lng) => {
  if (!lat || !lng) return []; 

  const response = await fetchApi(`/data/routes/nearby?lat=${lat}&lng=${lng}`);
  return response.data || [];
};

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket'],
  reconnectionAttempts: 5,
});

socket.on('connect', () => {
  console.log('✅ Socket Connected to Server!');
});

socket.on('connect_error', (err) => {
  console.log('❌ Socket Connection Error:', err.message);
});

// export const verifyEmailApi = async (email, otp) => {
//   try {
//     const response = await fetchApi(endpoints.verify, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ email, otp }),
//     });

//     return response;
//     return data;
//   } catch (error) {
//     console.error("Verification API Error:", error);
//     return { success: false, message: "Network error occurred." };
//   }
// };

// ==========================================
// GET PROFILE
// ==========================================
export const getUserProfileApi = async (token) => {
  try {
    const data = await fetchApi(`${endpoints.profile}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, 
      },
    });

    console.log("Profile GET Response:", data);
    return data; 
  } catch (error) {
    console.error("Error fetching profile:", error);
    return { success: false, message: error.message || "Network error occurred." };
  }
};

// ==========================================
// UPDATE PROFILE
// ==========================================
export const updateUserProfileApi = async (updateData, token) => {
  try {
    const data = await fetchApi(`${endpoints.profile}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData), 
    });
    console.log("Profile UPDATE Response:", data);
    return data;
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, message: error.message || "Network error occurred." };
  }
};

// ==========================================
// DELETE PROFILE
// ==========================================
export const deleteUserProfileApi = async (token) => {
  try {
    const data = await fetchApi(`${endpoints.profile}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log("Profile DELETE Response:", data);
    return data;
  } catch (error) {
    console.error("Error deleting profile:", error);
    return { success: false, message: error.message || "Network error occurred." };
  }
};
// ==========================================
//  Submit Report API
// ==========================================
export const submitReportApi = async (reportData, token) => {
  try { 
    // Configured for your backend reporting route endpoint layout
       const data = await fetchApi(`${endpoints.report}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(reportData)
    });
    return data;
  } catch (error) {
    console.error("Submit Report Error:", error);
    return { success: false, message: "Network error occurred." };
  }
};
// ==========================================
//  Fetch Past User Reports API
// ==========================================
export const getMyReportsApi = async ( token) => {
 try {
    const data = await fetchApi(`${endpoints.myreport}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    console.log("My Reports Response:", data);
    return data;
  } catch (error) {
    console.error("Get Past Reports Error:", error);
    return { success: false, reports: [], message: "Network error occurred." };
  }
};
// ==========================================
//  POST: ADD ROUTE TO FAVORITES
// ==========================================
export const addFavoriteRouteApi = async (routeId, token) => {
  try {
     const data = await fetchApi(`${endpoints.favourites}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ routeId })
    });
    return data;
  } catch (error) {
    console.error("Error adding favorite route service call:", error);
    return { success: false, message: "Network error occurred." };
  }
};

// ==========================================
// 2. GET: FETCH USER'S FAVORITE ROUTES
// ==========================================
export const fetchMyFavoritesApi = async (token) => {
  try {
  const data = await fetchApi(`${endpoints.favourites}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    console.log("My Favorites Response:", data);
    return data;

  } catch (error) {
    console.error("Error fetching favorites service call:", error);
    return { success: false, favorites: [], message: "Network error occurred." };
  }
};

// ==========================================
// 3. DELETE: REMOVE ROUTE FROM FAVORITES
// ==========================================
export const removeFavoriteApi = async (routeId, token) => {
    try {
    const data = await fetchApi(`${endpoints.favourites}/${routeId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
  } catch (error) {
    console.error("Error removing favorite route service call:", error);
    return { success: false, message: "Network error occurred." };
  }
};



// ==========================================
 // GET: Fetch all pending drivers awaiting approval
// ==========================================

 
export const fetchPendingDriversApi = async (token) => {
  try {
    const data = await fetchApi(`${endpoints.getPendingDrivers}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
  } catch (error) {
    console.error("Error fetching pending drivers service call:", error);
    return { success: false, drivers: [], message: "Network error occurred." };
  }
};


// ==========================================
 // PUT: Approve a specific driver by ID
// ==========================================
export const approveDriverApi = async (driverId, token) => {
  try {
    const data = await fetchApi(`${endpoints.approveDriver}/${driverId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
  } catch (error) {
    console.error("Error approving driver service call:", error);
    return { success: false, message: "Network error occurred." };
  }
};
// ==========================================
 // GET: Fetch all drivers (approved, pending, etc.)
// ==========================================

export const fetchAllDriversApi = async (token) => {
  try {
    const data = await fetchApi(`${endpoints.getAllDrivers}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
  } catch (error) {
    console.error("Error fetching all drivers service call:", error);
    return { success: false, drivers: [], message: "Network error occurred." };
  }
};
// ==========================================
// GET: Fetch all driver reports

// ==========================================

export const fetchAllReportsApi = async (token) => {
  try {
    const data = await fetchApi(`${endpoints.getAllReports}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
  } catch (error) {
    console.error("Error fetching reports service call:", error);
    return { success: false, reports: [], message: "Network error occurred." };
  }
};
// ==========================================
 //PUT: Update the status of a specific report (e.g., resolving it) Passing status in the body to allow flexible updates (e.g., 'resolved', 'investigating')
// ==========================================

export const updateReportStatusApi = async (reportId, status, token) => {
  try {
    const data = await fetchApi(`${endpoints.updateReportStatus}/${reportId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status })
    });
    return data;
  } catch (error) {
    console.error("Error updating report status service call:", error);
    return { success: false, message: "Network error occurred." };
  }
};

// ==========================================
// PUT: Register FCM Token for Push Notifications
// ==========================================
export const registerFcmTokenApi = async (fcmToken, authToken) => {
  try {
    const data = await fetchApi(`${endpoints.fcmToken}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ fcmToken })
    });
    return data;
  } catch (error) {
    console.error("Error registering FCM token:", error);
    return { success: false, message: "Network error occurred." };
  }
};

// ==========================================
// GET: Fetch admin notifications
// ==========================================
export const fetchNotificationsApi = async (token) => {
  try {
    const data = await fetchApi(`${endpoints.getNotifications}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { success: false, notifications: [], unreadCount: 0 };
  }
};

// ==========================================
// PUT: Mark single notification as read
// ==========================================
export const markNotificationReadApi = async (notificationId, token) => {
  try {
    const data = await fetchApi(`${endpoints.markNotificationRead}/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
  } catch (error) {
    console.error("Error marking notification read:", error);
    return { success: false };
  }
};

// ==========================================
// PUT: Mark all notifications as read
// ==========================================
export const markAllNotificationsReadApi = async (token) => {
  try {
    const data = await fetchApi(`${endpoints.markAllNotificationsRead}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
  } catch (error) {
    console.error("Error marking all notifications read:", error);
    return { success: false };
  }
};

// ==========================================
// POST: Create Announcement (Admin)
// ==========================================
export const createAnnouncementApi = async (announcementData, token) => {
  try {
    const data = await fetchApi(`${endpoints.createAnnouncement}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(announcementData),
    });
    return data;
  } catch (error) {
    console.error("Error creating announcement:", error);
    return { success: false, message: "Network error occurred." };
  }
};

// ==========================================
// GET: Fetch All Announcements (Admin)
// ==========================================
export const fetchAdminAnnouncementsApi = async (token) => {
  try {
    const data = await fetchApi(`${endpoints.getAdminAnnouncements}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
  } catch (error) {
    console.error("Error fetching admin announcements:", error);
    return { success: false, announcements: [] };
  }
};

// ==========================================
// DELETE: Delete Announcement (Admin)
// ==========================================
export const deleteAnnouncementApi = async (id, token) => {
  try {
    const data = await fetchApi(`${endpoints.deleteAnnouncement}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return { success: false, message: "Network error occurred." };
  }
};

// ==========================================
// GET: Fetch Announcements for User (by role)
// ==========================================
export const fetchUserAnnouncementsApi = async (token) => {
  try {
    const data = await fetchApi(`${endpoints.getUserAnnouncements}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
  } catch (error) {
    console.error("Error fetching user announcements:", error);
    return { success: false, announcements: [] };
  }
};
// ==========================================
// POST: Create Routes (Admin)
// ==========================================
export const createRouteApi = async (routeData, token) => {
  try {
    const data = await fetchApi(`${endpoints.adminRoute}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(routeData),
    });
    return data;
  } catch (error) {
    console.error("Error creating route:", error);
    return { success: false, message: "Network error occurred." };
  }
};
// ==========================================
// DELETE: Delete Routes(Admin)
// ==========================================
export const deleteRouteApi = async (id, token) => {
  try {
    const data = await fetchApi(`${endpoints.adminRoute}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
  } catch (error) {
    console.error("Error deleting route:", error);
    return { success: false, message: "Network error occurred." };
  }
};
// ==========================================
// PUT: update routes (Admin)
// ==========================================
export const updateRouteApi = async (id, routeData, token) => {
  try {
    const data = await fetchApi(`${endpoints.adminRoute}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
     body: JSON.stringify(routeData),
    });
    return data;
  } catch (error) {
    console.error("Error updating route:", error);
    return { success: false };
  }
};

// ==========================================
// POST: Create New Admin
// ==========================================
export const createAdminApi = async (adminData, token) => {
  try {
    const data = await fetchApi(`${endpoints.addAdmin}`, { // Make sure this endpoint matches your backend route!
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(adminData),
    });
    return data;
  } catch (error) {
    console.error("Error creating admin:", error);
    return { success: false, message: "Network error occurred." };
  }
};

// ==========================================
// GET: Fetch All Admins (or Users)
// ==========================================
export const fetchAdminsApi = async (token) => {
  try {
    const data = await fetchApi(`${endpoints.getAllAdmins}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      }
    });
    return data;
  } catch (error) {
    console.error("Error fetching admins:", error);
    return { success: false, message: "Network error occurred." };
  }
};

// ==========================================
// DELETE: Remove Admin Access
// ==========================================
export const deleteAdminApi = async (id, token) => {
  try {
    const data = await fetchApi(`${endpoints.removeAdmin}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return data;
  } catch (error) {
    console.error("Error deleting admin:", error);
    return { success: false, message: "Network error occurred." };
  }
};

export const deleteReportApi = async (id, token) => {
  try {
    const data = await fetchApi(`${endpoints.adminReports}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log("Report DELETE Response:", data);
    return data;
  } catch (error) {
    console.error("Error deleting report:", error);
    return { success: false, message: error.message || "Network error occurred." };
  }
};