import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Scissors, Mail, Building2, Phone, CheckCircle2, 
    ArrowRight, Lock, Sparkles, Loader2, AlertCircle, ExternalLink, ShieldCheck
} from 'lucide-react';
import { auth } from '@/api/base44Client';

export default function TrialModal({ isOpen, onClose, initialBarbershopName = '' }) {
    const navigate = useNavigate();

    const [barbershopName, setBarbershopName] = useState(initialBarbershopName);
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successData, setSuccessData] = useState(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!barbershopName.trim() || barbershopName.trim().length < 2) {
                throw new Error('Enter your barbershop name (minimum 2 characters).');
            }
            if (!email.trim() || !email.includes('@')) {
                throw new Error('Enter a valid email to receive your access details.');
            }

            const response = await auth.registerTrial({
                barbershopName: barbershopName.trim(),
                email: email.trim().toLowerCase(),
                phone: phone.trim() || undefined
            });

            setSuccessData(response);
        } catch (err) {
            setError(err.message || 'Error creating free trial. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoToLogin = () => {
        onClose();
        navigate(`/admin/login?email=${encodeURIComponent(email)}`);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/80 backdrop-blur-md"
                />

                {/* Modal Window */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="relative w-full max-w-lg bg-[#0f121a] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/90 overflow-hidden z-10"
                >
                    {/* Background glow */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors border border-white/5"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {!successData ? (
                        /* ── FORM STATE ── */
                        <div>
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
                                    <Scissors className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full mb-1">
                                        <Sparkles className="w-3 h-3" /> 100% Free Trial (4 Days)
                                    </span>
                                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                                        Create Barbershop Access
                                    </h3>
                                </div>
                            </div>

                            <p className="text-xs sm:text-sm text-gray-400 mb-6 leading-relaxed">
                                Enter your barbershop name and your email. We'll create your account and send the <strong>temporary access password</strong> straight to your email.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Barbershop Name */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                                        Barbershop Name *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Building2 className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={barbershopName}
                                            onChange={(e) => setBarbershopName(e.target.value)}
                                            placeholder="e.g. Style & Cut Barbershop"
                                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* E-mail */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                                        Your Best Email *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="e.g. youremail@gmail.com"
                                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                        />
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-1">
                                        We'll send your login and password to this email.
                                    </p>
                                </div>

                                {/* WhatsApp (Optional) */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                                        WhatsApp / Mobile <span className="text-gray-400 font-normal">(Optional)</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="text"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="e.g. (11) 98765-4321"
                                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Security Badge */}
                                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-950/40 border border-blue-500/20 text-xs text-blue-200">
                                    <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <span>
                                        <strong>Secure First Access:</strong> For security, on your first login you'll be required to replace the temporary password with a new password of your own.
                                    </span>
                                </div>

                                {/* Error message */}
                                {error && (
                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/50 border border-red-500/30 text-red-200 text-xs">
                                        <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-xl shadow-primary/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Creating barbershop and sending email...
                                        </>
                                    ) : (
                                        <>
                                            <span>Get Access by Email</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    ) : (
                        /* ── SUCCESS STATE ── */
                        <div className="text-center py-2">
                            <div className="w-16 h-16 rounded-3xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/10">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>

                            <h3 className="text-2xl font-extrabold text-white tracking-tight mb-2">
                                Barbershop Registered! 🎉
                            </h3>

                            <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                                We've sent your login details and temporary password to:
                                <br />
                                <strong className="text-primary font-mono">{successData.email}</strong>
                            </p>

                            {/* Credentials Card Summary */}
                            <div className="bg-black/50 border border-white/10 rounded-2xl p-4 text-left space-y-3 mb-6">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400">Barbershop:</span>
                                    <span className="text-white font-bold">{successData.barbershopName}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400">Public Link:</span>
                                    <span className="text-primary font-mono text-[11px]">controlbarber.online/{successData.slug}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400">Free Period:</span>
                                    <span className="text-green-400 font-semibold">4 days unlocked</span>
                                </div>
                                <div className="pt-2.5 border-t border-white/5 flex items-center gap-2 text-xs text-blue-300">
                                    <Mail className="w-4 h-4 text-primary shrink-0" />
                                    <span>Your <strong>temporary password</strong> has been sent to your inbox.</span>
                                </div>
                            </div>

                            {/* First access notice */}
                            <div className="p-3 bg-yellow-950/30 border border-yellow-500/20 rounded-xl text-yellow-200/90 text-xs text-left mb-6 flex items-start gap-2">
                                <Lock className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                                <span>
                                    <strong>Important:</strong> Open your email, copy the temporary password and sign in. On your first login, you'll create your <strong>new permanent password</strong>.
                                </span>
                            </div>

                            <button
                                onClick={handleGoToLogin}
                                className="w-full py-3.5 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-xl shadow-primary/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                            >
                                <span>Go to Barbershop Login</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
