import React, { useEffect, useState, useMemo } from 'react';
import { Appointment, Client, Barber } from '@/api/base44Client';
import { TypingText } from '@/components/animate-ui/primitives/texts/typing';
import { Select } from '@/components/ui/OldSelect';
import { DatePicker } from '@/components/ui/DatePicker';

// ─── Ícones ───────────────────────────────────────────────────────────────────
const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);
const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
const DollarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const TrendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);
const PersonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);
const FilterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
    </svg>
);
// ─── Gráfico SVG de área ──────────────────────────────────────────────────────
function AreaChart({ data, labels }) {
    const W = 580, H = 180, PAD = { top: 24, right: 16, bottom: 28, left: 8 };
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    if (!data || data.length === 0) return null;

    const max = Math.max(...data, 1);
    const step = data.length > 1 ? innerW / (data.length - 1) : 0;

    const pts = data.map((v, i) => ({
        x: PAD.left + i * step,
        y: PAD.top + (1 - v / max) * innerH,
    }));

    const pathD = pts.length === 1
        ? `M ${PAD.left} ${pts[0].y} L ${PAD.left + innerW} ${pts[0].y}`
        : pts.reduce((acc, pt, i) => {
            if (i === 0) return `M ${pt.x} ${pt.y}`;
            const prev = pts[i - 1];
            const cpX = (prev.x + pt.x) / 2;
            return `${acc} C ${cpX} ${prev.y}, ${cpX} ${pt.y}, ${pt.x} ${pt.y}`;
        }, '');

    const lastX = pts[pts.length - 1].x;
    const firstX = pts[0].x;
    const fillD = `${pathD} L ${lastX} ${PAD.top + innerH} L ${firstX} ${PAD.top + innerH} Z`;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
            <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(217,91%,60%)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="hsl(217,91%,60%)" stopOpacity="0.02" />
                </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75, 1].map(v => (
                <line
                    key={v}
                    x1={PAD.left} y1={PAD.top + (1 - v) * innerH}
                    x2={PAD.left + innerW} y2={PAD.top + (1 - v) * innerH}
                    stroke="hsl(220,12%,16%)" strokeWidth="1"
                />
            ))}
            <path d={fillD} fill="url(#areaGrad)" />
            <path d={pathD} fill="none" stroke="hsl(217,91%,60%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((pt, i) => {
                const val = data[i];
                const formatted = val > 0
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val)
                    : null;
                const labelY = Math.max(PAD.top + 2, pt.y - 10);
                return (
                    <g key={i}>
                        <circle cx={pt.x} cy={pt.y} r="4" fill="hsl(217,91%,60%)" stroke="hsl(220,15%,6%)" strokeWidth="2" />
                        {formatted && (
                            <>
                                <rect x={pt.x - 26} y={labelY - 13} width="52" height="14" rx="4" fill="hsl(220,15%,8%)" fillOpacity="0.9" />
                                <text x={pt.x} y={labelY - 2} textAnchor="middle" fontSize="10" fontWeight="600" fill="hsl(217,91%,80%)" fontFamily="Inter, sans-serif">
                                    {formatted}
                                </text>
                            </>
                        )}
                    </g>
                );
            })}
            {labels.map((lbl, i) => (
                <text key={i} x={PAD.left + i * step} y={H - 4} textAnchor="middle" fontSize="11" fill="hsl(220,10%,50%)" fontFamily="Inter, sans-serif">
                    {lbl}
                </text>
            ))}
        </svg>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon }) {
    return (
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 hover:border-primary/20 transition-colors">
            <div className="flex items-start justify-between">
                <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">{label}</p>
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-3xl font-bold text-foreground leading-none">{value}</p>
                {sub && <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>}
            </div>
        </div>
    );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    agendado:   { label: 'Agendado',   cls: 'bg-primary/15 text-primary border border-primary/30' },
    confirmado: { label: 'Confirmado', cls: 'bg-green-500/15 text-green-400 border border-green-500/30' },
    concluido:  { label: 'Concluído',  cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
    cancelado:  { label: 'Cancelado',  cls: 'bg-destructive/15 text-destructive border border-destructive/30' },
};

// ─── Gera lista de últimos 12 meses ──────────────────────────────────────────
function getPeriodOptions() {
    const options = [
        { value: 'hoje', label: 'Hoje' },
        { value: '7dias', label: 'Últimos 7 dias' },
        { value: '30dias', label: 'Últimos 30 dias' }
    ];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const value = d.toISOString().slice(0, 7); // 'YYYY-MM'
        const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return options;
}

// ─── Dashboard Principal ──────────────────────────────────────────────────────
export default function Dashboard() {
    const [allAppointments, setAllAppointments] = useState([]);
    const [clients, setClients] = useState([]);
    const [barbers, setBarbers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filtros
    const periodOptions = useMemo(() => getPeriodOptions(), []);
    const [selectedPeriod, setSelectedPeriod] = useState(periodOptions[0].value);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedBarber, setSelectedBarber] = useState('todos');

    const fmt = (val) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

    // Carrega dados uma única vez
    useEffect(() => {
        const load = async () => {
            try {
                const [appts, cls, brbs] = await Promise.all([
                    Appointment.list(),
                    Client.list(),
                    Barber.list(),
                ]);
                setAllAppointments(appts);
                setClients(cls);
                setBarbers(brbs);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // ── Métricas calculadas a partir dos filtros ──────────────────────────────
    const metrics = useMemo(() => {
        if (allAppointments.length === 0 && !loading) return null;
        if (loading) return null;

        const getLocalYYYYMMDD = (date) => {
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        };

        const now = new Date();
        const today = getLocalYYYYMMDD(now);
        
        const d7 = new Date(now);
        d7.setDate(d7.getDate() - 7);
        const last7Days = getLocalYYYYMMDD(d7);
        
        const d30 = new Date(now);
        d30.setDate(d30.getDate() - 30);
        const last30Days = getLocalYYYYMMDD(d30);

        // Aplica filtro de barbeiro
        const byBarber = selectedBarber === 'todos'
            ? allAppointments
            : allAppointments.filter(a => a.barber_name === selectedBarber);

        // Período selecionado
        const PAID_STATUS = ['concluido', 'confirmado'];
        const periodAppts = byBarber.filter(a => {
            if (!a.date) return false;
            if (selectedDate) return a.date === selectedDate;
            if (selectedPeriod === 'hoje') return a.date === today;
            if (selectedPeriod === '7dias') return a.date >= last7Days && a.date <= today;
            if (selectedPeriod === '30dias') return a.date >= last30Days && a.date <= today;
            return a.date.startsWith(selectedPeriod);
        });
        const periodConcluded = periodAppts.filter(a => PAID_STATUS.includes(a.status));
        const periodRevenue = periodConcluded.reduce((s, a) => s + (Number(a.price) || 0), 0);
        const periodCount = periodConcluded.length;
        const avgTicket = periodCount > 0 ? Math.round(periodRevenue / periodCount) : 0;

        // Hoje (sempre fixo para o primeiro card de métrica, mas filtrado por barbeiro)
        const todayAppts = byBarber.filter(a => a.date === today);
        const todayConcluded = todayAppts.filter(a => PAID_STATUS.includes(a.status)).length;

        // Gráfico:
        const chartData = [];
        const chartLabels = [];
        const DAY_NAMES = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

        if (selectedDate) {
            const rev = byBarber
                .filter(a => a.date === selectedDate && PAID_STATUS.includes(a.status))
                .reduce((s, a) => s + (Number(a.price) || 0), 0);
            chartData.push(rev);
            const [y, m, d] = selectedDate.split('-');
            chartLabels.push(`${d}/${m}`);
        } else if (selectedPeriod === 'hoje' || selectedPeriod === '7dias') {
            // Últimos 7 dias
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const ds = getLocalYYYYMMDD(d);
                const rev = byBarber
                    .filter(a => a.date === ds && PAID_STATUS.includes(a.status))
                    .reduce((s, a) => s + (Number(a.price) || 0), 0);
                chartData.push(rev);
                chartLabels.push(DAY_NAMES[d.getDay()]);
            }
        } else if (selectedPeriod === '30dias') {
            // Últimas 4 semanas
            for (let w = 3; w >= 0; w--) {
                const end = new Date();
                end.setDate(end.getDate() - (w * 7));
                const start = new Date(end);
                start.setDate(start.getDate() - 6);
                const startStr = getLocalYYYYMMDD(start);
                const endStr = getLocalYYYYMMDD(end);
                
                const rev = byBarber.filter(a => a.date >= startStr && a.date <= endStr && PAID_STATUS.includes(a.status))
                    .reduce((s, a) => s + (Number(a.price) || 0), 0);
                chartData.push(rev);
                chartLabels.push(`Sem ${4 - w}`);
            }
        } else {
            // Agrupa por semana do mês selecionado (4 semanas)
            for (let w = 0; w < 4; w++) {
                const startDay = w * 7 + 1;
                const endDay = w * 7 + 7;
                const rev = periodConcluded.filter(a => {
                    const day = parseInt(a.date?.slice(8, 10) || '0');
                    return day >= startDay && day <= endDay;
                }).reduce((s, a) => s + (Number(a.price) || 0), 0);
                chartData.push(rev);
                chartLabels.push(`S${w + 1}`);
            }
        }

        // Próximos agendamentos de hoje
        const upcoming = todayAppts
            .filter(a => a.status !== 'cancelado')
            .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

        return {
            todayCount: todayAppts.length,
            todayConcluded,
            clientsTotal: clients.length,
            periodRevenue,
            periodCount,
            avgTicket,
            chartData,
            chartLabels,
            upcoming,
        };
    }, [allAppointments, clients, selectedPeriod, selectedDate, selectedBarber, loading]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const d = metrics || {
        todayCount: 0, todayConcluded: 0, clientsTotal: 0,
        periodRevenue: 0, periodCount: 0, avgTicket: 0,
        chartData: [], chartLabels: [], upcoming: [],
    };

    const activeFilters = selectedBarber !== 'todos';

    return (
        <div className="space-y-7 w-full">
            {/* ── Cabeçalho + Filtros ── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        <TypingText delay={0.1} holdDelay={4000} loop={false} text="Dashboard" />
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Visão geral da sua barbearia</p>
                </div>

                {/* Filtros */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <FilterIcon />
                        <span className="text-xs font-medium">Filtros:</span>
                    </div>

                    {/* Filtro de data específica */}
                    <div className="w-36">
                        <DatePicker
                            value={selectedDate}
                            onChange={setSelectedDate}
                            placeholder="Data Exata"
                        />
                    </div>

                    {/* Filtro de período */}
                    <Select
                        value={selectedPeriod}
                        onChange={setSelectedPeriod}
                        options={periodOptions}
                        triggerClassName={`px-3 py-2 rounded-xl border border-border bg-secondary text-sm text-foreground focus:ring-2 focus:ring-primary/30 ${selectedDate ? 'opacity-50 pointer-events-none' : ''}`}
                    />

                    {/* Filtro de barbeiro */}
                    <Select
                        value={selectedBarber}
                        onChange={setSelectedBarber}
                        options={[
                            { value: 'todos', label: 'Todos os barbeiros' },
                            ...barbers.map(b => ({ value: b.name, label: b.name }))
                        ]}
                        triggerClassName="px-3 py-2 rounded-xl border border-border bg-secondary text-sm text-foreground focus:ring-2 focus:ring-primary/30"
                    />

                    {/* Badge de filtro ativo */}
                    {activeFilters && (
                        <button
                            onClick={() => setSelectedBarber('todos')}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/15 text-primary text-xs font-semibold hover:bg-primary/25 transition-colors"
                        >
                            {selectedBarber}
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Agendamentos Hoje"
                    value={d.todayCount}
                    sub={`${d.todayConcluded} concluído${d.todayConcluded !== 1 ? 's' : ''}`}
                    icon={<CalendarIcon />}
                />
                <StatCard
                    label="Clientes Total"
                    value={d.clientsTotal}
                    sub={null}
                    icon={<UsersIcon />}
                />
                <StatCard
                    label="Faturamento"
                    value={fmt(d.periodRevenue)}
                    sub={`${d.periodCount} atendimento${d.periodCount !== 1 ? 's' : ''} concluídos`}
                    icon={<DollarIcon />}
                />
                <StatCard
                    label="Ticket Médio"
                    value={fmt(d.avgTicket)}
                    sub={selectedBarber !== 'todos' ? selectedBarber : 'Todos os barbeiros'}
                    icon={<TrendIcon />}
                />
            </div>

            {/* ── Gráfico + Próximos ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* Gráfico */}
                <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-6">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Faturamento</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {selectedDate ? `Dia ${selectedDate.split('-').reverse().join('/')}` : selectedPeriod === 'hoje' || selectedPeriod === '7dias' ? 'Últimos 7 dias' : selectedPeriod === '30dias' ? 'Últimas 4 semanas' : 'Por semana do mês'}
                                {selectedBarber !== 'todos' && ` · ${selectedBarber}`}
                            </p>
                        </div>
                        <span className="text-2xl font-bold text-primary">{fmt(d.periodRevenue)}</span>
                    </div>
                    <div className="h-44 w-full">
                        {d.chartData.every(v => v === 0) ? (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-sm text-muted-foreground">Nenhum faturamento no período</p>
                            </div>
                        ) : (
                            <AreaChart data={d.chartData} labels={d.chartLabels} />
                        )}
                    </div>
                </div>

                {/* Próximos Agendamentos */}
                <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 flex flex-col">
                    <div className="mb-5">
                        <h2 className="text-lg font-bold text-foreground">Próximos</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Agendamentos do dia{selectedBarber !== 'todos' ? ` · ${selectedBarber}` : ''}
                        </p>
                    </div>

                    {d.upcoming.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-8">
                            <CalendarIcon />
                            <p className="text-sm text-muted-foreground">Nenhum agendamento hoje</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1">
                            {d.upcoming.map((appt) => {
                                const st = STATUS_CONFIG[appt.status] || STATUS_CONFIG.agendado;
                                return (
                                    <div
                                        key={appt.id}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                                            <PersonIcon />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate">{appt.client_name || '—'}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {appt.service_name || '—'}
                                                {appt.barber_name && <span className="text-primary/70"> · {appt.barber_name}</span>}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                            <span className="text-sm font-bold text-primary">{appt.time || '—'}</span>
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
