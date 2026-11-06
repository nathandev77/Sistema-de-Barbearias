import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Check, Sparkles, Shield, Zap, QrCode, CreditCard, 
    ArrowRight, Clock, Building2, CheckCircle2, Copy, 
    ChevronRight, Loader2, Star, HelpCircle, ArrowLeft,
    Scissors, Users, TrendingUp, DollarSign, Smartphone,
    MessageSquare, AlertCircle, X, ChevronDown, Award,
    Wifi, Battery, Signal, Menu, Play, Laptop
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import TrialModal from '@/components/TrialModal';

const PLANS = [
    {
        id: 'monthly',
        name: 'Monthly Plan',
        price: '59,90',
        period: '/month',
        description: 'Ideal for independent barbers and barbershops that want to start organizing their management.',
        highlight: false,
        features: [
            'Unlimited 24-hour Bookings',
            'Custom Link with Your Barbershop Name',
            'Complete Financial Dashboard and Cash Closing',
            'Automatic Barber Commission Calculation',
            'Unlimited Client and Service Records',
            'Client Haircut History and Preferences',
            'WhatsApp Bot Integration',
            'Direct Technical Support'
        ]
    },
    {
        id: 'quarterly',
        name: 'Quarterly Plan',
        price: '149,90',
        period: '/quarter',
        badge: 'Most Popular 🔥',
        savings: 'Save 16%',
        description: 'The best choice for established barbershops seeking high productivity and stability.',
        highlight: true,
        features: [
            'Everything included in the Monthly Plan',
            'Real 16% savings on your subscription',
            'POS Module and Product Inventory Control',
            'Advanced Revenue and Average Ticket Reports',
            'Multiple Barber Management with Individual Access',
            'Real-time Automatic Cloud Backup',
            'Training and Quick System Setup',
            'Priority Support via WhatsApp'
        ]
    },
    {
        id: 'annual',
        name: 'VIP Annual Plan',
        price: '499,00',
        period: '/year',
        badge: '2 Months Free 🎁',
        savings: 'Equivalent to R$ 41,58/month',
        description: 'Maximum value for high-end barbershops that want to dominate their area.',
        highlight: false,
        features: [
            'Everything included in the Quarterly Plan',
            '2 Months 100% Free (Biggest savings on the market)',
            'Multiple professionals with detailed individual reports',
            'Zero Setup Fee and Configuration Consulting',
            'Best Practices Consulting for Barbershops',
            'Top Priority and Direct Channel to Management'
        ]
    }
];

const COMPARISON_ITEMS = [
    {
        feature: 'After-hours bookings',
        manual: 'Lose clients who message at night or early morning',
        system: 'Clients book on their own 24/7 through the barbershop link'
    },
    {
        feature: 'No-shows and Forgotten Appointments',
        manual: 'Barbers sit idle, losing revenue',
        system: 'Reminders and confirmations reduce no-shows by up to 80%'
    },
    {
        feature: 'Commission Calculation',
        manual: 'Hours adding up paper slips, prone to errors and disputes',
        system: '100% automatic per-barber report in 1 click'
    },
    {
        feature: 'Cash and Profit Control',
        manual: 'No idea how much you actually earned or spent in the month',
        system: 'Real-time charts of income, expenses and net profit'
    },
    {
        feature: 'Product Sales (POS)',
        manual: 'No inventory control and forgotten sales',
        system: 'Integrated POS with automatic inventory deduction'
    }
];

const FAQS = [
    {
        q: 'Do I need to register a credit card to use the 4 free days?',
        a: 'No! You can create your barbershop now and test 100% of the tools for 4 days without providing any payment details. You only subscribe if you like the system.'
    },
    {
        q: 'Do my clients need to download an app to book?',
        a: 'No! Your clients open a direct, ultra-fast link in their phone browser or WhatsApp (e.g. controlbarber.online/your-barbershop), choose the professional, service and date, and confirm in seconds.'
    },
    {
        q: 'How does payment work? Is access granted immediately?',
        a: 'Yes! When you pay by PIX or Credit Card, your system is unlocked and activated instantly and automatically.'
    },
    {
        q: 'Is there a lock-in contract or cancellation fee?',
        a: 'None! You are completely free to cancel or change your plan whenever you want, with no fees or hassle.'
    },
    {
        q: 'Can I use it on my phone, tablet and computer?',
        a: 'Yes! Barber Control works perfectly on any device (Android/iPhone, tablet, laptop or front-desk computer).'
    }
];

