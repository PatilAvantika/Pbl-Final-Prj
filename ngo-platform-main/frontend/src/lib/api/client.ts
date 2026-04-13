import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

/** Default matches backend `PORT` in this repo (see backend `.env` / README). */
function normalizeApiBase(raw?: string): string {
    const u = (raw || 'http://localhost:3002').replace(/\/$/, '');
    if (u.endsWith('/api/v1')) return u;
    return `${u}/api/v1`;
}

const baseURL = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL);

/**
 * Central API client — cookies only (httpOnly access + refresh). Never store JWT in localStorage.
 */
export const api = axios.create({
    baseURL,
    timeout: 20_000,
    withCredentials: true,
});

let refreshPromise: Promise<void> | null = null;

function refreshSession(): Promise<void> {
    if (!refreshPromise) {
        refreshPromise = axios
            .post(`${baseURL}/auth/refresh`, {}, { withCredentials: true, timeout: 15_000 })
            .then(() => undefined)
            .catch((err) => {
                throw err;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }
    return refreshPromise;
}

api.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
        const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
        const status = error.response?.status;

        if (status !== 401 || !original || original._retry) {
            return Promise.reject(error);
        }

        const url = original.url || '';
        if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')) {
            return Promise.reject(error);
        }

        original._retry = true;
        try {
            await refreshSession();
            return api(original);
        } catch {
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }
    },
);

export default api;
