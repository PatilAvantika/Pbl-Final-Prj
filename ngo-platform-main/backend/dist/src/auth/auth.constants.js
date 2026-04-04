"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJwtSecret = getJwtSecret;
exports.getJwtExpiresSec = getJwtExpiresSec;
function getJwtSecret() {
    const s = process.env.JWT_SECRET?.trim();
    if (!s) {
        throw new Error('JWT_SECRET environment variable is required and must be non-empty');
    }
    return s;
}
function getJwtExpiresSec() {
    const raw = process.env.JWT_EXPIRES_SEC?.trim();
    const n = raw !== undefined && raw !== '' ? parseInt(raw, 10) : NaN;
    if (!Number.isFinite(n) || n <= 0) {
        throw new Error('JWT_EXPIRES_SEC environment variable is required: positive integer (seconds)');
    }
    return n;
}
//# sourceMappingURL=auth.constants.js.map