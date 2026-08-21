import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Appointment, Client, Service, Barber } from '@/api/base44Client';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DatePicker } from '@/components/ui/DatePicker';
import { TimePicker } from '@/components/ui/TimePicker';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

const STATUSES = ['agendado', 'confirmado', 'concluido', 'cancelado'];
const STATUS_LABELS = {
    agendado: { label: 'Agendado', className: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
    confirmado: { label: 'Confirmado', className: 'text-green-400 bg-green-400/10 border-green-400/20' },
    concluido: { label: 'Concluído', className: 'text-primary bg-primary/10 border-primary/20' },
    cancelado: { label: 'Cancelado', className: 'text-destructive bg-destructive/10 border-destructive/20' },
};

// ── Status Card Icons ─────────────────────────────────────────────────────────
const CalendarCheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);
const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const XCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const ClipboardCheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
);
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);
const ChevronDownIcon = ({ className = "w-3.5 h-3.5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

// ── Status Dropdown Component (Portal-based, zero scrollbar bug) ────────────
function StatusDropdown({ currentStatus, onStatusChange }) {
    const st = STATUS_LABELS[currentStatus] || { label: currentStatus, className: 'text-muted-foreground bg-muted border-border' };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border ${st.className} transition-all hover:brightness-110 cursor-pointer outline-none select-none`}
                >
                    {st.label}
                    <ChevronDownIcon className="w-3 h-3" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[140px] p-1.5 bg-card/95 backdrop-blur-md border border-border shadow-2xl z-50 rounded-xl">
                {STATUSES.map(s => {
                    const sInfo = STATUS_LABELS[s];
                    return (
                        <DropdownMenuItem
                            key={s}
                            onClick={() => onStatusChange(s)}
                            className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium cursor-pointer rounded-lg transition-colors ${s === currentStatus ? 'bg-secondary/80 text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'}`}
                        >
                            <span className={`w-2 h-2 rounded-full ${sInfo.className.split(' ')[0].replace('text-', 'bg-')}`} />
                            {sInfo.label}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// ── Modal Component ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center sm:items-start sm:pt-20 pb-20">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-xl flex flex-col rounded-2xl bg-card border border-border shadow-2xl my-auto animate-in fade-in-0 zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                    <h2 className="text-base font-semibold text-foreground">{title}</h2>
                    <button type="button" onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-6 overflow-visible">{children}</div>
            </div>
        </div>
    );
}

const EMPTY_FORM = { clientId: '', serviceIds: [], barberId: '', date: '', time: '', price: '', notes: '', status: 'agendado' };

