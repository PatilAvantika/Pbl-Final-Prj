"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveIanaTimeZone = resolveIanaTimeZone;
exports.safeResolveIanaTimeZone = safeResolveIanaTimeZone;
const common_1 = require("@nestjs/common");
const luxon_1 = require("luxon");
const DEFAULT_TZ = 'UTC';
function resolveIanaTimeZone(raw) {
    const trimmed = (raw ?? DEFAULT_TZ).trim() || DEFAULT_TZ;
    const dt = luxon_1.DateTime.now().setZone(trimmed);
    if (!dt.isValid) {
        throw new common_1.BadRequestException({
            code: 'INVALID_TIMEZONE',
            message: `Invalid IANA timezone: ${trimmed}`,
        });
    }
    return trimmed;
}
function safeResolveIanaTimeZone(raw, fallback = DEFAULT_TZ) {
    const trimmed = (raw ?? fallback).trim() || fallback;
    const dt = luxon_1.DateTime.now().setZone(trimmed);
    return dt.isValid ? trimmed : fallback;
}
//# sourceMappingURL=volunteer-timezone.util.js.map