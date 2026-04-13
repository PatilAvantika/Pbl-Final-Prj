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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
function normalizePostgresUrl(url) {
    try {
        const u = new URL(url);
        u.searchParams.delete('channel_binding');
        let out = u.toString();
        if (out.endsWith('?')) {
            out = out.slice(0, -1);
        }
        return out;
    }
    catch {
        return url;
    }
}
let PrismaService = class PrismaService extends client_1.PrismaClient {
    pool;
    constructor() {
        let connectionString = process.env.DATABASE_URL;
        if (connectionString && connectionString.startsWith('prisma+postgres://')) {
            const urlObj = new URL(connectionString);
            const apiKey = urlObj.searchParams.get('api_key');
            if (apiKey) {
                const decoded = Buffer.from(apiKey, 'base64').toString('utf-8');
                try {
                    const parsed = JSON.parse(decoded);
                    if (parsed.databaseUrl) {
                        connectionString = parsed.databaseUrl;
                    }
                }
                catch (e) { }
            }
        }
        if (connectionString?.startsWith('postgresql://') || connectionString?.startsWith('postgres://')) {
            connectionString = normalizePostgresUrl(connectionString);
        }
        const connectionTimeoutMillis = Number(process.env.DATABASE_CONNECTION_TIMEOUT_MS) || 90_000;
        const poolMax = Number(process.env.DATABASE_POOL_MAX) || 10;
        const pool = new pg_1.Pool({
            connectionString,
            connectionTimeoutMillis,
            max: poolMax,
            keepAlive: true,
            keepAliveInitialDelayMillis: 10_000,
        });
        const adapter = new adapter_pg_1.PrismaPg(pool);
        super({ adapter });
        this.pool = pool;
    }
    async onModuleInit() {
        await this.$connect();
    }
    async onModuleDestroy() {
        await this.$disconnect();
        await this.pool.end();
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map