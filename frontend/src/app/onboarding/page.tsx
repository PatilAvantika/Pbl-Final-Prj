'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    AlertCircle,
    Camera,
    Check,
    ChevronRight,
    Loader2,
    RefreshCcw,
    UserCircle,
} from 'lucide-react';
import api from '../../lib/api/client';
import { getApiErrorMessage } from '../../lib/api-errors';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import { needsVolunteerOnboarding } from '../../lib/onboarding';

type Angle = 'front' | 'left' | 'right';

const WELCOME_SEEN_KEY = 'ngo_onb_welcome';

const ANGLE_ORDER: Angle[] = ['front', 'left', 'right'];

/** Keeps JPEG data URLs under API limits and speeds upload (full camera frames are huge). */
function downscaleJpegDataUrl(dataUrl: string, maxEdge: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            resolve(dataUrl);
            return;
        }
        const img = new window.Image();
        img.onload = () => {
            let w = img.naturalWidth || img.width;
            let h = img.naturalHeight || img.height;
            if (w < 1 || h < 1) {
                resolve(dataUrl);
                return;
            }
            const scale = Math.min(1, maxEdge / Math.max(w, h));
            w = Math.max(1, Math.round(w * scale));
            h = Math.max(1, Math.round(h * scale));
            const c = document.createElement('canvas');
            c.width = w;
            c.height = h;
            const ctx = c.getContext('2d');
            if (!ctx) {
                resolve(dataUrl);
                return;
            }
            ctx.drawImage(img, 0, 0, w, h);
            resolve(c.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('Could not process capture image'));
        img.src = dataUrl;
    });
}

const ANGLE_HINTS: Record<Angle, { title: string; hint: string }> = {
    front: { title: 'Face forward', hint: 'Center your face in the frame and hold still.' },
    left: { title: 'Turn slightly left', hint: 'Show your left cheek toward the camera — like a passport angle.' },
    right: { title: 'Turn slightly right', hint: 'Show your right cheek toward the camera.' },
};

export default function OnboardingPage() {
    return (
        <ProtectedRoute allowedRoles={['VOLUNTEER']}>
            <OnboardingWizard />
        </ProtectedRoute>
    );
}

