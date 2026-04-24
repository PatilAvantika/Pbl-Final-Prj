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
exports.FaceSamplesDto = exports.FaceSampleItemDto = exports.OnboardingProfileDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class OnboardingProfileDto {
    firstName;
    lastName;
    phone;
    department;
    emergencyContactName;
    emergencyContactPhone;
}
exports.OnboardingProfileDto = OnboardingProfileDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], OnboardingProfileDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], OnboardingProfileDto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.MaxLength)(24),
    (0, class_validator_1.Matches)(/^[\d\s+\-()]+$/, { message: 'phone must contain digits and optional separators' }),
    __metadata("design:type", String)
], OnboardingProfileDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], OnboardingProfileDto.prototype, "department", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], OnboardingProfileDto.prototype, "emergencyContactName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.MaxLength)(24),
    (0, class_validator_1.Matches)(/^[\d\s+\-()]+$/, {
        message: 'emergency contact phone must contain digits and optional separators',
    }),
    __metadata("design:type", String)
], OnboardingProfileDto.prototype, "emergencyContactPhone", void 0);
class FaceSampleItemDto {
    angle;
    dataUrl;
}
exports.FaceSampleItemDto = FaceSampleItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['front', 'left', 'right']),
    __metadata("design:type", String)
], FaceSampleItemDto.prototype, "angle", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(12_000_000),
    (0, class_validator_1.Matches)(/^data:image\/jpeg;base64,/),
    __metadata("design:type", String)
], FaceSampleItemDto.prototype, "dataUrl", void 0);
class FaceSamplesDto {
    samples;
}
exports.FaceSamplesDto = FaceSamplesDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(3),
    (0, class_validator_1.ArrayMaxSize)(4),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => FaceSampleItemDto),
    __metadata("design:type", Array)
], FaceSamplesDto.prototype, "samples", void 0);
//# sourceMappingURL=onboarding.dto.js.map