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

export const fetchBusesApi = async () => {
  const response = await fetchApi(endpoints.getBuses);
  return response.data || [];
};

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
//     const response = await fetchApi(endpoints.locations, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ email, otp }),
//     });

//     const data = await response.json();
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
    return await response.json();
  } catch (error) {
    console.error("Error removing favorite route service call:", error);
    return { success: false, message: "Network error occurred." };
  }
};