/**
 * Build clock-in/out body. Browsers may omit or return 0 for coords.accuracy — that breaks
 * class-validator (@IsNumber) or yields a tiny geofence buffer and false "outside zone" failures.
 */
export function buildAttendanceClockPayload(
    taskId: string,
    position: GeolocationPosition,
    deviceId: string,
    uniqueRequestId: string,
): {
    taskId: string;
    lat: number;
    lng: number;
    accuracyMeters: number;
    uniqueRequestId: string;
    deviceId: string;
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
    };
}
