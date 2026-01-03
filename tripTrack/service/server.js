
import { API_BASE, endpoints } from './apiConfig';

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

export const signupUserApi = async (
  name,
  email,
  password,
  role = 'passenger'
) => {
  return fetchApi(endpoints.signup, {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role }),
  });
};
