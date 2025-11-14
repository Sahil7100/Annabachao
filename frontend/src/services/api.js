import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants'

// Resolve a platform-safe API base URL
function resolveBaseUrl() {
  // 1) Prefer explicit env var from Expo. Set via EXPO_PUBLIC_API_URL
  const envUrl = process.env.EXPO_PUBLIC_API_URL || process.env.REACT_NATIVE_API_URL;
  if (envUrl && typeof envUrl === 'string') {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`;
  }

  // 2) Support configuring via app.json extra.apiUrl
  try {
    const extraApi = Constants?.expoConfig?.extra?.apiUrl || Constants?.manifest?.extra?.apiUrl;
    if (extraApi && typeof extraApi === 'string') {
      return extraApi.endsWith('/api') ? extraApi : `${extraApi.replace(/\/$/, '')}/api`;
    }
  } catch (_) {}

  // Try to infer LAN host from Expo for physical devices on same network
  try {
    const hostUri = (Constants?.expoConfig?.hostUri || Constants?.manifest?.debuggerHost) || '';
    if (hostUri) {
      const host = hostUri.split(':')[0];
      if (host && /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
        return `http://${host}:5000/api`;
      }
    }
  } catch (_) {}

  // Infer from RN bundle URL (works in dev when Constants fields are missing)
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL || '';
    // e.g. http://192.168.1.20:8081/index.bundle?platform=android&dev=true
    const match = scriptURL.match(/https?:\/\/(\d+\.\d+\.\d+\.\d+)/i);
    if (match && match[1]) {
      return `http://${match[1]}:5000/api`;
    }
  } catch (_) {}

  // Emulator/simulator defaults
  if (Platform.OS === 'android' && Constants?.isDevice === false) {
    // Android emulator maps host loopback to 10.0.2.2
    return 'http://10.0.2.2:5000/api';
  }
  if (Platform.OS === 'ios' && Constants?.isDevice === false) {
    return 'http://localhost:5000/api';
  }

  // Web or fallback
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:5000/api`;
  }

  // Final fallback – warn so developers know to set EXPO_PUBLIC_API_URL or extra.apiUrl
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn('[API] Falling back to localhost. Set EXPO_PUBLIC_API_URL or app.json extra.apiUrl to avoid connectivity issues on device.');
  }
  return 'http://localhost:5000/api';
}

const DEFAULT_BASE_URL = resolveBaseUrl();
if (__DEV__) {
  // eslint-disable-next-line no-console
  console.log('[API] Base URL (default):', DEFAULT_BASE_URL);
}

// Create axios instance (baseURL will be assigned per-request via interceptor)
const api = axios.create({
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

async function resolveDynamicBaseRoot() {
  // Highest priority: runtime override saved in AsyncStorage (no trailing /api)
  try {
    const stored = await AsyncStorage.getItem('apiBaseRoot');
    if (stored && typeof stored === 'string') {
      return stored.replace(/\/$/, '');
    }
  } catch (_) {}

  // Next: explicit env/app.json fallbacks already handled by resolveBaseUrl()
  const urlWithApi = DEFAULT_BASE_URL;
  return urlWithApi.replace(/\/?api$/, '');
}

let initializingBaseRootPromise = null;
async function ensureBaseRootInitialized() {
  if (initializingBaseRootPromise) return initializingBaseRootPromise;
  initializingBaseRootPromise = (async () => {
    try {
      const existing = await AsyncStorage.getItem('apiBaseRoot');
      if (existing) return existing;

      const candidates = [];
      const envUrl = process.env.EXPO_PUBLIC_API_URL || process.env.REACT_NATIVE_API_URL;
      const extraUrl = (Constants?.expoConfig?.extra?.apiUrl) || (Constants?.manifest?.extra?.apiUrl);
      if (envUrl && typeof envUrl === 'string') candidates.push(envUrl.replace(/\/$/, ''));
      if (extraUrl && typeof extraUrl === 'string') candidates.push(extraUrl.replace(/\/$/, ''));

      try {
        const hostUri = (Constants?.expoConfig?.hostUri || Constants?.manifest?.debuggerHost) || '';
        if (hostUri) {
          const host = hostUri.split(':')[0];
          if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) candidates.push(`http://${host}:5000`);
        }
      } catch (_) {}

      try {
        const scriptURL = NativeModules?.SourceCode?.scriptURL || '';
        const m = scriptURL.match(/https?:\/\/(\d+\.\d+\.\d+\.\d+)/i);
        if (m && m[1]) candidates.push(`http://${m[1]}:5000`);
      } catch (_) {}

      if (Platform.OS === 'android' && Constants?.isDevice === false) candidates.push('http://10.0.2.2:5000');
      if (Platform.OS === 'ios' && Constants?.isDevice === false) candidates.push('http://localhost:5000');

      const unique = Array.from(new Set(candidates.filter(Boolean)));

      for (const root of unique) {
        try {
          const res = await Promise.race([
            fetch(`${root}/health`, { method: 'GET' }),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 2500)),
          ]);
          if (res && res.ok) {
            await AsyncStorage.setItem('apiBaseRoot', root);
            if (__DEV__) {
              // eslint-disable-next-line no-console
              console.log('[API] Initialized base root:', root);
            }
            return root;
          }
        } catch (_) {}
      }

      return null;
    } catch (_) {
      return null;
    }
  })();
  return initializingBaseRootPromise;
}

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    await ensureBaseRootInitialized();
    // Dynamically set baseURL per request so devices don't get stuck with localhost/10.0.2.2
    try {
      const baseRoot = await resolveDynamicBaseRoot();
      const finalBase = baseRoot.endsWith('/api') ? baseRoot : `${baseRoot}/api`;
      config.baseURL = finalBase;
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[API] Using base:', finalBase);
      }
    } catch (_) {}

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    // Cache last known good base root on any successful response
    try {
      const url = response?.config?.baseURL || '';
      const root = url.replace(/\/?api$/, '');
      if (root) AsyncStorage.setItem('apiBaseRoot', root);
    } catch (_) {}
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      // You can dispatch a logout action here if using Redux/Context
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  login: (email, password) => 
    api.post('/auth/login', { email: String(email).trim().toLowerCase(), password }),
  
  register: (userData) => 
    api.post('/auth/register', {
      ...userData,
      email: String(userData?.email || '').trim().toLowerCase(),
      name: String(userData?.name || '').trim(),
    }),
  
  getProfile: () => 
    api.get('/auth/me'),
  
  logout: async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
  }
};

