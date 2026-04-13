"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonorModule = void 0;
const common_1 = require("@nestjs/common");
const donor_controller_1 = require("./donor.controller");
const donor_service_1 = require("./donor.service");
const donor_repository_1 = require("./donor.repository");
const donor_cache_service_1 = require("./donor-cache.service");
const prisma_module_1 = require("../prisma/prisma.module");
const audit_module_1 = require("../audit/audit.module");
let DonorModule = class DonorModule {
};
exports.DonorModule = DonorModule;
exports.DonorModule = DonorModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, audit_module_1.AuditModule],
        controllers: [donor_controller_1.DonorController],
        providers: [donor_repository_1.DonorRepository, donor_cache_service_1.DonorCacheService, donor_service_1.DonorService],
        exports: [donor_service_1.DonorService, donor_repository_1.DonorRepository, donor_cache_service_1.DonorCacheService],
    })
], DonorModule);
//# sourceMappingURL=donor.module.js.map