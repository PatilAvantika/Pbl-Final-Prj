import { AxiosError } from 'axios';

type MessageBag = string | string[] | Record<string, unknown>[] | undefined;

function normalizeMessage(msg: MessageBag): string | null {
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
    if (Array.isArray(msg)) {
        const parts = msg
            .map((m) => {
                if (typeof m === 'string') return m;
                if (m && typeof m === 'object' && 'constraints' in m) {
                    const c = (m as { constraints?: Record<string, string> }).constraints;
                    return c ? Object.values(c).join(' ') : null;
                }
                return null;
            })
            .filter(Boolean) as string[];
        if (parts.length) return parts.join(' ');
    }
    return null;
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong') {
    const err = error as AxiosError<{ message?: string | string[] | Record<string, unknown>[] }>;
    const fromBody = normalizeMessage(err.response?.data?.message);
    if (fromBody) return fromBody;
    if (err.code === 'ERR_NETWORK' || !err.response) {
        return 'Cannot reach the API. Start the backend and set NEXT_PUBLIC_API_URL to the API base (e.g. http://localhost:3002).';
    }
    if (typeof err.message === 'string' && err.message !== 'Request failed with status code 400') {
        return err.message;
    }
    return fallback;
}
