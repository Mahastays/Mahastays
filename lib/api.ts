import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT bearer token from localStorage
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('mahastays_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Normalize backend ApiError responses & clear stale session on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('mahastays_token');
      localStorage.removeItem('mahastays_auth_user');
    }

    const errorData = error.response?.data?.error;
    let message = errorData?.message || error.response?.data?.message;

    if (errorData?.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
      const detailMessages = errorData.details
        .map((d: any) => d.message || (typeof d === 'string' ? d : ''))
        .filter(Boolean);
      if (detailMessages.length > 0) {
        message = detailMessages.join('. ');
      }
    }

    if (!message) {
      message = error.message || 'An unexpected error occurred. Please try again.';
    }

    const enhancedError = new Error(message);
    (enhancedError as any).code = errorData?.code || 'REQUEST_FAILED';
    (enhancedError as any).details = errorData?.details;
    (enhancedError as any).status = error.response?.status;

    return Promise.reject(enhancedError);
  }
);

export function getApiErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.details && Array.isArray(error.details) && error.details.length > 0) {
    const detailList = error.details.map((d: any) => d.message || `${d.path}: invalid`).filter(Boolean);
    if (detailList.length > 0) return detailList.join('. ');
  }
  if (error?.response?.data?.error?.details && Array.isArray(error.response.data.error.details)) {
    const detailList = error.response.data.error.details.map((d: any) => d.message || `${d.path}: invalid`).filter(Boolean);
    if (detailList.length > 0) return detailList.join('. ');
  }
  return (
    error?.message ||
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    'An unexpected error occurred'
  );
}

export default api;
