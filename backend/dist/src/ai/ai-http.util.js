"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchWithTimeout = fetchWithTimeout;
async function fetchWithTimeout(url, init = {}) {
    const { timeoutMs = 5000, ...rest } = init;
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), timeoutMs);
    try {
        return await fetch(url, { ...rest, signal: ac.signal });
    }
    finally {
        clearTimeout(t);
    }
}
//# sourceMappingURL=ai-http.util.js.map