// Donation API endpoints
export const donationAPI = {
  createDonation: (donationData) => 
    api.post('/donations/create', donationData),
  
  getAvailableDonations: (params) => 
    api.get('/donations/available', { params }),
  
  getUserDonations: (userId, params) => 
    api.get(`/donations/user/${userId}`, { params }),
  
  getNGODonations: (ngoId, params) => 
    api.get(`/donations/ngo/${ngoId}`, { params }),
  
  updateDonation: (donationId, updateData) => 
    api.put(`/donations/update/${donationId}`, updateData)
};

// Admin API endpoints
export const adminAPI = {
  getDashboardStats: () => 
    api.get('/admin/dashboard'),
  
  getAllDonations: (params) => 
    api.get('/admin/donations', { params }),
  
  updateDonationStatus: (donationId, statusData) => 
    api.put(`/admin/donations/${donationId}/status`, statusData),
  
  batchAssignDonations: (donationIds) => 
    api.post('/admin/donations/batch-assign', { donationIds }),
  
  reassignDonations: () => 
    api.post('/admin/donations/reassign'),
  
  getNGOStats: (ngoId) => 
    api.get(`/admin/ngo/${ngoId}/stats`),
  
  compareAlgorithms: (coordinates) => 
    api.post('/admin/compare-algorithms', coordinates)
};

// User API endpoints
export const userAPI = {
  updateProfile: (userId, profileData) => 
    api.put(`/users/${userId}`, profileData),
  
  getNGONearby: (coordinates) => 
    api.post('/users/ngo/nearby', coordinates)
};

// Utility functions
export const setAuthToken = async (token) => {
  try {
    await AsyncStorage.setItem('authToken', token);
  } catch (error) {
    console.error('Error setting auth token:', error);
  }
};

export const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const clearAuthData = async () => {
  try {
    await AsyncStorage.multiRemove(['authToken', 'userData']);
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

export default api;
