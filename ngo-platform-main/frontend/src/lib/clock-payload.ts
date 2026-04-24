/**
 * Build clock-in/out body. Browsers may omit or return 0 for coords.accuracy — that breaks
 * class-validator (@IsNumber) or yields a tiny geofence buffer and false "outside zone" failures.
 */
export type AttendanceFaceCapture = {
    image: string;
    imageSequence: string[];
};

export async function captureAttendanceFaceSequence(): Promise<AttendanceFaceCapture> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is required for attendance verification.');
    }

    const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
    });

    const video = document.createElement('video');
    video.playsInline = true;
    video.muted = true;
    video.srcObject = stream;
    await video.play();
    await new Promise<void>((resolve) => {
        if (video.readyState >= 2) {
            resolve();
            return;
        }
        video.onloadedmetadata = () => resolve();
    });

    const canvas = document.createElement('canvas');
    const captureFrame = (): string => {
        const width = video.videoWidth || 720;
        const height = video.videoHeight || 720;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not access camera canvas.');
        }
        ctx.drawImage(video, 0, 0, width, height);
        return canvas.toDataURL('image/jpeg', 0.72);
    };

    try {
        const first = captureFrame();
        await new Promise((resolve) => window.setTimeout(resolve, 180));
        const second = captureFrame();
        return {
            image: first,
            imageSequence: [first, second],
        };
    } finally {
        stream.getTracks().forEach((track) => track.stop());
    }
}

export function buildAttendanceClockPayload(
    taskId: string,
    position: GeolocationPosition,
    deviceId: string,
    uniqueRequestId: string,
    faceCapture?: AttendanceFaceCapture,
): {
    taskId: string;
    lat: number;
    lng: number;
    accuracyMeters: number;
    uniqueRequestId: string;
    deviceId: string;
    image?: string;
    imageSequence?: string[];
} {
    const acc = position.coords.accuracy;
    const accuracyMeters =
        typeof acc === 'number' && Number.isFinite(acc) && acc >= 0
            ? Math.min(400, Math.max(25, acc))
            : 45;

    return {
        taskId,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracyMeters,
        uniqueRequestId,
        deviceId,
        image: faceCapture?.image,
        imageSequence: faceCapture?.imageSequence,
    };
}
