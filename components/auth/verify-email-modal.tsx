'use client';

import { useState, useEffect } from 'react';
import { Mail, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';

interface VerifyEmailModalProps {
    email: string;
    onVerified: () => void;
    onCancel?: () => void;
}

export function VerifyEmailModal({ email, onVerified, onCancel }: VerifyEmailModalProps) {
    const [otp, setOtp] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Countdown timer for resend
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleVerify = async (code: string) => {
        if (code.length !== 6) return;

        setIsVerifying(true);
        setError('');

        try {
            const res = await fetch('/api/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    onVerified();
                }, 1500);
            } else {
                setError(data.error || 'Invalid code');
                setOtp('');
            }
        } catch (err) {
            setError('Failed to verify code');
            setOtp('');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;

        setError('');
        setResendCooldown(60);

        try {
            const res = await fetch('/api/send-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Failed to resend code');
                setResendCooldown(0);
            }
        } catch (err) {
            setError('Failed to resend code');
            setResendCooldown(0);
        }
    };

    // Auto-submit when 6 digits are entered
    useEffect(() => {
        if (otp.length === 6 && !isVerifying) {
            handleVerify(otp);
        }
    }, [otp]);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="w-full max-w-md relative">
                <div className="glass-morphism border border-white/20 rounded-[2.5rem] p-10 shadow-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16" />

                    <div className="relative z-10 space-y-8">
                        {/* Header */}
                        <div className="text-center space-y-4">
                            <div
                                className={`inline-flex h-16 w-16 items-center justify-center rounded-3xl mb-2 transition-all duration-500 ${success
                                        ? 'bg-green-500/20 text-green-500'
                                        : 'bg-primary/10 text-primary'
                                    }`}
                            >
                                {success ? (
                                    <CheckCircle className="h-8 w-8" />
                                ) : (
                                    <Mail className="h-8 w-8" />
                                )}
                            </div>
                            <h2 className="text-3xl font-black tracking-tighter text-white">
                                {success ? 'Email Verified!' : 'Verify Your Email'}
                            </h2>
                            <p className="text-sm text-white/60 font-medium">
                                {success
                                    ? 'Your account is now active'
                                    : `We sent a 6-digit code to ${email}`}
                            </p>
                        </div>

                        {!success && (
                            <>
                                {/* OTP Input */}
                                <div className="flex justify-center">
                                    <InputOTP
                                        maxLength={6}
                                        value={otp}
                                        onChange={setOtp}
                                        disabled={isVerifying}
                                    >
                                        <InputOTPGroup>
                                            {[0, 1, 2, 3, 4, 5].map((index) => (
                                                <InputOTPSlot
                                                    key={index}
                                                    index={index}
                                                    className="glass-morphism border-white/20 text-white text-2xl font-black w-12 h-14 rounded-xl"
                                                />
                                            ))}
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>

                                {/* Status Messages */}
                                {isVerifying && (
                                    <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
                                        <Loader2 className="size-4 animate-spin" />
                                        <span className="font-medium">Verifying...</span>
                                    </div>
                                )}

                                {error && (
                                    <div className="flex items-center justify-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                                        <XCircle className="size-4 shrink-0" />
                                        <span className="font-medium">{error}</span>
                                    </div>
                                )}

                                {/* Resend Button */}
                                <div className="text-center space-y-3">
                                    <button
                                        onClick={handleResend}
                                        disabled={resendCooldown > 0}
                                        className="text-sm font-bold text-primary hover:text-primary/80 disabled:text-white/30 disabled:cursor-not-allowed transition-colors flex items-center gap-2 mx-auto uppercase tracking-widest"
                                    >
                                        <RefreshCw className="size-3" />
                                        {resendCooldown > 0
                                            ? `Resend in ${resendCooldown}s`
                                            : 'Resend Code'}
                                    </button>

                                    {onCancel && (
                                        <button
                                            onClick={onCancel}
                                            className="text-xs text-white/40 hover:text-white/60 transition-colors font-medium"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </>
                        )}

                        {success && (
                            <div className="text-center">
                                <p className="text-sm text-white/60 font-medium">
                                    Redirecting to your dashboard...
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
