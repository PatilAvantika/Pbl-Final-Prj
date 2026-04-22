export declare class ClockInDto {
    taskId: string;
    lat: number;
    lng: number;
    accuracyMeters: number;
    uniqueRequestId: string;
    deviceId: string;
    type?: 'CLOCK_IN' | 'CLOCK_OUT';
    image?: string;
    imageSequence?: string[];
    imageHash?: string;
    imageUrl?: string;
}
