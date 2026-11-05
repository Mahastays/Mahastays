import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token from localStorage
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token =
        localStorage.getItem('mahastays_admin_token') ||
        localStorage.getItem('mahastays_auth_token') ||
        localStorage.getItem('mahastays_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Normalize backend ApiError responses & auto-logout on expired session (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = String(error.config?.url || '');

    // Skip auto-redirect for explicit login or verification attempts to allow normal error messaging
    const isAuthAttempt =
      requestUrl.includes('/auth/admin/login') ||
      requestUrl.includes('/auth/vendor/login') ||
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/verify-otp') ||
      requestUrl.includes('/resend-otp');

    if (status === 401 && !isAuthAttempt) {
      if (typeof window !== 'undefined') {
        // Clear all persistent session credentials
        localStorage.removeItem('mahastays_admin_token');
        localStorage.removeItem('mahastays_auth_token');
        localStorage.removeItem('mahastays_token');
        localStorage.removeItem('mahastays_auth_user');
        localStorage.removeItem('mahastays_auth_view_mode');

        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login')) {
          const redirectParam = encodeURIComponent(currentPath + (window.location.search || ''));
          window.location.href = `/login?session_expired=true&redirect=${redirectParam}`;
        }
      }
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
    (enhancedError as any).code = errorData?.code || (error.code === 'ERR_NETWORK' ? 'ERR_NETWORK' : 'REQUEST_FAILED');
    (enhancedError as any).details = errorData?.details;
    (enhancedError as any).status = error.response?.status;
    (enhancedError as any).isNetworkError = error.code === 'ERR_NETWORK' || error.message === 'Network Error';

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
    'An unexpected network error occurred'
  );
}

export default api;
