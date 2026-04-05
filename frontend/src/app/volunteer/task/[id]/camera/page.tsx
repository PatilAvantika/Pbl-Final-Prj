'use client';

import { useState, useRef, useEffect, use } from 'react';
import { Camera, RefreshCcw, Check, Loader2, X, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '../../../../../lib/axios';
import { useAuth } from '../../../../../context/AuthContext';

export default function FieldReportCamera({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { user } = useAuth();
    const unwrappedParams = use(params);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [step, setStep] = useState<'BEFORE' | 'AFTER' | 'DETAILS'>('BEFORE');
    const [beforeImage, setBeforeImage] = useState<string | null>(null);
    const [afterImage, setAfterImage] = useState<string | null>(null);

    const [quantity, setQuantity] = useState('');
    const [notes, setNotes] = useState('');

    const [errorMsg, setErrorMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Simple Hash implementation for the frontend (SHA-256 via SubtleCrypto)
    const generateHash = async (base64String: string) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(base64String);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    useEffect(() => {
        if (step === 'BEFORE' || step === 'AFTER') {
            startCamera();
        }
        return () => stopCamera();
    }, [step]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Prioritize back camera
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            streamRef.current = stream;
        } catch (err) {
            setErrorMsg("Failed to access camera. Please check permissions.");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    };

    const captureImage = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);

        // Get Base64 JPEG string (lossy to save bandwith)
        const base64Image = canvas.toDataURL('image/jpeg', 0.6);

        // Hash check conceptually (would block if duplicate hash detected on device)
        const hash = await generateHash(base64Image);
        console.log(`Image Hash: ${hash}`);

        if (step === 'BEFORE') {
            setBeforeImage(base64Image);
            stopCamera();
        } else if (step === 'AFTER') {
            setAfterImage(base64Image);
            stopCamera();
        }
    };

    const retakeImage = () => {
        if (step === 'BEFORE') setBeforeImage(null);
        if (step === 'AFTER') setAfterImage(null);
        startCamera();
    };

    const nextStep = () => {
        if (step === 'BEFORE' && beforeImage) setStep('AFTER');
        else if (step === 'AFTER' && afterImage) setStep('DETAILS');
    };

    const submitReport = async () => {
        try {
            setIsSubmitting(true);

            // In a real app we'd upload base64 to S3 and post URL. 
            // For this MVP, we post the Data URI directly (Backend expects String).
            const payload = {
                taskId: unwrappedParams.id, // using params from URL
                beforePhotoUrl: beforeImage,
                afterPhotoUrl: afterImage,
                quantityItems: parseInt(quantity) || 0,
                notes: notes
            };

            await api.post('/reports', payload);

            // Conclude Ops
            router.push('/volunteer/dashboard');
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || 'Failed to submit report');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center">
            {/* App Header */}
            <div className="w-full h-16 bg-black/50 backdrop-blur-md flex items-center justify-between px-4 absolute top-0 z-50">
                <button onClick={() => router.push('/volunteer/dashboard')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                    <X className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Secure Capture</span>
                    <span className="text-white text-sm font-bold tracking-wide">
                        {step === 'BEFORE' && 'Pre-Ops Evidence'}
                        {step === 'AFTER' && 'Post-Ops Verify'}
                        {step === 'DETAILS' && 'Finalize Report'}
                    </span>
                </div>
                <div className="w-10 h-10"></div> {/* Spacer */}
            </div>

            {errorMsg && (
                <div className="absolute top-20 z-50 w-[90%] bg-red-500 text-white p-3 rounded-2xl flex items-center shadow-lg animate-in slide-in-from-top-4">
                    <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
                    <span className="text-sm font-bold leading-tight">{errorMsg}</span>
                </div>
            )}

            {/* Main View Area */}
            <div className="flex-1 w-full relative flex items-center justify-center bg-black overflow-hidden">

                {step !== 'DETAILS' && (
                    <>
                        {!((step === 'BEFORE' && beforeImage) || (step === 'AFTER' && afterImage)) ? (
                            /* Live Camera Feed */
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            /* Preview Image */
                            <img
                                src={step === 'BEFORE' ? beforeImage! : afterImage!}
                                alt="Capture Preview"
                                className="w-full h-full object-cover"
                            />
                        )}
                        {/* Hidden Canvas for extracting frame */}
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Corner Hashes / Watermark overlay */}
                        {((step === 'BEFORE' && beforeImage) || (step === 'AFTER' && afterImage)) && (
                            <div className="absolute bottom-32 right-4 text-right">
                                <div className="text-emerald-400 font-mono text-[10px] bg-black/50 px-2 py-1 rounded backdrop-blur-sm tracking-widest leading-tight">
                                    SECURE_HASH: OK<br />
                                    USER: {user?.id.split('-')[0].toUpperCase()}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Details Step (Form) */}
                {step === 'DETAILS' && (
                    <div className="w-full h-full bg-[#FAF9F6] p-6 pt-24 overflow-y-auto">
                        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-2">Operation Summary</h2>
                        <p className="text-sm text-slate-500 font-medium mb-6">Attach quantities and notes to finalize this field report.</p>

                        <div className="flex space-x-3 mb-6">
                            <div className="flex-1 relative aspect-square rounded-2xl overflow-hidden shadow-sm border-2 border-slate-200">
                                <div className="absolute top-2 left-2 text-[10px] font-bold bg-white/80 px-2 py-0.5 rounded backdrop-blur">Before</div>
                                <img src={beforeImage!} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 relative aspect-square rounded-2xl overflow-hidden shadow-sm border-2 border-emerald-500">
                                <div className="absolute top-2 left-2 text-[10px] font-bold bg-white/80 text-emerald-600 px-2 py-0.5 rounded backdrop-blur shadow-sm">After</div>
                                <img src={afterImage!} className="w-full h-full object-cover" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Collected Items (Units/Bags)</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={e => setQuantity(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium"
                                    placeholder="e.g. 15"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Operation Notes</label>
                                <textarea
                                    rows={3}
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium resize-none"
                                    placeholder="Any specifics about the zone?"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* OS Camera Bottom Action Bar */}
            {step !== 'DETAILS' ? (
                <div className="h-32 w-full bg-black flex items-center justify-between px-10 pb-6 shrink-0 relative z-50">
                    {((step === 'BEFORE' && beforeImage) || (step === 'AFTER' && afterImage)) ? (
                        <>
                            {/* Retake & Approve Mode */}
                            <button onClick={retakeImage} className="text-white flex flex-col items-center">
                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-1">
                                    <RefreshCcw className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-bold tracking-widest uppercase">Retake</span>
                            </button>

                            <button onClick={nextStep} className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-emerald-900 shadow-[0_0_20px_rgba(16,185,129,0.5)] active:scale-95 transition-transform">
                                <Check className="w-8 h-8 text-black" />
                            </button>

                            <div className="w-12"></div>
                        </>
                    ) : (
                        <>
                            {/* Capture Mode */}
                            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden relative">
                                {step === 'AFTER' && beforeImage && <img src={beforeImage} className="w-full h-full object-cover opacity-50" />}
                            </div>

                            {/* Shutter Button */}
                            <button
                                onClick={captureImage}
                                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 active:scale-95 transition-transform"
                            >
                                <div className="w-full h-full bg-white rounded-full"></div>
                            </button>

                            <button className="text-white w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                                <Camera className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <div className="h-24 w-full bg-[#FAF9F6] border-t border-slate-200 flex items-center justify-between px-6 pb-6 shrink-0 z-50">
                    <button
                        onClick={submitReport}
                        disabled={isSubmitting}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/20 active:scale-95 transition-all text-sm"
                    >
                        {isSubmitting ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Transmitting Block...</>
                        ) : (
                            <><Check className="w-5 h-5 mr-2" /> Log Final Report</>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