export default function PricingPlans() {
    const { adminUser } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [selectedPlan, setSelectedPlan] = useState(PLANS[1]);
    const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
    const [trialModalOpen, setTrialModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('pix');
    const [loading, setLoading] = useState(false);
    const [checkoutSuccess, setCheckoutSuccess] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Interactive Demo State in Smartphone Mockup
    const [demoBarber, setDemoBarber] = useState('Lucas Silva');
    const [demoService, setDemoService] = useState('Fade Haircut');
    const [demoPrice, setDemoPrice] = useState('R$ 45,00');
    const [demoTime, setDemoTime] = useState('15:00');
    const [demoBooked, setDemoBooked] = useState(false);

    // Interactive Calculator
    const [cutsPerDay, setCutsPerDay] = useState(15);
    const [avgCutPrice, setAvgCutPrice] = useState(40);

    // FAQ Accordion
    const [openFaqIndex, setOpenFaqIndex] = useState(null);

    // Checkout Data
    const [barbershopSlug, setBarbershopSlug] = useState(
        adminUser?.barbershop?.slug || searchParams.get('slug') || ''
    );
    const [cardData, setCardData] = useState({
        holderName: '',
        cardNumber: '',
        expiry: '',
        cvv: ''
    });

    const isExpiredNotice = searchParams.get('reason') === 'expired';

    // Calculator calculations
    const estimatedMonthlyRevenue = cutsPerDay * avgCutPrice * 24;
    const estimatedRecoveredFromNoShows = Math.round(cutsPerDay * 0.15 * avgCutPrice * 24);
    const estimatedProductUpsell = Math.round(cutsPerDay * 0.20 * 35 * 24);
    const totalExtraGain = estimatedRecoveredFromNoShows + estimatedProductUpsell;

    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan);
        setCheckoutSuccess(null);
        setErrorMsg('');
        setCheckoutModalOpen(true);
    };

    const handleProcessPayment = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';
            let tenantId = adminUser?.barbershop?.id;

            if (!tenantId) {
                if (!barbershopSlug.trim()) {
                    throw new Error('Please enter your barbershop link/slug to activate the system.');
                }
                const tRes = await fetch(`${API_URL}/auth/tenant/${barbershopSlug.trim().toLowerCase()}`);
                if (!tRes.ok) {
                    throw new Error('Barbershop not found. Check the link/slug you entered or create your account first.');
                }
                const tData = await tRes.json();
                tenantId = tData.id;
            }

            const response = await fetch(`${API_URL}/subscription/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId,
                    planId: selectedPlan.id,
                    paymentMethod,
                    ...(paymentMethod === 'credit_card' ? { cardDetails: cardData } : {})
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error processing payment.');
            }

            setCheckoutSuccess(result);
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('PIX code copied successfully!');
    };

    const scrollToSection = (id) => {
        setMobileMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-[#07080a] text-white selection:bg-primary selection:text-white font-sans antialiased overflow-x-hidden">
            {/* Top Announcement Bar */}
            <div className="bg-gradient-to-r from-blue-950 via-primary/30 to-blue-950 border-b border-primary/30 py-2 px-3 text-center text-[11px] sm:text-xs font-semibold text-blue-100 flex items-center justify-center gap-2">
                <span className="flex h-2 w-2 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span>🔥 <strong>Special Offer:</strong> Try Barber Control free for 4 days!</span>
                <button 
                    onClick={() => setTrialModalOpen(true)}
                    className="ml-1 underline text-primary-foreground font-bold hover:text-white transition-colors"
                >
                    Claim Offer →
                </button>
            </div>

            {/* Navbar */}
            <header className="border-b border-white/10 bg-black/70 backdrop-blur-2xl sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
                    <Link to="/admin/login" className="flex items-center gap-2.5 sm:gap-3 group">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform duration-200">
                            <Scissors className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-base sm:text-xl tracking-tight text-white block">Barber Control</span>
                            <span className="text-[9px] sm:text-[10px] text-primary font-semibold tracking-wider uppercase block -mt-1">Professional System</span>
                        </div>
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="hidden lg:flex items-center gap-7 text-xs font-semibold text-gray-300">
                        <button onClick={() => scrollToSection('diferenciais')} className="hover:text-white transition-colors">
                            Why Choose Us
                        </button>
                        <button onClick={() => scrollToSection('comparativo')} className="hover:text-white transition-colors">
                            Comparison
                        </button>
                        <button onClick={() => scrollToSection('calculadora')} className="hover:text-white transition-colors">
                            Profit Calculator
                        </button>
                        <button onClick={() => scrollToSection('plans-section')} className="text-primary hover:text-primary/90 font-bold transition-colors">
                            Plans and Pricing
                        </button>
                        <button onClick={() => scrollToSection('faq')} className="hover:text-white transition-colors">
                            FAQ
                        </button>
                    </div>

                    {/* Desktop Action Buttons */}
                    <div className="hidden sm:flex items-center gap-3">
                        <Link 
                            to="/admin/login"
                            className="px-3.5 py-2 text-xs font-semibold text-gray-300 hover:text-white transition-colors"
                        >
                            Sign In
                        </Link>
                        <button 
                            onClick={() => setTrialModalOpen(true)}
                            className="px-4 sm:px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl shadow-lg shadow-primary/25 transition-all transform hover:-translate-y-0.5"
                        >
                            Create Free Account (4d)
                        </button>
                    </div>

                    {/* Mobile Menu Toggle Button */}
                    <button 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white"
                        aria-label="Open Menu"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Mobile Dropdown Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="lg:hidden border-b border-white/10 bg-[#0c0d12]/95 backdrop-blur-xl px-4 py-6 space-y-4"
                        >
                            <div className="flex flex-col space-y-3 text-sm font-semibold">
                                <button onClick={() => scrollToSection('diferenciais')} className="text-left py-1 text-gray-300 hover:text-white">
                                    Why Choose Us
                                </button>
                                <button onClick={() => scrollToSection('comparativo')} className="text-left py-1 text-gray-300 hover:text-white">
                                    Comparison
                                </button>
                                <button onClick={() => scrollToSection('calculadora')} className="text-left py-1 text-gray-300 hover:text-white">
                                    Profit Calculator
                                </button>
                                <button onClick={() => scrollToSection('plans-section')} className="text-left py-1 text-primary font-bold">
                                    Plans and Pricing
                                </button>
                                <button onClick={() => scrollToSection('faq')} className="text-left py-1 text-gray-300 hover:text-white">
                                    Frequently Asked Questions
                                </button>
                            </div>
                            <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5">
                                <button 
                                    onClick={() => { setMobileMenuOpen(false); setTrialModalOpen(true); }}
                                    className="w-full py-3 text-center bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-lg"
                                >
                                    Create Free Account (4 Days)
                                </button>
                                <Link 
                                    to="/admin/login"
                                    className="w-full py-2.5 text-center text-xs text-gray-400 hover:text-white"
                                >
                                    Already registered / Sign In
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Main Content */}
            <main>
                {/* Expired Notice Banner (if redirected after 4 days trial) */}
                {isExpiredNotice && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 border-2 border-amber-500/40 rounded-2xl sm:rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 text-amber-200 shadow-xl"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-xl sm:text-2xl shrink-0">
                                    ⏳
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm sm:text-base text-amber-300">Your 4-day trial period has ended!</h4>
                                    <p className="text-xs text-amber-200/90 mt-0.5">
                                        Your data is 100% saved. Choose a plan below to reactivate your access instantly.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => scrollToSection('plans-section')}
                                className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 shrink-0 transition-all text-center"
                            >
                                View Plans to Reactivate →
                            </button>
                        </motion.div>
                    </div>
                )}

                {/* ── HERO SECTION WITH SMARTPHONE MOCKUP ── */}
                <section className="relative pt-8 sm:pt-16 lg:pt-20 pb-16 sm:pb-24 overflow-hidden">
                    {/* Glow Backgrounds */}
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] sm:w-[600px] h-[350px] bg-primary/15 blur-[120px] rounded-full pointer-events-none -z-10" />
                    <div className="absolute top-1/3 right-4 sm:right-10 w-[250px] sm:w-[350px] h-[350px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none -z-10" />

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                            
                            {/* Left Column: Value Prop & CTAs */}
                            <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left">
                                <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-[11px] sm:text-xs font-bold uppercase tracking-wider shadow-inner">
                                    <Sparkles className="w-3.5 h-3.5" /> Complete System for Barbershops
                                </div>

                                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12] bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
                                    Double Your Barbershop Bookings and <span className="text-primary">Eliminate the Chaos</span>
                                </h1>

                                <p className="text-muted-foreground text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                    Say goodbye to the paper notebook and lost WhatsApp messages. Get an exclusive link for your clients to book straight from their phones 24/7, commissions calculated instantly and full control of your cash flow.
                                </p>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
                                    <button
                                        onClick={() => setTrialModalOpen(true)}
                                        className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-2xl shadow-xl shadow-primary/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
                                    >
                                        <Zap className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                                        Start 4 Free Days Now
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>

                                    <Link
                                        to="/admin/login"
                                        className="w-full sm:w-auto px-6 py-4 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-sm rounded-2xl border border-white/10 transition-colors text-center"
                                    >
                                        Already a Customer / Sign In
                                    </Link>
                                </div>

                                {/* Trust Badges */}
                                <div className="pt-5 sm:pt-6 border-t border-white/10 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-gray-400">
                                    <div className="flex items-center gap-1.5 font-medium">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span>4 Free Days, No Card Required</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 font-medium">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span>Instant Activation (PIX/Card)</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 font-medium">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span>No Fees or Lock-in</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: SMARTPHONE MOCKUP (Works on Mobile and Desktop) */}
                            <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
                                
                                {/* Mockup Indicator Label */}
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-gray-300 mb-3 shadow-sm">
                                    <Smartphone className="w-3.5 h-3.5 text-primary" /> How your client books on their phone:
                                </div>

                                {/* SMARTPHONE FRAME MOCKUP */}
                                <div className="relative w-full max-w-[320px] sm:max-w-[340px] rounded-[44px] p-3.5 bg-gradient-to-b from-[#2a2d36] via-[#1a1c22] to-[#121317] border-[3px] border-[#383d47] shadow-[0_25px_70px_rgba(0,0,0,0.85)] ring-1 ring-white/10 mb-8 sm:mb-0">
                                    
                                    {/* Dynamic Island / Notch */}
                                    <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-30 flex items-center justify-between px-2.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-white/10"></div>
                                        <div className="w-2 h-2 rounded-full bg-blue-900/60"></div>
                                    </div>

                                    {/* Mobile Screen Container */}
                                    <div className="w-full bg-[#0d0e12] rounded-[34px] overflow-hidden text-left border border-white/5 relative z-20">
                                        
                                        {/* Status Bar */}
                                        <div className="pt-2 px-5 pb-1 flex items-center justify-between text-[10px] font-bold text-gray-400">
                                            <span>09:41</span>
                                            <div className="flex items-center gap-1.5 text-gray-400">
                                                <Signal className="w-3 h-3" />
                                                <Wifi className="w-3 h-3" />
                                                <Battery className="w-3.5 h-3.5" />
                                            </div>
                                        </div>

                                        {/* Mobile Browser URL Bar */}
                                        <div className="mx-3 mt-1 mb-2.5 px-3 py-1.5 bg-black/60 rounded-xl border border-white/10 flex items-center gap-1.5 text-[10px] text-gray-300">
                                            <span className="text-emerald-400 font-bold">🔒</span>
                                            <span className="truncate font-mono text-primary font-medium">controlbarber.online/your-barbershop</span>
                                        </div>

                                        {/* Screen Content - Interactive Booking Flow */}
                                        <div className="px-3.5 pt-1 pb-4 space-y-2.5 text-white text-xs">
                                            
                                            {/* Barbershop Header */}
                                            <div className="flex items-center justify-between bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center font-bold text-xs shadow-md">
                                                        ✂️
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-xs leading-none">Elite Barbershop</h4>
                                                        <span className="text-[10px] text-muted-foreground">Tap to try booking</span>
                                                    </div>
                                                </div>
                                                <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 text-[9px] font-bold rounded-md border border-emerald-500/20">
                                                    ● Open
                                                </span>
                                            </div>

                                            {/* Step 1: Barber */}
                                            <div>
                                                <label className="text-[9px] uppercase font-bold text-gray-400 tracking-wider block mb-1">
                                                    1. Select the Barber
                                                </label>
                                                <div className="grid grid-cols-2 gap-1.5">
                                                    {['Lucas Silva', 'Rafael Santos'].map((b) => (
                                                        <button
                                                            key={b}
                                                            type="button"
                                                            onClick={() => setDemoBarber(b)}
                                                            className={`p-1.5 rounded-lg text-[11px] font-medium border flex items-center gap-1.5 transition-all ${
                                                                demoBarber === b 
                                                                    ? 'bg-primary/20 border-primary text-white font-bold' 
                                                                    : 'bg-black/40 border-white/5 text-gray-400 hover:text-white'
                                                            }`}
                                                        >
                                                            <div className="w-4 h-4 rounded-full bg-primary/40 flex items-center justify-center text-[8px] text-white">
                                                                ✂️
                                                            </div>
                                                            <span className="truncate">{b}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Step 2: Service */}
                                            <div>
                                                <label className="text-[9px] uppercase font-bold text-gray-400 tracking-wider block mb-1">
                                                    2. Select the Service
                                                </label>
                                                <div className="grid grid-cols-2 gap-1.5">
                                                    {[
                                                        { name: 'Fade Haircut', price: 'R$ 45,00' },
                                                        { name: 'Beard & Hot Towel', price: 'R$ 35,00' }
                                                    ].map((s) => (
                                                        <button
                                                            key={s.name}
                                                            type="button"
                                                            onClick={() => { setDemoService(s.name); setDemoPrice(s.price); }}
                                                            className={`p-2 rounded-lg text-[10px] border text-left flex flex-col justify-between transition-all ${
                                                                demoService === s.name 
                                                                    ? 'bg-primary/20 border-primary text-white' 
                                                                    : 'bg-black/40 border-white/5 text-gray-400 hover:text-white'
                                                            }`}
                                                        >
                                                            <span className="font-semibold leading-tight">{s.name}</span>
                                                            <span className="text-primary font-bold text-[10px] mt-0.5">{s.price}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Step 3: Time */}
                                            <div>
                                                <label className="text-[9px] uppercase font-bold text-gray-400 tracking-wider block mb-1">
                                                    3. Available Times Today
                                                </label>
                                                <div className="grid grid-cols-3 gap-1">
                                                    {['14:30', '15:00', '16:15'].map((time) => (
                                                        <button
                                                            key={time}
                                                            type="button"
                                                            onClick={() => { setDemoTime(time); setDemoBooked(false); }}
                                                            className={`py-1 rounded-md text-[10px] font-bold border transition-all ${
                                                                demoTime === time 
                                                                    ? 'bg-primary border-primary text-primary-foreground shadow-sm' 
                                                                    : 'bg-black/40 border-white/5 text-gray-300 hover:text-white'
                                                            }`}
                                                        >
                                                            {time}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Confirm Button */}
                                            <button
                                                type="button"
                                                onClick={() => setDemoBooked(true)}
                                                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1 mt-1 cursor-pointer"
                                            >
                                                {demoBooked ? '✓ Booked in the System!' : 'Confirm Booking'}
                                            </button>

                                            {/* Instant Simulated Toast */}
                                            {demoBooked && (
                                                <motion.div 
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="p-2 bg-primary/25 border border-primary/40 rounded-xl text-[10px] text-white flex items-center gap-2"
                                                >
                                                    <span>🔔</span>
                                                    <div>
                                                        <strong>Booking Confirmed!</strong><br />
                                                        {demoBarber} • {demoService} ({demoTime})
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* Home Indicator Bar */}
                                            <div className="w-24 h-1 bg-white/20 rounded-full mx-auto mt-2"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Stat Badge - Positioned so it does not overlap buttons */}
                                <div className="mt-2 sm:mt-0 sm:absolute sm:-bottom-8 sm:-left-6 lg:-left-12 z-30 bg-[#0d0e13]/95 backdrop-blur-2xl border border-emerald-500/30 p-3 sm:p-3.5 rounded-2xl shadow-2xl shadow-black/90 flex items-center gap-3 w-fit max-w-[92vw] whitespace-nowrap">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 shadow-inner">
                                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs sm:text-sm font-extrabold text-white leading-tight">+35% Revenue</p>
                                        <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium">by preventing no-shows and forgotten appointments</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* ── 4 PILLARS / WHY CHOOSE US ── */}
                <section id="diferenciais" className="py-16 sm:py-20 border-t border-white/10 bg-black/40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-primary">What Sets Us Apart</h2>
                            <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                                Why Choose Barber Control?
                            </h3>
                            <p className="text-muted-foreground text-xs sm:text-sm">
                                Built exclusively for the reality of barbershops, combining speed on mobile for clients with full control on computer or phone for owners.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                            <FeatureCard 
                                icon={<Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />}
                                title="Your Barbershop's Own Link"
                                desc="Your clients book straight from their phones in 30 seconds, without downloading an app or filling out lengthy sign-up forms."
                            />
                            <FeatureCard 
                                icon={<MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />}
                                title="Automatic No-show Reduction"
                                desc="Automatic reminders and confirmations keep your clients on time, avoiding empty chairs and lost money."
                            />
                            <FeatureCard 
                                icon={<DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />}
                                title="Stress-free Commission Splits"
                                desc="No more manual math and end-of-month arguments. The system calculates each barber's exact commission instantly."
                            />
                            <FeatureCard 
                                icon={<Award className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />}
                                title="Cash Management & Integrated POS"
                                desc="Sell pomades, tonics and drinks at the counter with automatic inventory deduction and daily revenue reports."
                            />
                        </div>
                    </div>
                </section>

                {/* ── COMPARISON TABLE: NOTEBOOK vs BARBER CONTROL ── */}
                <section id="comparativo" className="py-16 sm:py-20 border-t border-white/10">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10 sm:mb-14">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Head-to-Head Comparison</h2>
                            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                Without the System vs With Barber Control
                            </h3>
                            <p className="text-muted-foreground text-xs sm:text-sm">
                                See what changes in your barbershop's routine:
                            </p>
                        </div>

                        <div className="bg-card/20 border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden backdrop-blur-md">
                            <div className="hidden md:grid md:grid-cols-12 divide-x divide-white/10">
                                <div className="md:col-span-4 p-4 bg-black/60 font-bold text-xs uppercase text-gray-400">
                                    Day-to-Day Situation
                                </div>
                                <div className="md:col-span-4 p-4 bg-red-950/20 font-bold text-xs uppercase text-red-400 flex items-center gap-1.5">
                                    <span>❌</span> Paper Notebook / Manual WhatsApp
                                </div>
                                <div className="md:col-span-4 p-4 bg-emerald-950/20 font-bold text-xs uppercase text-emerald-400 flex items-center gap-1.5">
                                    <span>✅</span> With Barber Control
                                </div>
                            </div>

                            <div className="divide-y divide-white/5">
                                {COMPARISON_ITEMS.map((item, idx) => (
                                    <div key={idx} className="p-4 md:p-0 md:grid md:grid-cols-12 md:divide-x divide-white/5 text-xs space-y-2 md:space-y-0">
                                        <div className="md:col-span-4 md:p-4 font-bold md:font-semibold text-white bg-black/20 flex items-center">
                                            {item.feature}
                                        </div>
                                        <div className="md:col-span-4 md:p-4 text-red-300/80 bg-red-500/[0.04] md:bg-red-500/[0.02] p-2.5 rounded-xl md:rounded-none flex items-center gap-2">
                                            <span className="md:hidden">❌</span> {item.manual}
                                        </div>
                                        <div className="md:col-span-4 md:p-4 text-emerald-200 font-medium bg-emerald-500/[0.06] md:bg-emerald-500/[0.04] p-2.5 rounded-xl md:rounded-none flex items-center gap-2">
                                            <span className="md:hidden">✅</span> {item.system}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── ESTIMATED GAIN CALCULATOR ── */}
                <section id="calculadora" className="py-16 sm:py-20 border-t border-white/10 bg-gradient-to-b from-black/60 to-transparent">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <div className="space-y-3 mb-10 sm:mb-12">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Revenue Simulator</h2>
                            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                How Much More Could Your Barbershop Earn?
                            </h3>
                            <p className="text-muted-foreground text-xs sm:text-sm max-w-xl mx-auto">
                                Drag the sliders below to see the estimated revenue recovered by preventing no-shows and organizing your workflow.
                            </p>
                        </div>

                        <div className="bg-[#101217] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-2xl space-y-6 sm:space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 text-left">
                                {/* Slider 1: Haircuts per day */}
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-2">
                                        <span className="text-gray-300">Haircuts per day:</span>
                                        <span className="text-primary text-base font-extrabold">{cutsPerDay} haircuts</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="5" 
                                        max="60" 
                                        value={cutsPerDay}
                                        onChange={(e) => setCutsPerDay(Number(e.target.value))}
                                        className="w-full h-2.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                                        <span>5 haircuts/day</span>
                                        <span>60 haircuts/day</span>
                                    </div>
                                </div>

                                {/* Slider 2: Average haircut price */}
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-2">
                                        <span className="text-gray-300">Average service price:</span>
                                        <span className="text-emerald-400 text-base font-extrabold">R$ {avgCutPrice},00</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="20" 
                                        max="100" 
                                        step="5"
                                        value={avgCutPrice}
                                        onChange={(e) => setAvgCutPrice(Number(e.target.value))}
                                        className="w-full h-2.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                                        <span>R$ 20,00</span>
                                        <span>R$ 100,00</span>
                                    </div>
                                </div>
                            </div>

                            {/* Calculated Result */}
                            <div className="p-5 sm:p-6 bg-black/60 border border-white/10 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 items-center">
                                <div className="text-left space-y-1">
                                    <p className="text-xs text-gray-400 font-medium">Estimated Revenue with the System:</p>
                                    <p className="text-2xl sm:text-3xl font-extrabold text-white">
                                        R$ {estimatedMonthlyRevenue.toLocaleString('pt-BR')},00 <span className="text-xs font-normal text-gray-500">/month</span>
                                    </p>
                                </div>
                                <div className="sm:border-l sm:border-white/10 sm:pl-6 text-left space-y-1">
                                    <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                                        Estimated Extra Gain / Month:
                                    </p>
                                    <p className="text-2xl sm:text-4xl font-extrabold text-emerald-400">
                                        + R$ {totalExtraGain.toLocaleString('pt-BR')},00
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                        (By eliminating no-shows and selling products at the counter)
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => scrollToSection('plans-section')}
                                className="w-full sm:w-auto px-8 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-lg shadow-primary/20 transition-all"
                            >
                                I Want These Results in My Barbershop →
                            </button>
                        </div>
                    </div>
                </section>

                {/* ── PLANS & PURCHASE SECTION ── */}
                <section id="plans-section" className="py-16 sm:py-20 border-t border-white/10 relative">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                <button
                                    onClick={() => setTrialModalOpen(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
                                >
                                    <Sparkles className="w-3.5 h-3.5" /> Start 4-Day Free Trial, No Card Required →
                                </button>
                            </div>
                            <h2 className="text-2xl sm:text-5xl font-extrabold tracking-tight">
                                Choose the Plan for Your Barbershop
                            </h2>
                            <p className="text-muted-foreground text-xs sm:text-base">
                                Get full access to all tools. Immediate activation via PIX or Credit Card.
                            </p>
                        </div>

                        {/* Plan Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch mb-16">
                            {PLANS.map((plan, index) => (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                    className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                                        plan.highlight
                                            ? 'bg-gradient-to-b from-[#191d26] to-[#0e1015] border-2 border-primary shadow-2xl shadow-primary/20 md:scale-105 z-10'
                                            : 'bg-[#101217]/80 border border-white/10 hover:border-white/20'
                                    }`}
                                >
                                    {plan.badge && (
                                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-extrabold px-4 py-1 rounded-full shadow-lg uppercase tracking-wider">
                                            {plan.badge}
                                        </div>
                                    )}

                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                                            {plan.savings && (
                                                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                                    {plan.savings}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-6 min-h-[34px] leading-relaxed">{plan.description}</p>

                                        <div className="flex items-baseline gap-1 mb-6">
                                            <span className="text-xs text-gray-400">R$</span>
                                            <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                                            <span className="text-xs text-gray-400">{plan.period}</span>
                                        </div>

                                        <div className="space-y-3 pt-6 border-t border-white/5 mb-8">
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Included in the plan:</p>
                                            {plan.features.map((feat, idx) => (
                                                <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-300">
                                                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                                    <span>{feat}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleSelectPlan(plan)}
                                        className={`w-full py-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                                            plan.highlight
                                                ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/30 transform hover:-translate-y-0.5'
                                                : 'bg-white/10 hover:bg-white/20 text-white'
                                        }`}
                                    >
                                        Subscribe to {plan.name} <ChevronRight className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── FAQ (FREQUENTLY ASKED QUESTIONS) ── */}
                <section id="faq" className="py-16 sm:py-20 border-t border-white/10 bg-black/40">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center space-y-3 mb-10 sm:mb-14">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Get Your Questions Answered</h2>
                            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Frequently Asked Questions</h3>
                        </div>

                        <div className="space-y-3.5">
                            {FAQS.map((faq, idx) => (
                                <div 
                                    key={idx}
                                    className="bg-card/20 border border-white/10 rounded-2xl overflow-hidden transition-colors"
                                >
                                    <button
                                        onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                                        className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm hover:text-primary transition-colors"
                                    >
                                        <span>{faq.q}</span>
                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${openFaqIndex === idx ? 'rotate-180 text-primary' : ''}`} />
                                    </button>
                                    {openFaqIndex === idx && (
                                        <div className="p-4 sm:p-5 pt-0 text-xs text-muted-foreground leading-relaxed border-t border-white/5">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 py-10 text-center text-xs text-gray-500 bg-black">
                <div className="max-w-7xl mx-auto px-4 space-y-4">
                    <div className="flex items-center justify-center gap-2">
                        <Scissors className="w-4 h-4 text-primary" />
                        <span className="font-bold text-white">Barber Control</span>
                        <span>• The Complete System for Barbershops</span>
                    </div>
                    <p>© {new Date().getFullYear()} Barber Control. All rights reserved.</p>
                </div>
            </footer>

            {/* ── CHECKOUT MODAL (PIX / CARD) ── */}
            <AnimatePresence>
                {checkoutModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/85 backdrop-blur-md"
                            onClick={() => setCheckoutModalOpen(false)}
                        />

                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-[#111318] border border-white/15 rounded-3xl shadow-2xl overflow-hidden z-10 my-auto"
                        >
                            {checkoutSuccess ? (
                                /* SUCCESS STATE */
                                <div className="p-6 sm:p-8 text-center">
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                                        <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400" />
                                    </div>
                                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">Access Confirmed!</h3>
                                    <p className="text-xs text-muted-foreground mb-6">
                                        {paymentMethod === 'pix'
                                            ? 'Your system access has been granted. Complete the payment using the PIX code below:'
                                            : 'Your card payment was approved and your barbershop system is 100% active!'}
                                    </p>

                                    {paymentMethod === 'pix' && checkoutSuccess.pixCode && (
                                        <div className="mb-6 space-y-3">
                                            <div className="p-4 bg-black/60 rounded-2xl border border-white/10 flex flex-col items-center justify-center">
                                                <QrCode className="w-24 h-24 sm:w-28 sm:h-28 text-primary mb-2" />
                                                <span className="text-[11px] text-gray-400">Scan the QR Code in your banking app</span>
                                            </div>

                                            <div className="flex items-center gap-2 bg-black/40 p-3 rounded-xl border border-white/10">
                                                <input 
                                                    readOnly 
                                                    value={checkoutSuccess.pixCode} 
                                                    className="bg-transparent flex-1 text-xs text-gray-300 outline-none font-mono truncate" 
                                                />
                                                <button 
                                                    onClick={() => copyToClipboard(checkoutSuccess.pixCode)} 
                                                    className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg flex items-center gap-1 hover:bg-primary/90 shrink-0"
                                                >
                                                    <Copy className="w-3 h-3" /> Copy PIX
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => navigate('/admin')}
                                        className="w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-xl transition-all shadow-lg shadow-primary/20"
                                    >
                                        Go to My Barbershop Dashboard
                                    </button>
                                </div>
                            ) : (
                                /* FORM CHECKOUT */
                                <form onSubmit={handleProcessPayment} className="p-5 sm:p-8 space-y-5">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                        <div>
                                            <h3 className="text-base sm:text-lg font-bold text-white">Subscribe to {selectedPlan.name}</h3>
                                            <p className="text-xs text-primary font-semibold">Price: R$ {selectedPlan.price} {selectedPlan.period}</p>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => setCheckoutModalOpen(false)}
                                            className="text-gray-400 hover:text-white p-1"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Barbershop Identification */}
                                    {!adminUser && (
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-gray-300">
                                                Your Barbershop Link / Slug
                                            </label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="e.g. joes-barbershop"
                                                value={barbershopSlug}
                                                onChange={e => setBarbershopSlug(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 text-white rounded-xl h-11 px-4 text-xs focus:border-primary/50 outline-none"
                                            />
                                            <p className="text-[10px] text-muted-foreground">
                                                Don't have an account yet? <Link to="/admin/login" className="text-primary underline">Register your barbershop here in 1 minute</Link>.
                                            </p>
                                        </div>
                                    )}

                                    {/* Payment Method */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-300">Payment Method</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod('pix')}
                                                className={`p-3.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                                                    paymentMethod === 'pix'
                                                        ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10'
                                                        : 'bg-black/30 border-white/10 text-gray-400 hover:text-white'
                                                }`}
                                            >
                                                <QrCode className="w-4 h-4" /> Instant PIX
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod('credit_card')}
                                                className={`p-3.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                                                    paymentMethod === 'credit_card'
                                                        ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10'
                                                        : 'bg-black/30 border-white/10 text-gray-400 hover:text-white'
                                                }`}
                                            >
                                                <CreditCard className="w-4 h-4" /> Credit Card
                                            </button>
                                        </div>
                                    </div>

                                    {/* Credit Card Form */}
                                    {paymentMethod === 'credit_card' && (
                                        <div className="space-y-3 pt-2">
                                            <div>
                                                <label className="text-[11px] font-semibold text-gray-400 mb-1 block">Name on Card</label>
                                                <input 
                                                    required 
                                                    type="text" 
                                                    placeholder="CARLOS A SILVA"
                                                    value={cardData.holderName}
                                                    onChange={e => setCardData({...cardData, holderName: e.target.value})}
                                                    className="w-full bg-black/50 border border-white/10 text-white rounded-xl h-10 px-3 text-xs focus:border-primary/50 outline-none" 
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-semibold text-gray-400 mb-1 block">Card Number</label>
                                                <input 
                                                    required 
                                                    type="text" 
                                                    placeholder="0000 0000 0000 0000"
                                                    maxLength={19}
                                                    value={cardData.cardNumber}
                                                    onChange={e => setCardData({...cardData, cardNumber: e.target.value})}
                                                    className="w-full bg-black/50 border border-white/10 text-white rounded-xl h-10 px-3 text-xs focus:border-primary/50 outline-none" 
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[11px] font-semibold text-gray-400 mb-1 block">Expiry (MM/YY)</label>
                                                    <input 
                                                        required 
                                                        type="text" 
                                                        placeholder="12/28"
                                                        maxLength={5}
                                                        value={cardData.expiry}
                                                        onChange={e => setCardData({...cardData, expiry: e.target.value})}
                                                        className="w-full bg-black/50 border border-white/10 text-white rounded-xl h-10 px-3 text-xs focus:border-primary/50 outline-none" 
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-semibold text-gray-400 mb-1 block">CVV Code</label>
                                                    <input 
                                                        required 
                                                        type="password" 
                                                        placeholder="123"
                                                        maxLength={4}
                                                        value={cardData.cvv}
                                                        onChange={e => setCardData({...cardData, cvv: e.target.value})}
                                                        className="w-full bg-black/50 border border-white/10 text-white rounded-xl h-10 px-3 text-xs focus:border-primary/50 outline-none" 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {errorMsg && (
                                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                                            {errorMsg}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/30"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Processing Payment...
                                            </>
                                        ) : (
                                            `Confirm and Activate System (R$ ${selectedPlan.price})`
                                        )}
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Trial Registration Modal */}
            <TrialModal 
                isOpen={trialModalOpen} 
                onClose={() => setTrialModalOpen(false)} 
            />
        </div>
    );
}

function FeatureCard({ icon, title, desc }) {
    return (
        <motion.div 
            whileHover={{ y: -5 }}
            className="p-5 sm:p-6 rounded-3xl bg-card/25 border border-white/10 hover:border-primary/40 transition-all duration-300 relative group overflow-hidden"
        >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-colors"></div>
            <div className="p-3 bg-black/40 rounded-2xl w-fit border border-white/5 mb-4 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h4 className="text-sm sm:text-base font-bold text-white mb-2">{title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
        </motion.div>
    );
}