export default function Agenda() {
    const [appointments, setAppointments] = useState([]);
    const [clients, setClients] = useState([]);
    const [services, setServices] = useState([]);
    const [barbers, setBarbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [filterDate, setFilterDate] = useState('');
    const [periodPreset, setPeriodPreset] = useState('all');
    const [selectedBarberId, setSelectedBarberId] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [availableTimes, setAvailableTimes] = useState([]);
    const [loadingTimes, setLoadingTimes] = useState(false);
    const [editId, setEditId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [a, c, s, b] = await Promise.all([Appointment.list(), Client.list(), Service.list(), Barber.list()]);
            setAppointments(a.sort((x, y) => (x.date + x.time < y.date + y.time ? 1 : -1)));
            setClients(c);
            setServices(s);
            setBarbers(b);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { 
        load(); 
        const intervalId = setInterval(async () => {
            const [a, c, s, b] = await Promise.all([Appointment.list(), Client.list(), Service.list(), Barber.list()]);
            setAppointments(a.sort((x, y) => (x.date + x.time < y.date + y.time ? 1 : -1)));
            setClients(c);
            setServices(s);
            setBarbers(b);
        }, 10000);
        return () => clearInterval(intervalId);
    }, [load]);

    const openNew = () => { setForm(EMPTY_FORM); setEditId(null); setShowModal(true); };
    const openEdit = (appt) => {
        setForm({ 
            clientId: appt.clientId || '', 
            serviceIds: appt.services?.map(s => s.id) || [], 
            barberId: appt.barberId || '', 
            date: appt.date || '', 
            time: appt.time || '', 
            price: appt.price !== undefined && appt.price !== null ? appt.price : '', 
            notes: appt.notes || '', 
            status: appt.status || 'agendado' 
        });
        setEditId(appt.id);
        setShowModal(true);
    };

    useEffect(() => {
        if (form.barberId && form.date) {
            setLoadingTimes(true);
            Appointment.getAvailableSlots(form.barberId, form.date)
                .then(slots => {
                    if (editId && form.time && !slots.includes(form.time)) {
                        slots.push(form.time);
                        slots.sort();
                    }
                    setAvailableTimes(slots);
                })
                .catch(console.error)
                .finally(() => setLoadingTimes(false));
        } else {
            setAvailableTimes([]);
        }
    }, [form.barberId, form.date, editId, form.time]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...form, price: Number(form.price) };
            if (editId) {
                await Appointment.update(editId, payload);
            } else {
                await Appointment.create(payload);
            }
            setShowModal(false);
            await load();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar: ' + (error.response?.data?.error || error.message || 'Desconhecido'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        await Appointment.delete(deleteId);
        setDeleteId(null);
        await load();
    };

    const handleStatusChange = async (id, status) => {
        await Appointment.update(id, { status });
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setSelectedBarberId('all');
        setPeriodPreset('all');
        setFilterDate('');
    };

    const hasActiveFilters = Boolean(searchQuery || selectedBarberId !== 'all' || filterDate || periodPreset !== 'all');

    // ── Filtered appointments ──────────────────────────────────────────────────
    const filtered = useMemo(() => {
        const todayStr = new Date().toISOString().split("T")[0];
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() + diffToMonday);
        const startOfWeekStr = startOfWeek.toISOString().split("T")[0];

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        const startOfMonthStr = startOfMonth.toISOString().split("T")[0];

        return appointments.filter(a => {
            // Filtro de Barbeiro
            if (selectedBarberId !== 'all' && a.barberId !== selectedBarberId) return false;

            // Filtro de Data Específica
            if (filterDate && a.date !== filterDate) return false;

            // Filtro de Presets de Período (quando filterDate não está setada)
            if (!filterDate) {
                if (periodPreset === 'today' && a.date !== todayStr) return false;
                if (periodPreset === 'week' && (a.date < startOfWeekStr || a.date > todayStr)) return false;
                if (periodPreset === 'month' && (a.date < startOfMonthStr || a.date > todayStr)) return false;
            }

            // Busca por texto (cliente, barbeiro, serviços)
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const clientMatch = (a.client_name || a.client?.name || '').toLowerCase().includes(q);
                const barberMatch = (a.barber_name || a.barber?.name || '').toLowerCase().includes(q);
                const serviceMatch = (a.service_name || a.services?.map(s => s.name).join(' ') || '').toLowerCase().includes(q);
                if (!clientMatch && !barberMatch && !serviceMatch) return false;
            }

            return true;
        });
    }, [appointments, filterDate, periodPreset, selectedBarberId, searchQuery]);

    // ── Status counts (baseado nos filtros atuais) ────────────────────────────
    const statusCounts = useMemo(() => {
        return {
            agendado: filtered.filter(a => a.status === 'agendado').length,
            confirmado: filtered.filter(a => a.status === 'confirmado').length,
            cancelado: filtered.filter(a => a.status === 'cancelado').length,
            concluido: appointments.filter(a => a.status === 'concluido').length,
        };
    }, [filtered, appointments]);

    // ── Group by status sections ───────────────────────────────────────────────
    const inProgress = filtered.filter(a => a.status === 'confirmado' || a.status === 'agendado');
    const completed = filtered.filter(a => a.status === 'concluido');
    const cancelled = filtered.filter(a => a.status === 'cancelado');

    // ── Date label helper ──────────────────────────────────────────────────────
    const getDateLabel = () => {
        if (!filterDate) return 'Todas as datas';
        const today = new Date();
        const selected = new Date(filterDate + 'T12:00:00');
        const todayStr = today.toISOString().split('T')[0];
        const day = filterDate.split('-')[2];
        const month = filterDate.split('-')[1];
        const prefix = filterDate === todayStr ? 'Hoje' : selected.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
        return `${prefix} • ${day}/${month}`;
    };

    const formatCurrency = (val) => val ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val) : '—';

    // ── Status counter cards config ────────────────────────────────────────────
    const STATUS_CARDS = [
        { key: 'agendado', label: 'Agendados', count: statusCounts.agendado, icon: <CalendarCheckIcon />, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
        { key: 'confirmado', label: 'Confirmados', count: statusCounts.confirmado, icon: <CheckCircleIcon />, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
        { key: 'cancelado', label: 'Cancelados', count: statusCounts.cancelado, icon: <XCircleIcon />, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
        { key: 'concluido', label: 'Histórico (Concluídos)', count: statusCounts.concluido, icon: <ClipboardCheckIcon />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', to: '/admin/historico' },
    ];

    // ── Render table section ───────────────────────────────────────────────────
    const renderTable = (title, items, showCount = true) => {
        if (items.length === 0) return null;
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                        {showCount && (
                            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full font-medium">
                                {items.length}
                            </span>
                        )}
                    </div>
                    {title === 'Finalizados' && (
                        <Link
                            to="/admin/historico"
                            className="text-xs text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 transition-colors"
                        >
                            Ver no Histórico Completo →
                        </Link>
                    )}
                </div>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border">
                                    {['Cliente', 'Serviço', 'Barbeiro', 'Data / Hora', 'Status', 'Ações'].map(h => (
                                        <th key={h} className="text-left px-5 py-3.5 text-[11px] uppercase tracking-widest text-muted-foreground font-medium">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((appt, i) => (
                                    <tr key={appt.id} className={`hover:bg-secondary/20 transition-colors ${i < items.length - 1 ? 'border-b border-border/50' : ''}`}>
                                        <td className="px-5 py-3.5 font-medium text-foreground">{appt.client_name || '—'}</td>
                                        <td className="px-5 py-3.5 text-muted-foreground">{appt.service_name || '—'}</td>
                                        <td className="px-5 py-3.5 text-muted-foreground">{appt.barber_name || '—'}</td>
                                        <td className="px-5 py-3.5 text-muted-foreground">
                                            {appt.date ? (
                                                <span>
                                                    {filterDate === appt.date ? 'Hoje' : appt.date.split('-').reverse().join('/')}
                                                    {appt.time ? ` • ${appt.time}` : ''}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <StatusDropdown
                                                currentStatus={appt.status}
                                                onStatusChange={(status) => handleStatusChange(appt.id, status)}
                                            />
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => openEdit(appt)}
                                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                                                    title="Editar"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(appt.id)}
                                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                                                    title="Excluir"
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 w-full">
            {/* ── Status Counter Cards ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {STATUS_CARDS.map(card => {
                    const Comp = card.to ? Link : 'div';
                    return (
                        <Comp
                            key={card.key}
                            to={card.to}
                            className={`relative rounded-xl border ${card.border} bg-card p-4 flex items-center justify-between group hover:bg-secondary/30 transition-all duration-200 ${card.to ? 'cursor-pointer hover:border-primary/40' : 'cursor-default'}`}
                        >
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1 flex items-center gap-1">
                                    {card.label}
                                    {card.to && <span className="text-[10px] text-primary group-hover:translate-x-0.5 transition-transform">→</span>}
                                </p>
                                <p className="text-2xl font-bold text-foreground">{card.count}</p>
                            </div>
                            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center ${card.color}`}>
                                {card.icon}
                            </div>
                        </Comp>
                    );
                })}
            </div>

            {/* ── Search & Filters Bar (Idêntico ao Histórico) ──────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-card/40 p-4 rounded-2xl border border-border">
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                    {/* Input de Busca */}
                    <div className="relative flex-1 min-w-[200px] max-w-xs">
                        <span className="absolute inset-y-0 left-3.5 flex items-center text-muted-foreground pointer-events-none">
                            <SearchIcon />
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar cliente, barbeiro ou serviço..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 h-10 rounded-full border border-border bg-card/70 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
                        />
                    </div>

                    {/* Seletor de Barbeiro */}
                    <Select value={selectedBarberId} onValueChange={setSelectedBarberId}>
                        <SelectTrigger className="w-[180px] h-10 rounded-full bg-card/70 border-border text-xs">
                            <SelectValue placeholder="Barbeiro" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Barbeiros</SelectItem>
                            {barbers.map((b) => (
                                <SelectItem key={b.id} value={b.id}>
                                    {b.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Presets de Período: Todos, Hoje, Semana, Mês */}
                    <div className="inline-flex rounded-full border border-border p-0.5 bg-card/70 text-xs">
                        {[
                            { id: "all", label: "Todos" },
                            { id: "today", label: "Hoje" },
                            { id: "week", label: "Semana" },
                            { id: "month", label: "Mês" },
                        ].map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                    setPeriodPreset(p.id);
                                    setFilterDate("");
                                }}
                                className={`px-3 py-1.5 rounded-full transition-colors font-medium ${
                                    periodPreset === p.id && !filterDate
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* DatePicker Personalizado */}
                    <div className="w-[165px]">
                        <DatePicker
                            value={filterDate}
                            onChange={(date) => {
                                setFilterDate(date);
                                setPeriodPreset("all");
                            }}
                            placeholder="Data específica"
                            triggerClassName="h-10 rounded-full bg-card/70 border border-border px-3.5 text-xs w-full hover:bg-secondary/70 hover:border-primary/40"
                        />
                    </div>

                    {/* Limpar Filtros */}
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="text-xs text-primary hover:text-primary/80 font-medium px-2 py-1 transition-colors"
                        >
                            Limpar Filtros
                        </button>
                    )}
                </div>

                {/* Botão Novo Agendamento */}
                <button
                    type="button"
                    onClick={openNew}
                    className="flex items-center gap-2 px-5 h-10 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 shrink-0"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Novo Agendamento
                </button>
            </div>

            {/* ── Content ──────────────────────────────────────────────────── */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : inProgress.length === 0 && cancelled.length === 0 ? (
                <div className="rounded-xl border border-border border-dashed bg-card/50 flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm font-medium text-foreground">Nenhum agendamento pendente</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                        Todos os cortes agendados foram finalizados ou ainda não foram criados para este período.
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                        <button onClick={openNew} className="text-xs text-primary hover:underline">
                            + Novo agendamento
                        </button>
                        {completed.length > 0 && (
                            <Link to="/admin/historico" className="text-xs text-emerald-400 hover:underline">
                                Ver {completed.length} corte(s) no Histórico →
                            </Link>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {renderTable('Serviços em Andamento', inProgress)}
                    {renderTable('Cancelados', cancelled)}
                </div>
            )}

            {/* ── Modal ────────────────────────────────────────────────────── */}
            {showModal && (
                <Modal title={editId ? 'Editar Agendamento' : 'Novo Agendamento'} onClose={() => setShowModal(false)}>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 text-sm">
                            {/* Cliente e Barbeiro */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Cliente *</label>
                                    <select
                                        required
                                        value={form.clientId}
                                        onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-secondary/60 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/50 transition-all"
                                    >
                                        <option value="" disabled>Selecione um cliente</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Barbeiro *</label>
                                    <select
                                        required
                                        value={form.barberId}
                                        onChange={e => setForm(f => ({ ...f, barberId: e.target.value }))}
                                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-secondary/60 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/50 transition-all"
                                    >
                                        <option value="" disabled>Selecione um barbeiro</option>
                                        {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Seleção Moderna de Serviços */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs text-muted-foreground font-medium">
                                        Serviços *
                                    </label>
                                    {form.serviceIds.length > 0 && (
                                        <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                                            {form.serviceIds.length} selecionado{form.serviceIds.length > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1.5 rounded-xl border border-border/80 bg-background/40">
                                    {services.length === 0 ? (
                                        <p className="col-span-2 text-xs text-muted-foreground text-center py-4">Nenhum serviço cadastrado.</p>
                                    ) : (
                                        services.map(s => {
                                            const isSelected = form.serviceIds.includes(s.id);
                                            return (
                                                <div
                                                    key={s.id}
                                                    onClick={() => {
                                                        setForm(f => {
                                                            const newIds = isSelected 
                                                                ? f.serviceIds.filter(id => id !== s.id) 
                                                                : [...f.serviceIds, s.id];
                                                            const newPrice = newIds.reduce((sum, id) => {
                                                                const svc = services.find(x => x.id === id);
                                                                return sum + (svc ? Number(svc.price) : 0);
                                                            }, 0);
                                                            return { ...f, serviceIds: newIds, price: newPrice };
                                                        });
                                                    }}
                                                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all duration-150 select-none ${
                                                        isSelected 
                                                            ? 'bg-primary/15 border-primary/60 text-foreground ring-1 ring-primary/30 shadow-sm' 
                                                            : 'bg-card/60 border-border/60 text-muted-foreground hover:bg-secondary/70 hover:text-foreground hover:border-border'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0 pr-1">
                                                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                                                            isSelected 
                                                                ? 'bg-primary border-primary text-primary-foreground' 
                                                                : 'border-muted-foreground/30 bg-secondary/40'
                                                        }`}>
                                                            {isSelected && (
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                    <polyline points="20 6 9 17 4 12" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <span className="font-medium text-foreground truncate">{s.name}</span>
                                                    </div>
                                                    <span className={`font-semibold shrink-0 px-2 py-0.5 rounded-md text-[11px] ${
                                                        isSelected ? 'bg-primary/25 text-primary' : 'bg-secondary text-muted-foreground'
                                                    }`}>
                                                        R$ {Number(s.price).toFixed(2)}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Data e Hora */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Data *</label>
                                    <DatePicker
                                        value={form.date}
                                        onChange={val => setForm(f => ({ ...f, date: val }))}
                                        triggerClassName="w-full h-10 px-3 rounded-xl border border-border bg-secondary/60 text-foreground text-sm hover:bg-secondary/80"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                                        {loadingTimes ? 'Carregando horários...' : availableTimes.length === 0 && form.date ? 'Sem horários livres' : 'Horário *'}
                                    </label>
                                    <TimePicker
                                        value={form.time}
                                        onChange={val => setForm(f => ({ ...f, time: val }))}
                                        placeholder="Selecione o horário"
                                        times={availableTimes}
                                        triggerClassName="w-full h-10 px-3 rounded-xl border border-border bg-secondary/60 text-foreground text-sm hover:bg-secondary/80"
                                    />
                                </div>
                            </div>

                            {/* Valor e Status */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Valor Total (R$)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.price}
                                        onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                                        className="w-full h-10 px-3 py-2 rounded-xl border border-border bg-secondary/60 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/50 transition-all font-semibold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Status</label>
                                    <Select value={form.status} onValueChange={val => setForm(f => ({ ...f, status: val }))}>
                                        <SelectTrigger className="w-full h-10 px-3 rounded-xl border border-border bg-secondary/60 text-foreground text-sm hover:bg-secondary/80">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STATUSES.map(s => (
                                                <SelectItem key={s} value={s}>
                                                    {STATUS_LABELS[s].label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Observações */}
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Observações</label>
                                <textarea
                                    rows={2}
                                    value={form.notes}
                                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                    placeholder="Observações adicionais ou preferências do cliente..."
                                    className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/60 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/50 transition-all resize-none"
                                />
                            </div>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex justify-end gap-3 pt-3 border-t border-border/80">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-60 shadow-lg shadow-primary/20"
                            >
                                {saving ? 'Salvando...' : editId ? 'Salvar alterações' : 'Criar agendamento'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            <ConfirmDialog 
                open={!!deleteId} 
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Excluir Agendamento?"
                description="Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita e ele não aparecerá mais na agenda."
                onConfirm={handleDelete}
                confirmText="Excluir Agendamento"
            />
        </div>
    );
}
