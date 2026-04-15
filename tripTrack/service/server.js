import { API_BASE, endpoints } from './apiConfig';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://192.168.0.104:3001:3000'; 

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

export const loginUserApi = async (email, password, role) => {
  return fetchApi(endpoints.login, {
    method: 'POST',
    body: JSON.stringify({ email, password, role }), 
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
        cnic,             // <-- Added
        driverLicense     // <-- Added
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

// ==========================================
// NEW: AUTHENTICATED LOCATION API CALLS
// ==========================================

// 1. Get all saved/recent locations for the user
export const fetchUserLocationsApi = async (token) => {
  const response = await fetchApi(endpoints.locations, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data || [];
};

// 2. Save a new recent search
export const addLocationApi = async (token, locationData) => {
  const response = await fetchApi(endpoints.locations, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(locationData) // { name, address, latitude, longitude, type }
  });
  return response.data;
};

// 3. Update a location (e.g., change 'recent' to 'favorite')
export const updateLocationTypeApi = async (token, locationId, type) => {
  const response = await fetchApi(`${endpoints.locations}/${locationId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ type })
  });
  return response.data;
};

// 4. Delete a location from history
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



// IMPORTANT: Replace this with your computer's local IP address or your hosted backend URL.
// If using Android Emulator, 10.0.2.2 usually points to localhost.
// If using a real phone, use your computer's Wi-Fi IP (e.g., http://192.168.1.5:3000)

export const socket = io(SOCKET_URL, {
  autoConnect: false, // We will connect manually when the map screen opens
  transports: ['websocket'], // Forces fast websockets instead of slow polling
});