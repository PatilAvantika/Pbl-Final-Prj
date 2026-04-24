"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var VolunteerCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VolunteerCacheService = void 0;
const common_1 = require("@nestjs/common");
const redis_module_1 = require("../redis/redis.module");
const KEY_PREFIX = 'volunteer:dashboard:v1';
let VolunteerCacheService = VolunteerCacheService_1 = class VolunteerCacheService {
    redis;
    log = new common_1.Logger(VolunteerCacheService_1.name);
    constructor(redis) {
        this.redis = redis;
        if (!redis) {
            this.log.log('Redis not configured — volunteer dashboard cache disabled');
        }
    }
    async onModuleDestroy() {
    }
    cacheKey(userId, organizationId, timeZone) {
        const tz = encodeURIComponent(timeZone);
        return `${KEY_PREFIX}:${userId}:${organizationId}:${tz}`;
    }
    async getJson(userId, organizationId, timeZone) {
        if (!this.redis)
            return null;
        try {
            const raw = await this.redis.get(this.cacheKey(userId, organizationId, timeZone));
            return raw ? JSON.parse(raw) : null;
        }
        catch (e) {
            this.log.warn(`get: ${e instanceof Error ? e.message : e}`);
            return null;
        }
    }
    async setJson(userId, organizationId, timeZone, payload, ttlSec) {
        if (!this.redis)
            return;
        try {
            await this.redis.setex(this.cacheKey(userId, organizationId, timeZone), ttlSec, JSON.stringify(payload));
        }
        catch (e) {
            this.log.warn(`set: ${e instanceof Error ? e.message : e}`);
        }
    }
    async invalidateForUser(userId) {
        if (!this.redis)
            return;
        const pattern = `${KEY_PREFIX}:${userId}:*`;
        let cursor = '0';
        try {
            do {
                const [next, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 64);
                cursor = next;
                if (keys.length)
                    await this.redis.del(...keys);
            } while (cursor !== '0');
        }
        catch (e) {
            this.log.warn(`invalidate: ${e instanceof Error ? e.message : e}`);
        }
    }
};
exports.VolunteerCacheService = VolunteerCacheService;
exports.VolunteerCacheService = VolunteerCacheService = VolunteerCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(0, (0, common_1.Inject)(redis_module_1.REDIS_CLIENT)),
    __metadata("design:paramtypes", [Object])
], VolunteerCacheService);
//# sourceMappingURL=volunteer-cache.service.js.map