import axios from 'axios';

// Vite exposes env vars prefixed with VITE_ via import.meta.env
// Set VITE_API_BASE_URL in frontend/.env to change the backend target

/**
 * Dynamically resolves the API base URL.
 * In local dev (localhost/127.0.0.1), uses http://localhost:3636 (or VITE_API_BASE_URL if set).
 * In deployed domain (e.g. gokulanandachaudhurifoundation.com or any cloud host),
 * automatically uses window.location.origin, production VITE_API_BASE_URL, or relative path.
 */
export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    if (isLocalhost) {
      return 'http://localhost:3636';
    }

    if (!isLocalhost) {
      const envUrl = import.meta.env.VITE_API_BASE_URL;
      if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
        return envUrl.replace(/\/$/, '');
      }
      if (hostname.includes('gokulanandachaudhurifoundation.com') || hostname.includes('utkalodr.com')) {
        return 'https://gokulanandachaudhurifoundation.com';
      }
      return window.location.origin || '';
    }
  }

  const envUrl = import.meta.env.VITE_API_BASE_URL;
  return (envUrl || 'http://localhost:3636').replace(/\/$/, '');
};

export const API_BASE_URL = getApiBaseUrl();

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Update baseURL dynamically per request and attach token (token or authToken) if present
axiosInstance.interceptors.request.use(
  (config) => {
    if (!config.baseURL || config.baseURL === 'http://localhost:3636' || config.baseURL === '') {
      config.baseURL = getApiBaseUrl();
    }
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const resolveFileUrl = (url = "") => {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }
  const base = getApiBaseUrl().replace(/\/+$/, "");
  return `${base}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
};

export const getDownloadFileUrl = (url = "") => {
  const resolved = resolveFileUrl(url);
  if (!resolved) return "";
  if (resolved.includes("/image/upload/") && !resolved.includes("fl_attachment")) {
    return resolved.replace("/image/upload/", "/image/upload/fl_attachment/");
  }
  if (resolved.includes("/raw/upload/") && !resolved.includes("fl_attachment")) {
    return resolved.replace("/raw/upload/", "/raw/upload/fl_attachment/");
  }
  if (resolved.includes("/api/files/") && !/[?&]download=/.test(resolved)) {
    return `${resolved}${resolved.includes("?") ? "&" : "?"}download=1`;
  }
  return resolved;
};

export default axiosInstance;
