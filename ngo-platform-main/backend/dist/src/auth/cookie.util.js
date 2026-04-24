"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REFRESH_TOKEN_COOKIE = exports.ACCESS_TOKEN_COOKIE = void 0;
exports.setAccessTokenCookie = setAccessTokenCookie;
exports.setRefreshTokenCookie = setRefreshTokenCookie;
exports.clearAuthCookies = clearAuthCookies;
const auth_constants_1 = require("./auth.constants");
Object.defineProperty(exports, "ACCESS_TOKEN_COOKIE", { enumerable: true, get: function () { return auth_constants_1.ACCESS_TOKEN_COOKIE; } });
Object.defineProperty(exports, "REFRESH_TOKEN_COOKIE", { enumerable: true, get: function () { return auth_constants_1.REFRESH_TOKEN_COOKIE; } });
const baseOpts = () => ({
    httpOnly: true,
    secure: (0, auth_constants_1.getCookieSecure)(),
    sameSite: (0, auth_constants_1.getCookieSameSite)(),
    path: '/',
});
function setAccessTokenCookie(res, accessToken) {
    res.cookie(auth_constants_1.ACCESS_TOKEN_COOKIE, accessToken, {
        ...baseOpts(),
        maxAge: (0, auth_constants_1.getAccessTokenTtlSec)() * 1000,
    });
}
function setRefreshTokenCookie(res, refreshToken, maxAgeSec) {
    res.cookie(auth_constants_1.REFRESH_TOKEN_COOKIE, refreshToken, {
        ...baseOpts(),
        maxAge: maxAgeSec * 1000,
    });
}
function clearAuthCookies(res) {
    const opts = { path: '/', httpOnly: true, secure: (0, auth_constants_1.getCookieSecure)(), sameSite: (0, auth_constants_1.getCookieSameSite)() };
    res.clearCookie(auth_constants_1.ACCESS_TOKEN_COOKIE, opts);
    res.clearCookie(auth_constants_1.REFRESH_TOKEN_COOKIE, opts);
    res.clearCookie(auth_constants_1.LEGACY_TOKEN_COOKIE, opts);
}
//# sourceMappingURL=cookie.util.js.map