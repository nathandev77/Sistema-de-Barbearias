import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LogOut, Users, Scissors, Shield, Building2, Calendar, 
    Activity, CheckCircle2, XCircle, Plus, Copy, X, Loader2, 
    Link2, Trash2, Clock, Sparkles, AlertTriangle, Lock, Unlock, 
    RefreshCw, CreditCard, Search, ArrowUpRight, TrendingUp,
    DollarSign, PieChart, BarChart3, Wallet, ChevronDown,
    Edit3, Save, Percent, ArrowDown, ArrowUp, Minus, Receipt
} from 'lucide-react';
import { fetchSaas } from '@/lib/saas-client';

// ═══════════════════════════════════════════════════════════════════════════════
// TAB DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════
const TABS = [
    { id: 'overview', label: 'Overview', icon: PieChart },
    { id: 'financial', label: 'Financial', icon: DollarSign },
    { id: 'tenants', label: 'Barbershops', icon: Building2 },
    { id: 'costs', label: 'Operating Costs', icon: Receipt },
];

export default function SaasDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [data, setData] = useState(null);
    const [financialData, setFinancialData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    
    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');
    const [createdData, setCreatedData] = useState(null);
    const [formData, setFormData] = useState({
        barbershopName: '', ownerName: '', email: '', password: ''
    });

    // Cost modal
    const [showCostModal, setShowCostModal] = useState(false);
    const [editingCost, setEditingCost] = useState(null);
    const [costForm, setCostForm] = useState({
        name: '', category: 'infra', amount: '', isRecurring: true, notes: ''
    });
    const [costSaving, setCostSaving] = useState(false);

    // Quick Action States
    const [actionLoadingId, setActionLoadingId] = useState(null);

    const navigate = useNavigate();

    const loadDashboardData = async () => {
        try {
            const [dashResult, finResult] = await Promise.all([
                fetchSaas('/saas/dashboard'),
                fetchSaas('/saas/financial-metrics'),
            ]);
            setData(dashResult);
            setFinancialData(finResult);
        } catch (error) {
            console.error(error);
            navigate('/saas-admin/login');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadDashboardData(); }, []);

    // ── Tenant helpers ──
    const generateSlug = (name) => name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const handleCreateTenant = async (e) => {
        e.preventDefault();
        setCreating(true);
        setCreateError('');
        try {
            const slug = generateSlug(formData.barbershopName);
            const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    barbershopName: formData.barbershopName,
                    barbershopSlug: slug,
                    ownerName: formData.ownerName,
                    email: formData.email,
                    password: formData.password
                })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Error creating barbershop');
            await loadDashboardData();
            setCreatedData({
                adminUrl: `${window.location.origin}/admin/login`,
                portalUrl: `${window.location.origin}/${result.tenant.slug}`,
                email: formData.email, password: formData.password, trialDays: 4
            });
        } catch (err) { setCreateError(err.message); }
        finally { setCreating(false); }
    };

    const handleExtendTrial = async (tenantId, days) => {
        setActionLoadingId(tenantId);
        try {
            await fetchSaas(`/saas/tenants/${tenantId}/extend-trial`, { method: 'PATCH', body: JSON.stringify({ days }) });
            await loadDashboardData();
        } catch (err) { alert('Error: ' + err.message); }
        finally { setActionLoadingId(null); }
    };

    const handleActivatePlan = async (tenantId, planType = 'pro', durationMonths = 1) => {
        setActionLoadingId(tenantId);
        try {
            await fetchSaas(`/saas/tenants/${tenantId}/activate-plan`, { method: 'PATCH', body: JSON.stringify({ planType, durationMonths }) });
            await loadDashboardData();
        } catch (err) { alert('Error: ' + err.message); }
        finally { setActionLoadingId(null); }
    };

    const handleToggleStatus = async (tenantId, currentStatus) => {
        setActionLoadingId(tenantId);
        try {
            const nextStatus = currentStatus === 'blocked' ? 'trial' : 'blocked';
            const nextActive = currentStatus === 'blocked';
            await fetchSaas(`/saas/tenants/${tenantId}/status`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus, isActive: nextActive }) });
            await loadDashboardData();
        } catch (err) { alert('Error: ' + err.message); }
        finally { setActionLoadingId(null); }
    };

    const handleDeleteTenant = async (id, name) => {
        if (!window.confirm(`Are you absolutely sure you want to delete the barbershop "${name}"? ALL data will be permanently deleted.`)) return;
        try {
            await fetchSaas(`/saas/tenants/${id}`, { method: 'DELETE' });
            await loadDashboardData();
        } catch (error) { alert('Error: ' + error.message); }
    };

    const resetModal = () => {
        setShowModal(false);
        setTimeout(() => { setCreatedData(null); setCreateError(''); setFormData({ barbershopName: '', ownerName: '', email: '', password: '' }); }, 300);
    };

    const copyToClipboard = (text) => { navigator.clipboard.writeText(text); };

    // ── Cost helpers ──
    const handleSaveCost = async (e) => {
        e.preventDefault();
        setCostSaving(true);
        try {
            const payload = { ...costForm, amount: Number(costForm.amount) };
            if (editingCost) {
                await fetchSaas(`/saas/costs/${editingCost.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
            } else {
                await fetchSaas('/saas/costs', { method: 'POST', body: JSON.stringify(payload) });
            }
            setShowCostModal(false);
            setEditingCost(null);
            setCostForm({ name: '', category: 'infra', amount: '', isRecurring: true, notes: '' });
            await loadDashboardData();
        } catch (err) { alert('Error: ' + err.message); }
        finally { setCostSaving(false); }
    };

    const handleDeleteCost = async (id) => {
        if (!window.confirm('Delete this cost?')) return;
        try {
            await fetchSaas(`/saas/costs/${id}`, { method: 'DELETE' });
            await loadDashboardData();
        } catch (err) { alert('Error: ' + err.message); }
    };

    const openEditCost = (cost) => {
        setEditingCost(cost);
        setCostForm({ name: cost.name, category: cost.category, amount: cost.amount.toString(), isRecurring: cost.isRecurring, notes: cost.notes || '' });
        setShowCostModal(true);
    };

    const handleLogout = () => { localStorage.removeItem('saas_master_key'); navigate('/saas-admin/login'); };

    const filteredTenants = useMemo(() => {
        if (!data?.tenants) return [];
        return data.tenants.filter(t => {
            const matchSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (t.owner?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchSearch) return false;
            if (statusFilter === 'active') return t.subscriptionStatus === 'active';
            if (statusFilter === 'trial') return t.subscriptionStatus === 'trial' && !t.isTrialExpired;
            if (statusFilter === 'expired') return t.isTrialExpired || t.subscriptionStatus === 'expired';
            if (statusFilter === 'blocked') return !t.isActive || t.subscriptionStatus === 'blocked';
            return true;
        });
    }, [data?.tenants, searchTerm, statusFilter]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-xs uppercase tracking-widest text-gray-500">Loading Master Panel...</p>
                </div>
            </div>
        );
    }

    const { metrics } = data || {};
    const fin = financialData || {};

    return (
        <div className="min-h-screen bg-[#09090b] text-white">
            {/* Navbar */}
            <nav className="border-b border-white/10 bg-black/60 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 shadow-lg shadow-primary/20">
                                <Shield className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                                    Barber Control
                                </h1>
                                <p className="text-xs text-primary/80 font-medium tracking-wide">Master Panel & General Control</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={loadDashboardData}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold rounded-lg border border-white/10 transition-colors"
                            >
                                <RefreshCw className="w-3.5 h-3.5" /> Refresh
                            </button>
                            <button 
                                onClick={handleLogout}
                                className="flex items-center text-xs px-3.5 py-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors border border-red-400/20" 
                            >
                                <LogOut className="w-3.5 h-3.5 mr-1.5" /> Log Out
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Tabs */}
            <div className="border-b border-white/5 bg-black/30 backdrop-blur-sm sticky top-16 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-1 py-2 overflow-x-auto">
                        {TABS.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button 
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                                        isActive 
                                            ? 'bg-primary/15 text-primary border border-primary/30 shadow-sm shadow-primary/10' 
                                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <OverviewTab key="overview" metrics={metrics} fin={fin} />
                    )}
                    {activeTab === 'financial' && (
                        <FinancialTab key="financial" fin={fin} />
                    )}
                    {activeTab === 'tenants' && (
                        <TenantsTab 
                            key="tenants"
                            filteredTenants={filteredTenants}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            statusFilter={statusFilter}
                            setStatusFilter={setStatusFilter}
                            actionLoadingId={actionLoadingId}
                            onExtendTrial={handleExtendTrial}
                            onActivatePlan={handleActivatePlan}
                            onToggleStatus={handleToggleStatus}
                            onDelete={handleDeleteTenant}
                            onShowCreateModal={() => setShowModal(true)}
                            copyToClipboard={copyToClipboard}
                        />
                    )}
                    {activeTab === 'costs' && (
                        <CostsTab 
                            key="costs"
                            fin={fin}
                            onAddCost={() => { setEditingCost(null); setCostForm({ name: '', category: 'infra', amount: '', isRecurring: true, notes: '' }); setShowCostModal(true); }}
                            onEditCost={openEditCost}
                            onDeleteCost={handleDeleteCost}
                        />
                    )}
                </AnimatePresence>
            </main>

            {/* New Barbershop Modal */}
            <AnimatePresence>
                {showModal && (
                    <CreateTenantModal 
                        createdData={createdData}
                        creating={creating}
                        createError={createError}
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={handleCreateTenant}
                        onClose={resetModal}
                        copyToClipboard={copyToClipboard}
                        generateSlug={generateSlug}
                    />
                )}
            </AnimatePresence>

            {/* Cost Modal */}
            <AnimatePresence>
                {showCostModal && (
                    <CostModal 
                        editing={!!editingCost}
                        form={costForm}
                        setForm={setCostForm}
                        saving={costSaving}
                        onSubmit={handleSaveCost}
                        onClose={() => { setShowCostModal(false); setEditingCost(null); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════
function OverviewTab({ metrics, fin }) {
    const revenue = fin?.revenue || {};
    const conversion = fin?.conversion || {};
    const growth = fin?.growth || {};
    const costs = fin?.costs || {};

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* KPI Cards Row 1 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <KpiCard label="MRR" value={formatCurrency(revenue.mrr || 0)} icon={<DollarSign className="w-4 h-4 text-emerald-400" />} accent="emerald" />
                <KpiCard label="Net Profit" value={formatCurrency(revenue.netProfit || 0)} icon={<TrendingUp className="w-4 h-4 text-green-400" />} accent={revenue.netProfit >= 0 ? "emerald" : "red"} />
                <KpiCard label="Subscribers" value={conversion.activePaying || 0} icon={<CheckCircle2 className="w-4 h-4 text-blue-400" />} accent="blue" />
                <KpiCard label="In Trial" value={conversion.trialActive || 0} icon={<Clock className="w-4 h-4 text-amber-400" />} accent="amber" />
                <KpiCard label="Conversion" value={`${conversion.conversionRate || 0}%`} icon={<Percent className="w-4 h-4 text-purple-400" />} accent="purple" />
                <KpiCard label="Churn" value={`${fin?.churn?.churnRate || 0}%`} icon={<ArrowDown className="w-4 h-4 text-red-400" />} accent="red" />
            </div>

            {/* KPI Cards Row 2 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KpiCard label="Total Barbershops" value={metrics?.totalTenants || 0} icon={<Building2 className="w-4 h-4 text-blue-400" />} />
                <KpiCard label="New (7 days)" value={growth.newLast7Days || 0} icon={<Plus className="w-4 h-4 text-cyan-400" />} accent="cyan" />
                <KpiCard label="New (30 days)" value={growth.newLast30Days || 0} icon={<TrendingUp className="w-4 h-4 text-indigo-400" />} accent="indigo" />
                <KpiCard label="Monthly Costs" value={formatCurrency(costs.totalMonthlyCosts || 0)} icon={<Wallet className="w-4 h-4 text-orange-400" />} accent="orange" />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Weekly Growth Chart */}
                <div className="bg-card/20 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" /> New Sign-ups (12 Weeks)
                    </h3>
                    <p className="text-[10px] text-gray-500 mb-4">Barbershops registered per week</p>
                    <div className="flex items-end gap-1 h-32">
                        {(growth.weeklyGrowth || []).map((w, i) => {
                            const max = Math.max(...(growth.weeklyGrowth || []).map(x => x.count), 1);
                            const height = Math.max((w.count / max) * 100, 4);
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-[9px] text-gray-400 font-mono">{w.count}</span>
                                    <div 
                                        className="w-full bg-gradient-to-t from-primary/60 to-primary/30 rounded-t-md transition-all duration-500 hover:from-primary hover:to-primary/60"
                                        style={{ height: `${height}%` }}
                                    />
                                    <span className="text-[8px] text-gray-500 rotate-0">{w.week}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Monthly Growth Chart */}
                <div className="bg-card/20 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" /> Sign-ups vs Activations (6 Months)
                    </h3>
                    <p className="text-[10px] text-gray-500 mb-4">Monthly new sign-ups and conversions</p>
                    <div className="flex items-end gap-3 h-32">
                        {(growth.monthlyGrowth || []).map((m, i) => {
                            const maxVal = Math.max(
                                ...(growth.monthlyGrowth || []).map(x => Math.max(x.newTenants, x.activations)), 1
                            );
                            const hNew = Math.max((m.newTenants / maxVal) * 100, 4);
                            const hAct = Math.max((m.activations / maxVal) * 100, 4);
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <div className="flex items-end gap-0.5 w-full h-full">
                                        <div 
                                            className="flex-1 bg-gradient-to-t from-blue-500/60 to-blue-500/20 rounded-t-md"
                                            style={{ height: `${hNew}%` }}
                                            title={`New: ${m.newTenants}`}
                                        />
                                        <div 
                                            className="flex-1 bg-gradient-to-t from-emerald-500/60 to-emerald-500/20 rounded-t-md"
                                            style={{ height: `${hAct}%` }}
                                            title={`Activations: ${m.activations}`}
                                        />
                                    </div>
                                    <span className="text-[9px] text-gray-500">{m.month}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex items-center gap-4 mt-3 justify-center">
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-blue-500/60" /><span className="text-[10px] text-gray-400">New</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/60" /><span className="text-[10px] text-gray-400">Activations</span></div>
                    </div>
                </div>
            </div>

            {/* Revenue breakdown + Volume */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Revenue by Plan */}
                <div className="bg-card/20 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-primary" /> Revenue by Plan
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(revenue.revenueByPlan || {}).map(([planId, data]) => (
                            <div key={planId} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2.5 h-2.5 rounded-full ${planId === 'annual' ? 'bg-emerald-400' : planId === 'quarterly' ? 'bg-blue-400' : 'bg-amber-400'}`} />
                                    <span className="text-xs text-gray-300 capitalize">{planId === 'monthly' ? 'Monthly' : planId === 'quarterly' ? 'Quarterly' : 'Annual'}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-bold text-white">{formatCurrency(data.revenue)}</span>
                                    <span className="text-[10px] text-gray-500 ml-1">({data.count})</span>
                                </div>
                            </div>
                        ))}
                        {Object.keys(revenue.revenueByPlan || {}).length === 0 && (
                            <p className="text-xs text-gray-500 text-center py-4">No active subscribers</p>
                        )}
                    </div>
                </div>

                {/* Volume */}
                <div className="bg-card/20 border border-white/10 rounded-2xl p-6 backdrop-blur-md lg:col-span-2">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-400" /> Operations Volume
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-3xl font-bold bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">{metrics?.totalBarbers || 0}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Barbers</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">{metrics?.totalClients || 0}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Clients</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">{metrics?.totalAppointments || 0}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Appointments</div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: FINANCIAL
// ═══════════════════════════════════════════════════════════════════════════════
function FinancialTab({ fin }) {
    const revenue = fin?.revenue || {};
    const conversion = fin?.conversion || {};
    const costs = fin?.costs || {};
    const churn = fin?.churn || {};

    const costCategories = { infra: 'Infrastructure', service: 'Services', marketing: 'Marketing', other: 'Other' };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Financial KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <FinancialCard 
                    label="MRR (Monthly Recurring Revenue)"
                    value={formatCurrency(revenue.mrr || 0)}
                    subtitle={`ARR: ${formatCurrency(revenue.arr || 0)}`}
                    icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
                    accent="emerald"
                />
                <FinancialCard 
                    label="Monthly Operating Costs"
                    value={formatCurrency(costs.totalMonthlyCosts || 0)}
                    subtitle={`One-time: ${formatCurrency(costs.totalOneTimeCosts || 0)}`}
                    icon={<Wallet className="w-5 h-5 text-orange-400" />}
                    accent="orange"
                />
                <FinancialCard 
                    label="Monthly Net Profit"
                    value={formatCurrency(revenue.netProfit || 0)}
                    subtitle={revenue.netProfit >= 0 ? 'Profitable operation' : 'Unprofitable operation'}
                    icon={<TrendingUp className="w-5 h-5" style={{color: revenue.netProfit >= 0 ? '#34d399' : '#f87171'}} />}
                    accent={revenue.netProfit >= 0 ? 'emerald' : 'red'}
                    highlight
                />
                <FinancialCard 
                    label="Trial → Paying Conversion"
                    value={`${conversion.conversionRate || 0}%`}
                    subtitle={`${conversion.activePaying || 0} of ${conversion.totalTrials || 0} trials`}
                    icon={<Percent className="w-5 h-5 text-purple-400" />}
                    accent="purple"
                />
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Cost breakdown */}
                <div className="bg-card/20 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-orange-400" /> Costs by Category
                    </h3>
                    {Object.entries(costs.costsByCategory || {}).length > 0 ? (
                        <div className="space-y-3">
                            {Object.entries(costs.costsByCategory || {}).map(([cat, amount]) => {
                                const total = costs.totalMonthlyCosts || 1;
                                const pct = Math.round((amount / total) * 100);
                                return (
                                    <div key={cat}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-gray-300">{costCategories[cat] || cat}</span>
                                            <span className="text-xs font-bold text-white">{formatCurrency(amount)} ({pct}%)</span>
                                        </div>
                                        <div className="w-full bg-white/5 rounded-full h-1.5">
                                            <div className="h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-400" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500 text-center py-8">No costs registered. Go to the "Operating Costs" tab to add some.</p>
                    )}
                </div>

                {/* Conversion funnel */}
                <div className="bg-card/20 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-purple-400" /> Conversion Funnel
                    </h3>
                    <div className="space-y-3">
                        <FunnelBar label="Total Sign-ups" value={conversion.totalTrials || 0} max={conversion.totalTrials || 1} color="bg-blue-500" />
                        <FunnelBar label="Active Trials" value={conversion.trialActive || 0} max={conversion.totalTrials || 1} color="bg-amber-500" />
                        <FunnelBar label="Expired Trials" value={conversion.trialExpired || 0} max={conversion.totalTrials || 1} color="bg-red-500" />
                        <FunnelBar label="Paying Subscribers" value={conversion.activePaying || 0} max={conversion.totalTrials || 1} color="bg-emerald-500" />
                        <FunnelBar label="Churn (canceled)" value={churn.churned || 0} max={conversion.totalTrials || 1} color="bg-gray-500" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: BARBERSHOPS
// ═══════════════════════════════════════════════════════════════════════════════
function TenantsTab({ filteredTenants, searchTerm, setSearchTerm, statusFilter, setStatusFilter, actionLoadingId, onExtendTrial, onActivatePlan, onToggleStatus, onDelete, onShowCreateModal, copyToClipboard }) {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="bg-card/20 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            Barbershops in the System
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">{filteredTenants.length}</span>
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">Access, trial days and plan management</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white placeholder:text-gray-500 pl-9 pr-3 py-1.5 rounded-xl text-xs focus:border-primary/50 outline-none" />
                        </div>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-black/40 border border-white/10 text-gray-300 px-3 py-1.5 rounded-xl text-xs outline-none cursor-pointer">
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="trial">Trial</option>
                            <option value="expired">Expired</option>
                            <option value="blocked">Blocked</option>
                        </select>
                        <button onClick={onShowCreateModal} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-xl shadow-lg shadow-primary/25">
                            <Plus className="w-4 h-4" /> New Barbershop
                        </button>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="text-[11px] uppercase bg-black/40 text-gray-400 font-semibold tracking-wider">
                            <tr>
                                <th className="px-5 py-3.5">Barbershop</th>
                                <th className="px-5 py-3.5">Owner / Contact</th>
                                <th className="px-5 py-3.5">Status</th>
                                <th className="px-5 py-3.5 text-center">Plan</th>
                                <th className="px-5 py-3.5 text-center">Links</th>
                                <th className="px-5 py-3.5 text-center">Barbers</th>
                                <th className="px-5 py-3.5 text-center">Clients</th>
                                <th className="px-5 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredTenants.map((tenant) => {
                                const isBlocked = !tenant.isActive || tenant.subscriptionStatus === 'blocked';
                                const isActiveSub = tenant.subscriptionStatus === 'active';
                                const isTrial = tenant.subscriptionStatus === 'trial';
                                const isLoadingThis = actionLoadingId === tenant.id;

                                return (
                                    <tr key={tenant.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="font-semibold text-white text-sm">{tenant.name}</div>
                                            <div className="text-[11px] text-primary/80 font-mono mt-0.5">/{tenant.slug}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="text-gray-200 font-medium">{tenant.owner?.name || '-'}</div>
                                            <div className="text-gray-500 text-[11px]">{tenant.owner?.email || '-'}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            {isBlocked ? (
                                                <StatusBadge color="red" icon={Lock} label="Blocked" />
                                            ) : isActiveSub ? (
                                                <StatusBadge color="emerald" icon={CheckCircle2} label="Active" />
                                            ) : tenant.isTrialExpired ? (
                                                <StatusBadge color="red" icon={AlertTriangle} label="Trial Expired" />
                                            ) : isTrial ? (
                                                <StatusBadge color="amber" icon={Clock} label={`Trial (${tenant.trialDaysRemaining}d)`} />
                                            ) : (
                                                <span className="text-gray-400">{tenant.subscriptionStatus}</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className="bg-white/5 text-gray-300 px-2 py-0.5 rounded text-[11px] font-medium border border-white/10 uppercase">{tenant.planType || 'Pro'}</span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <a href={`/${tenant.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-semibold rounded-lg border border-primary/20">
                                                    <Link2 className="w-3 h-3" /> Portal
                                                </a>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center font-medium text-gray-300">{tenant.counts?.barbers || 0}</td>
                                        <td className="px-5 py-4 text-center font-medium text-gray-300">{tenant.counts?.clients || 0}</td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button onClick={() => onExtendTrial(tenant.id, 7)} disabled={isLoadingThis} className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold rounded-lg border border-amber-500/20 text-[11px]">+7d</button>
                                                <button onClick={() => onActivatePlan(tenant.id)} disabled={isLoadingThis} className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold rounded-lg border border-emerald-500/20 text-[11px]">Activate</button>
                                                <button onClick={() => onToggleStatus(tenant.id, tenant.subscriptionStatus)} disabled={isLoadingThis} className={`p-1.5 rounded-lg border transition-colors ${isBlocked ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                                                    {isBlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                                </button>
                                                <button onClick={() => onDelete(tenant.id, tenant.name)} disabled={isLoadingThis} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredTenants.length === 0 && (
                                <tr><td colSpan="8" className="px-6 py-12 text-center text-gray-500">No barbershops found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: OPERATING COSTS
// ═══════════════════════════════════════════════════════════════════════════════
function CostsTab({ fin, onAddCost, onEditCost, onDeleteCost }) {
    const costs = fin?.costs || {};
    const items = costs.items || [];
    const categoryLabels = { infra: 'Infrastructure', service: 'Services', marketing: 'Marketing', other: 'Other' };
    const categoryColors = { infra: 'blue', service: 'purple', marketing: 'pink', other: 'gray' };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KpiCard label="Monthly Total (Recurring)" value={formatCurrency(costs.totalMonthlyCosts || 0)} icon={<RefreshCw className="w-4 h-4 text-orange-400" />} accent="orange" />
                <KpiCard label="One-time Costs" value={formatCurrency(costs.totalOneTimeCosts || 0)} icon={<Receipt className="w-4 h-4 text-gray-400" />} />
                <KpiCard label="Registered Items" value={items.length} icon={<BarChart3 className="w-4 h-4 text-blue-400" />} accent="blue" />
            </div>

            {/* Items Table */}
            <div className="bg-card/20 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">SaaS Operating Costs</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Register all fixed and variable costs to keep Barber Control running</p>
                    </div>
                    <button onClick={onAddCost} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-xl shadow-lg shadow-primary/25">
                        <Plus className="w-4 h-4" /> New Cost
                    </button>
                </div>

                {items.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="text-[11px] uppercase bg-black/40 text-gray-400 font-semibold tracking-wider">
                                <tr>
                                    <th className="px-5 py-3.5">Name</th>
                                    <th className="px-5 py-3.5">Category</th>
                                    <th className="px-5 py-3.5 text-right">Amount (R$)</th>
                                    <th className="px-5 py-3.5 text-center">Type</th>
                                    <th className="px-5 py-3.5">Notes</th>
                                    <th className="px-5 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {items.map(cost => {
                                    const catColor = categoryColors[cost.category] || 'gray';
                                    return (
                                        <tr key={cost.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-5 py-4 font-semibold text-white">{cost.name}</td>
                                            <td className="px-5 py-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-${catColor}-500/10 text-${catColor}-400 border-${catColor}-500/20`}>
                                                    {categoryLabels[cost.category] || cost.category}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right font-bold text-white">{formatCurrency(cost.amount)}</td>
                                            <td className="px-5 py-4 text-center">
                                                <span className={`text-[10px] font-semibold ${cost.isRecurring ? 'text-amber-400' : 'text-gray-400'}`}>
                                                    {cost.isRecurring ? '🔄 Recurring' : '1️⃣ One-time'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-gray-400 max-w-[200px] truncate">{cost.notes || '—'}</td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button onClick={() => onEditCost(cost)} className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg border border-white/10">
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => onDeleteCost(cost.id)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="px-6 py-16 text-center">
                        <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-sm text-gray-400 font-medium">No costs registered</p>
                        <p className="text-xs text-gray-500 mt-1">Click "New Cost" to start tracking your operating expenses.</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODALS
// ═══════════════════════════════════════════════════════════════════════════════
function CostModal({ editing, form, setForm, saving, onSubmit, onClose }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-[#0f1115] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/20">
                            <Receipt className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">{editing ? 'Edit Cost' : 'New Operating Cost'}</h3>
                            <p className="text-xs text-gray-500">Track the expenses of running the SaaS</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={onSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Cost Name</label>
                        <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-black/50 border border-white/10 text-white h-10 rounded-xl px-3 text-xs focus:border-primary/50 outline-none" placeholder="E.g. Supabase, EasyPanel VPS, Domain..." />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Category</label>
                            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-black/50 border border-white/10 text-gray-300 h-10 rounded-xl px-3 text-xs outline-none cursor-pointer">
                                <option value="infra">Infrastructure</option>
                                <option value="service">Services</option>
                                <option value="marketing">Marketing</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Monthly Amount (R$)</label>
                            <input required type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-black/50 border border-white/10 text-white h-10 rounded-xl px-3 text-xs focus:border-primary/50 outline-none" placeholder="59.90" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.isRecurring} onChange={e => setForm({...form, isRecurring: e.target.checked})} className="rounded border-white/20 bg-black/50 text-primary" />
                            <span className="text-xs text-gray-300">Recurring Cost (monthly)</span>
                        </label>
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Notes (optional)</label>
                        <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-black/50 border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus:border-primary/50 outline-none resize-none h-16" placeholder="E.g. Free tier plan, annual renewal..." />
                    </div>
                    <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/5">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white">Cancel</button>
                        <button type="submit" disabled={saving} className="flex items-center justify-center min-w-[120px] px-4 py-2 text-xs font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editing ? 'Save Changes' : 'Add Cost')}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

function CreateTenantModal({ createdData, creating, createError, formData, setFormData, onSubmit, onClose, copyToClipboard, generateSlug }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-[#0f1115] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                {createdData ? (
                    <div className="p-8">
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-center text-white mb-1">Barbershop Created!</h3>
                        <p className="text-center text-xs text-emerald-400 font-semibold mb-6">✨ 4-Day Free Trial activated.</p>
                        <div className="space-y-3.5 mb-8">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Admin Panel</label>
                                <div className="flex items-center gap-2 bg-black/50 p-2.5 rounded-xl border border-white/5">
                                    <Link2 className="w-4 h-4 text-primary" />
                                    <input readOnly value={createdData.adminUrl} className="bg-transparent flex-1 text-xs text-white outline-none" />
                                    <button onClick={() => copyToClipboard(createdData.adminUrl)} className="text-gray-400 hover:text-white p-1"><Copy className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Client Portal</label>
                                <div className="flex items-center gap-2 bg-black/50 p-2.5 rounded-xl border border-white/5">
                                    <Link2 className="w-4 h-4 text-emerald-400" />
                                    <input readOnly value={createdData.portalUrl} className="bg-transparent flex-1 text-xs text-white outline-none" />
                                    <button onClick={() => copyToClipboard(createdData.portalUrl)} className="text-gray-400 hover:text-white p-1"><Copy className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                            <div className="mt-3 p-3.5 bg-primary/10 rounded-xl border border-primary/20">
                                <p className="text-[11px] text-primary mb-1 font-semibold">Credentials:</p>
                                <p className="text-xs font-mono text-white">E-mail: {createdData.email}</p>
                                <p className="text-xs font-mono text-white">Password: {createdData.password}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold">Done</button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20"><Building2 className="w-5 h-5 text-primary" /></div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Register Barbershop</h3>
                                    <p className="text-xs text-gray-500">4-day free trial</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={onSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Barbershop</label>
                                    <input required value={formData.barbershopName} onChange={e => setFormData({...formData, barbershopName: e.target.value})} className="w-full bg-black/50 border border-white/10 text-white h-10 rounded-xl px-3 text-xs focus:border-primary/50 outline-none" placeholder="E.g. VIP Barbershop" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Slug</label>
                                    <input disabled value={generateSlug(formData.barbershopName)} className="w-full bg-black/80 border border-white/5 text-gray-400 h-10 rounded-xl px-3 text-xs cursor-not-allowed" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Owner</label>
                                <input required value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} className="w-full bg-black/50 border border-white/10 text-white h-10 rounded-xl px-3 text-xs focus:border-primary/50 outline-none" placeholder="E.g. Carlos" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">E-mail</label>
                                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-black/50 border border-white/10 text-white h-10 rounded-xl px-3 text-xs focus:border-primary/50 outline-none" placeholder="carlos@email.com" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Password</label>
                                    <input required type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} minLength={8} className="w-full bg-black/50 border border-white/10 text-white h-10 rounded-xl px-3 text-xs focus:border-primary/50 outline-none" placeholder="Min. 8 chars" />
                                </div>
                            </div>
                            {createError && <div className="p-3 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl">{createError}</div>}
                            <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/5">
                                <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white">Cancel</button>
                                <button type="submit" disabled={creating} className="flex items-center justify-center min-w-[140px] px-4 py-2 text-xs font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25">
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create with 4 Free Days"}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </motion.div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════
function KpiCard({ label, value, icon, accent }) {
    const accentMap = {
        emerald: 'group-hover:border-emerald-500/30',
        blue: 'group-hover:border-blue-500/30',
        amber: 'group-hover:border-amber-500/30',
        red: 'group-hover:border-red-500/30',
        purple: 'group-hover:border-purple-500/30',
        cyan: 'group-hover:border-cyan-500/30',
        indigo: 'group-hover:border-indigo-500/30',
        orange: 'group-hover:border-orange-500/30',
        pink: 'group-hover:border-pink-500/30',
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`bg-card/30 backdrop-blur-sm border border-white/5 p-4 rounded-2xl relative overflow-hidden group transition-all ${accentMap[accent] || 'group-hover:border-primary/30'}`}
        >
            <div className="flex items-center justify-between relative z-10">
                <div>
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{label}</p>
                    <h3 className="text-xl font-bold text-white mt-0.5">{value}</h3>
                </div>
                <div className="p-2 bg-black/40 rounded-xl border border-white/5">{icon}</div>
            </div>
        </motion.div>
    );
}

function FinancialCard({ label, value, subtitle, icon, accent, highlight }) {
    const accentBorders = {
        emerald: 'border-emerald-500/20', orange: 'border-orange-500/20', red: 'border-red-500/20', purple: 'border-purple-500/20',
    };

    return (
        <div className={`bg-card/20 border rounded-2xl p-6 backdrop-blur-md relative overflow-hidden ${highlight ? 'border-emerald-500/30 bg-emerald-500/5' : accentBorders[accent] || 'border-white/10'}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{label}</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
                    {subtitle && <p className="text-[10px] text-gray-500 mt-1">{subtitle}</p>}
                </div>
                <div className="p-2.5 bg-black/40 rounded-xl border border-white/5">{icon}</div>
            </div>
        </div>
    );
}

function FunnelBar({ label, value, max, color }) {
    const pct = Math.max((value / max) * 100, 2);
    return (
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-300">{label}</span>
                <span className="text-xs font-bold text-white">{value}</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2">
                <div className={`h-2 rounded-full ${color}/60`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

function StatusBadge({ color, icon: Icon, label }) {
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-${color}-500/10 text-${color}-400 font-semibold border border-${color}-500/20 text-[11px]`}>
            <Icon className="w-3 h-3" /> {label}
        </span>
    );
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}
