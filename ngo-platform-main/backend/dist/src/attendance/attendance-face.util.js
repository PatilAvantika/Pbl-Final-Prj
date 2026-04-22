"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAttendanceImage = parseAttendanceImage;
exports.decodeAttendanceFrame = decodeAttendanceFrame;
exports.frameToEmbedding = frameToEmbedding;
exports.cosineSimilarity = cosineSimilarity;
exports.detectFacePresence = detectFacePresence;
exports.estimateLivenessScore = estimateLivenessScore;
exports.buildAttendanceFaceTemplate = buildAttendanceFaceTemplate;
exports.hashAttendanceImage = hashAttendanceImage;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const jpeg = __importStar(require("jpeg-js"));
function fail(message) {
    throw new common_1.BadRequestException(message);
}
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
function toGray(r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
}
function toSkinToneScore(r, g, b) {
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
    return cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173;
}
function parseAttendanceImage(input) {
    const trimmed = input.trim();
    if (!trimmed) {
        fail('Attendance image is required');
    }
    const commaIndex = trimmed.indexOf(',');
    const base64 = trimmed.startsWith('data:') && commaIndex >= 0 ? trimmed.slice(commaIndex + 1) : trimmed;
    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length < 1024) {
        fail('Attendance image payload is too small');
    }
    if (buffer[0] !== 0xff || buffer[1] !== 0xd8) {
        fail('Attendance image must be a JPEG data URL or base64 JPEG payload');
    }
    return buffer;
}
function decodeAttendanceFrame(input) {
    const buffer = parseAttendanceImage(input);
    const decoded = jpeg.decode(buffer, { useTArray: true });
    if (!decoded.width || !decoded.height || !decoded.data) {
        fail('Unable to decode attendance image');
    }
    return {
        buffer,
        width: decoded.width,
        height: decoded.height,
        data: decoded.data,
    };
}
function frameToEmbedding(frame) {
    const cropScale = 0.72;
    const cropWidth = Math.max(8, Math.round(frame.width * cropScale));
    const cropHeight = Math.max(8, Math.round(frame.height * cropScale));
    const cropX = Math.max(0, Math.floor((frame.width - cropWidth) / 2));
    const cropY = Math.max(0, Math.floor((frame.height - cropHeight) / 2));
    const outputWidth = 16;
    const outputHeight = 8;
    const values = [];
    for (let y = 0; y < outputHeight; y += 1) {
        for (let x = 0; x < outputWidth; x += 1) {
            const sampleX = clamp(Math.round(cropX + ((x + 0.5) / outputWidth) * cropWidth), 0, frame.width - 1);
            const sampleY = clamp(Math.round(cropY + ((y + 0.5) / outputHeight) * cropHeight), 0, frame.height - 1);
            const idx = (sampleY * frame.width + sampleX) * 4;
            const r = frame.data[idx] ?? 0;
            const g = frame.data[idx + 1] ?? 0;
            const b = frame.data[idx + 2] ?? 0;
            values.push(toGray(r, g, b));
        }
    }
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
    const stdDev = Math.sqrt(variance) || 1;
    const embedding = values.map((value) => (value - mean) / stdDev);
    const magnitude = Math.sqrt(embedding.reduce((sum, value) => sum + value * value, 0)) || 1;
    return embedding.map((value) => value / magnitude);
}
function cosineSimilarity(left, right) {
    const size = Math.min(left.length, right.length);
    if (!size)
        return 0;
    let dot = 0;
    let leftMagnitude = 0;
    let rightMagnitude = 0;
    for (let i = 0; i < size; i += 1) {
        dot += left[i] * right[i];
        leftMagnitude += left[i] * left[i];
        rightMagnitude += right[i] * right[i];
    }
    const magnitude = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
    if (!magnitude)
        return 0;
    return dot / magnitude;
}
function detectFacePresence(frame) {
    const centerX = Math.floor(frame.width / 2);
    const centerY = Math.floor(frame.height / 2);
    const cropWidth = Math.max(10, Math.round(frame.width * 0.6));
    const cropHeight = Math.max(10, Math.round(frame.height * 0.6));
    const startX = Math.max(0, Math.floor(centerX - cropWidth / 2));
    const startY = Math.max(0, Math.floor(centerY - cropHeight / 2));
    const endX = Math.min(frame.width, startX + cropWidth);
    const endY = Math.min(frame.height, startY + cropHeight);
    let centerCount = 0;
    let skinCount = 0;
    let graySum = 0;
    let graySqSum = 0;
    let total = 0;
    for (let y = startY; y < endY; y += 1) {
        for (let x = startX; x < endX; x += 1) {
            const idx = (y * frame.width + x) * 4;
            const r = frame.data[idx] ?? 0;
            const g = frame.data[idx + 1] ?? 0;
            const b = frame.data[idx + 2] ?? 0;
            const gray = toGray(r, g, b);
            graySum += gray;
            graySqSum += gray * gray;
            total += 1;
            if (toSkinToneScore(r, g, b)) {
                skinCount += 1;
            }
            centerCount += 1;
        }
    }
    if (total === 0)
        return 0;
    const skinRatio = skinCount / centerCount;
    const grayMean = graySum / total;
    const variance = graySqSum / total - grayMean * grayMean;
    const contrastScore = clamp(Math.sqrt(Math.max(variance, 0)) / 45, 0, 1);
    let symmetryDiff = 0;
    const halfWidth = Math.max(1, Math.floor((endX - startX) / 2));
    let symmetrySamples = 0;
    for (let y = startY; y < endY; y += 2) {
        for (let x = 0; x < halfWidth; x += 2) {
            const leftIdx = (y * frame.width + startX + x) * 4;
            const rightIdx = (y * frame.width + endX - 1 - x) * 4;
            const leftGray = toGray(frame.data[leftIdx] ?? 0, frame.data[leftIdx + 1] ?? 0, frame.data[leftIdx + 2] ?? 0);
            const rightGray = toGray(frame.data[rightIdx] ?? 0, frame.data[rightIdx + 1] ?? 0, frame.data[rightIdx + 2] ?? 0);
            symmetryDiff += Math.abs(leftGray - rightGray);
            symmetrySamples += 1;
        }
    }
    const symmetryScore = symmetrySamples > 0 ? 1 - clamp(symmetryDiff / (symmetrySamples * 70), 0, 1) : 0;
    const skinScore = clamp((skinRatio - 0.05) / 0.30, 0, 1);
    return clamp(skinScore * 0.5 + symmetryScore * 0.25 + contrastScore * 0.25, 0, 1);
}
function estimateLivenessScore(frames) {
    if (frames.length < 2) {
        return 0;
    }
    const first = frames[0];
    const second = frames[1];
    const gridWidth = 24;
    const gridHeight = 16;
    const cropScale = 0.7;
    const cropWidth = Math.max(8, Math.round(first.width * cropScale));
    const cropHeight = Math.max(8, Math.round(first.height * cropScale));
    const cropX = Math.max(0, Math.floor((first.width - cropWidth) / 2));
    const cropY = Math.max(0, Math.floor((first.height - cropHeight) / 2));
    let diff = 0;
    let sampleCount = 0;
    for (let y = 0; y < gridHeight; y += 1) {
        for (let x = 0; x < gridWidth; x += 1) {
            const sx = clamp(Math.round(cropX + ((x + 0.5) / gridWidth) * cropWidth), 0, first.width - 1);
            const sy = clamp(Math.round(cropY + ((y + 0.5) / gridHeight) * cropHeight), 0, first.height - 1);
            const leftIdx = (sy * first.width + sx) * 4;
            const rightIdx = (sy * second.width + sx) * 4;
            const leftGray = toGray(first.data[leftIdx] ?? 0, first.data[leftIdx + 1] ?? 0, first.data[leftIdx + 2] ?? 0);
            const rightGray = toGray(second.data[rightIdx] ?? 0, second.data[rightIdx + 1] ?? 0, second.data[rightIdx + 2] ?? 0);
            diff += Math.abs(leftGray - rightGray);
            sampleCount += 1;
        }
    }
    if (sampleCount === 0)
        return 0;
    return clamp(diff / (sampleCount * 32), 0, 1);
}
function buildAttendanceFaceTemplate(faceEnrollmentSamples) {
    if (!Array.isArray(faceEnrollmentSamples) || faceEnrollmentSamples.length === 0) {
        return null;
    }
    const embeddings = [];
    for (const sample of faceEnrollmentSamples) {
        const dataUrl = sample && typeof sample === 'object' ? sample.dataUrl : undefined;
        if (typeof dataUrl !== 'string' || !dataUrl.trim()) {
            continue;
        }
        const frame = decodeAttendanceFrame(dataUrl);
        embeddings.push(frameToEmbedding(frame));
    }
    if (embeddings.length === 0) {
        return null;
    }
    const template = new Array(embeddings[0].length).fill(0);
    for (const embedding of embeddings) {
        for (let i = 0; i < template.length; i += 1) {
            template[i] += embedding[i] ?? 0;
        }
    }
    for (let i = 0; i < template.length; i += 1) {
        template[i] /= embeddings.length;
    }
    const magnitude = Math.sqrt(template.reduce((sum, value) => sum + value * value, 0)) || 1;
    return template.map((value) => value / magnitude);
}
function hashAttendanceImage(frame) {
    return (0, crypto_1.createHash)('sha256').update(frame.buffer).digest('hex');
}
//# sourceMappingURL=attendance-face.util.js.map