export interface AttendanceFrame {
    buffer: Buffer;
    width: number;
    height: number;
    data: Uint8Array;
}
export declare function parseAttendanceImage(input: string): Buffer;
export declare function decodeAttendanceFrame(input: string): AttendanceFrame;
export declare function frameToEmbedding(frame: AttendanceFrame): number[];
export declare function cosineSimilarity(left: number[], right: number[]): number;
export declare function detectFacePresence(frame: AttendanceFrame): number;
export declare function estimateLivenessScore(frames: AttendanceFrame[]): number;
export declare function buildAttendanceFaceTemplate(faceEnrollmentSamples: unknown): number[] | null;
export declare function hashAttendanceImage(frame: AttendanceFrame): string;