function OnboardingWizard() {
    const router = useRouter();
    const { user, refreshUser } = useAuth();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const [profile, setProfile] = useState({
        firstName: user?.firstName ?? '',
        lastName: user?.lastName ?? '',
        phone: user?.phone ?? '',
        department: user?.department ?? '',
        emergencyContactName: user?.emergencyContactName ?? '',
        emergencyContactPhone: user?.emergencyContactPhone ?? '',
    });

    useEffect(() => {
        if (!user) return;
        if (!needsVolunteerOnboarding(user)) {
            router.replace('/volunteer/dashboard');
            return;
        }
        if (!user.onboardingProfileComplete) {
            const seen =
                typeof window !== 'undefined' && sessionStorage.getItem(WELCOME_SEEN_KEY) === '1';
            setStep(seen ? 2 : 1);
        } else {
            setStep(3);
        }
    }, [user, router]);

    const submitProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
            await api.put('/onboarding/profile', profile);
            await refreshUser();
            setStep(3);
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
            setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Could not save profile');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-slate-100 pb-8">
            <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-slate-800 px-4 py-4">
                <div className="max-w-lg mx-auto flex flex-col items-center gap-1">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                        <span className="text-xl" aria-hidden>
                            🔍
                        </span>
                        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-500">
                            Attendance &amp; Authenticity
                        </h1>
                    </div>
                    <StepDots step={step} />
                </div>
            </header>

            <div className="max-w-lg mx-auto px-4 pt-6">
                {error && (
                    <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-950/80 border border-red-800/80 px-3 py-2 text-sm text-red-100">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {step === 1 && (
                    <WelcomeStep
                        onContinue={() => {
                            try {
                                sessionStorage.setItem(WELCOME_SEEN_KEY, '1');
                            } catch {
                                /* ignore */
                            }
                            setStep(2);
                        }}
                    />
                )}

                {step === 2 && (
                    <section>
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-widest mb-2">
                            <UserCircle className="w-4 h-4" />
                            Step 2 — Profile
                        </div>
                        <p className="text-slate-400 text-sm mb-6">
                            We need your contact details and department before field attendance.
                        </p>
                        <form onSubmit={submitProfile} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Field
                                    label="First name"
                                    value={profile.firstName}
                                    onChange={(v) => setProfile((p) => ({ ...p, firstName: v }))}
                                    required
                                />
                                <Field
                                    label="Last name"
                                    value={profile.lastName}
                                    onChange={(v) => setProfile((p) => ({ ...p, lastName: v }))}
                                    required
                                />
                            </div>
                            <Field
                                label="Phone"
                                value={profile.phone}
                                onChange={(v) => setProfile((p) => ({ ...p, phone: v }))}
                                required
                                inputMode="tel"
                            />
                            <Field
                                label="Department / team"
                                value={profile.department}
                                onChange={(v) => setProfile((p) => ({ ...p, department: v }))}
                                required
                            />
                            <Field
                                label="Emergency contact name"
                                value={profile.emergencyContactName}
                                onChange={(v) => setProfile((p) => ({ ...p, emergencyContactName: v }))}
                                required
                            />
                            <Field
                                label="Emergency contact phone"
                                value={profile.emergencyContactPhone}
                                onChange={(v) => setProfile((p) => ({ ...p, emergencyContactPhone: v }))}
                                required
                                inputMode="tel"
                            />
                            <button
                                type="submit"
                                disabled={busy}
                                className="w-full mt-2 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3.5 rounded-xl transition-colors disabled:opacity-60"
                            >
                                {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                                Continue to face registration
                            </button>
                        </form>
                    </section>
                )}

                {step === 3 && (
                    <FaceRegistrationStep
                        busy={busy}
                        setBusy={setBusy}
                        setError={setError}
                        onDone={async () => {
                            try {
                                sessionStorage.removeItem(WELCOME_SEEN_KEY);
                            } catch {
                                /* ignore */
                            }
                            await refreshUser();
                            router.replace('/volunteer/dashboard');
                        }}
                    />
                )}


            </div>
        </div>
    );
}

function WelcomeStep({ onContinue }: { onContinue: () => void }) {
    return (
        <section>
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-widest mb-2">
                <UserCircle className="w-4 h-4" />
                Step 1 — Get started
            </div>
            <p className="text-slate-200 text-lg font-semibold mb-2">Welcome to field attendance setup</p>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                In the next steps you&apos;ll add your profile and register your face from three angles (for secure
                check-ins on tasks).
            </p>
            <ul className="text-sm text-slate-400 space-y-2 mb-8 list-disc pl-5">
                <li>Profile &amp; emergency contacts</li>
                <li>Face enrollment (front, left, right)</li>
            </ul>
            <button
                type="button"
                onClick={onContinue}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3.5 rounded-xl transition-colors"
            >
                <ChevronRight className="w-5 h-5" />
                Continue to profile
            </button>
        </section>
    );
}

function StepDots({ step }: { step: number }) {
    return (
        <div className="flex gap-2 mt-2">
            {[1, 2, 3].map((n) => (
                <span
                    key={n}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                        n <= step ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}
                />
            ))}
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
    required,
    inputMode,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    required?: boolean;
    inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 pl-0.5">{label}</label>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                inputMode={inputMode}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
        </div>
    );
}

