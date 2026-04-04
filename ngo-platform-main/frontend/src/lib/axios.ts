import axios from 'axios';

let inMemoryToken: string | null = null;

export function setApiToken(token: string | null) {
    inMemoryToken = token;
}

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    timeout: 10000,
    withCredentials: true,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
    (config) => {
        // We only access localStorage in the browser (client-side)
        if (inMemoryToken && config.headers) {
            config.headers.Authorization = `Bearer ${inMemoryToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Optional: Response interceptor for handling 401 globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('user');
                // If not already on login page, redirect
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