function FaceRegistrationStep({
    busy,
    setBusy,
    setError,
    onDone,
}: {
    busy: boolean;
    setBusy: (v: boolean) => void;
    setError: (v: string) => void;
    onDone: () => Promise<void>;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [angleIndex, setAngleIndex] = useState(0);
    const [captures, setCaptures] = useState<Partial<Record<Angle, string>>>({});
    const [preview, setPreview] = useState<string | null>(null);

    const currentAngle = ANGLE_ORDER[angleIndex];

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
    }, []);

    const startCamera = useCallback(async () => {
        try {
            stopCamera();
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch {
            setError('Camera access is required for face registration.');
        }
    }, [stopCamera, setError]);

    useEffect(() => {
        if (!preview) startCamera();
        return () => stopCamera();
    }, [preview, startCamera, stopCamera]);

    const snap = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.55);
        stopCamera();
        setPreview(dataUrl);
    };

    const retake = () => {
        setPreview(null);
    };

    const confirmAngle = () => {
        if (!preview) return;
        setCaptures((c) => ({ ...c, [currentAngle]: preview }));
        setPreview(null);
        if (angleIndex < ANGLE_ORDER.length - 1) {
            setAngleIndex((i) => i + 1);
        }
    };

    const submitAll = async () => {
        const raw = ANGLE_ORDER.map((angle) => ({ angle, dataUrl: captures[angle] }));
        if (raw.some((s) => !s.dataUrl)) {
            setError('Capture front, left, and right angles.');
            return;
        }
        setError('');
        setBusy(true);
        try {
            const samples = await Promise.all(
                raw.map(async ({ angle, dataUrl }) => ({
                    angle,
                    dataUrl: await downscaleJpegDataUrl(dataUrl!, 720, 0.5),
                })),
            );
            await api.put('/onboarding/face-samples', { samples }, { timeout: 120_000 });
            await onDone();
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, 'Could not save face samples'));
        } finally {
            setBusy(false);
        }
    };

    const allCaptured = ANGLE_ORDER.every((a) => captures[a]);

    const hint = ANGLE_HINTS[currentAngle];

    return (
        <section>
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-widest mb-2">
                <Camera className="w-4 h-4" />
                Step 3 — Face registration
            </div>
            <p className="text-slate-400 text-sm mb-4">
                Capture three angles so later attendance checks can verify it&apos;s you.
            </p>

            <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 aspect-[3/4] relative mb-4">
                {!preview ? (
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                ) : (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover scale-x-[-1]" />
                )}
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                    <p className="text-white font-bold text-sm">{hint.title}</p>
                    <p className="text-slate-300 text-xs mt-0.5">{hint.hint}</p>
                </div>
            </div>

            <div className="flex gap-2 mb-4">
                {ANGLE_ORDER.map((a, i) => (
                    <div
                        key={a}
                        className={`flex-1 text-center py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide ${
                            captures[a]
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : i === angleIndex
                                  ? 'bg-slate-800 text-white border border-slate-600'
                                  : 'bg-slate-900 text-slate-500 border border-slate-800'
                        }`}
                    >
                        {a}
                    </div>
                ))}
            </div>

            {!allCaptured && (
                <div className="flex gap-3">
                    {!preview ? (
                        <>
                            <button
                                type="button"
                                onClick={snap}
                                className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-bold py-3 rounded-xl"
                            >
                                <Camera className="w-5 h-5" />
                                Capture
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={retake}
                                className="flex items-center justify-center gap-2 px-4 bg-slate-800 rounded-xl text-slate-200"
                            >
                                <RefreshCcw className="w-4 h-4" />
                                Retake
                            </button>
                            <button
                                type="button"
                                onClick={confirmAngle}
                                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-black font-bold py-3 rounded-xl"
                            >
                                <Check className="w-5 h-5" />
                                Use this ({currentAngle})
                            </button>
                        </>
                    )}
                </div>
            )}

            {allCaptured && (
                <button
                    type="button"
                    disabled={busy}
                    onClick={submitAll}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3.5 rounded-xl disabled:opacity-60"
                >
                    {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                    Save enrollment &amp; continue
                </button>
            )}
        </section>
    );
}

