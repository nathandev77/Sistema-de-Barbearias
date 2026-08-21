import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Appointment } from '@/api/base44Client';
import { playNotificationSound, requestNotificationPermission, showDesktopNotification } from '@/utils/sound';
import { formatBRL, formatDate } from '@/lib/formatters';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
} from '@/components/ui/dropdown-menu';

const NAV_ITEMS = [
    {
        to: '/admin',
        label: 'Dashboard',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        to: '/admin/agenda',
        label: 'Agenda',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
    },
    {
        to: '/admin/historico',
        label: 'Histórico',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    {
        to: '/admin/clientes',
        label: 'Clientes',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
    {
        to: '/admin/servicos',
        label: 'Serviços',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
        ),
    },
    {
        to: '/admin/pdv',
        label: 'Loja',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
    },
    {
        to: '/admin/produtos',
        label: 'Estoque',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
        ),
    },
    {
        to: '/admin/barbeiros',
        label: 'Barbeiros',
        group: 'financeiro',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
    },
    {
        to: '/admin/planos',
        label: 'Planos',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
        ),
    },
    {
        to: '/admin/vendas',
        label: 'Vendas',
        group: 'financeiro',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
    },
    {
        to: '/admin/controle',
        label: 'Controle Geral',
        group: 'financeiro',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
    },
    {
        to: '/admin/configuracoes',
        label: 'Configurações',
        group: 'sistema',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
];

export default function AppLayout() {
    const { adminUser, logoutAdmin } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // ── Notificações em Tempo Real ──────────────────────────────────────────
    const [soundEnabled, setSoundEnabled] = useState(() => {
        return localStorage.getItem('barber_sound_enabled') !== 'false';
    });
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [activeBanner, setActiveBanner] = useState(null);
    const knownApptIdsRef = useRef(new Set());
    const isInitialLoadRef = useRef(true);

    const toggleSound = () => {
        setSoundEnabled(prev => {
            const next = !prev;
            localStorage.setItem('barber_sound_enabled', String(next));
            return next;
        });
    };

    const handleEnableDesktop = async () => {
        const granted = await requestNotificationPermission();
        if (granted) {
            showDesktopNotification('Notificações Ativadas! 🔔', {
                body: 'Você receberá alertas aqui sempre que um novo corte for agendado.'
            });
        }
    };

    const testAlert = () => {
        playNotificationSound();
        showDesktopNotification('✂️ Teste de Notificação!', {
            body: 'Som e alerta de agendamento funcionando perfeitamente!'
        });
        setActiveBanner({
            id: 'test',
            client_name: 'Cliente Teste',
            barber_name: 'Lucas Silva',
            service_name: 'Corte + Barba',
            date: new Date().toISOString().split('T')[0],
            time: '15:30',
            price: 55.00
        });
        setTimeout(() => setActiveBanner(null), 7000);
    };

    // Polling contínuo a cada 8 segundos
    useEffect(() => {
        let isMounted = true;

        const checkNewAppointments = async () => {
            try {
                const appts = await Appointment.list();
                if (!isMounted) return;

                if (isInitialLoadRef.current) {
                    appts.forEach(a => knownApptIdsRef.current.add(a.id));
                    isInitialLoadRef.current = false;
                    return;
                }

                // Identifica novos agendamentos criados
                const newIncoming = appts.filter(a => 
                    !knownApptIdsRef.current.has(a.id) && 
                    (a.status === 'agendado' || a.status === 'confirmado')
                );

                if (newIncoming.length > 0) {
                    newIncoming.forEach(a => knownApptIdsRef.current.add(a.id));

                    // Toca o sino de notificação
                    if (soundEnabled) {
                        playNotificationSound();
                    }

                    const latest = newIncoming[0];

                    // Notificação Desktop / Sistema Operacional
                    showDesktopNotification(`✂️ Novo Agendamento (${latest.barber_name})!`, {
                        body: `${latest.client_name} agendou para ${formatDate(latest.date)} às ${latest.time} (${formatBRL(latest.price)})`
                    });

                    // Banner Flutuante no Topo
                    setActiveBanner(latest);
                    setTimeout(() => {
                        if (isMounted) setActiveBanner(null);
                    }, 8000);

                    // Adiciona à lista da central de notificações
                    setNotifications(prev => [
                        ...newIncoming.map(a => ({
                            ...a,
                            timestamp: new Date()
                        })),
                        ...prev
                    ].slice(0, 20));

                    setUnreadCount(prev => prev + newIncoming.length);
                }
            } catch (err) {
                // Silencioso para não poluir console em perda de conexão momentânea
            }
        };

        checkNewAppointments();
        const intervalId = setInterval(checkNewAppointments, 8000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [soundEnabled]);

    const markAllAsRead = () => {
        setUnreadCount(0);
        setNotifications([]);
        setActiveBanner(null);
    };

    const handleNotificationClick = (index) => {
        setNotifications(prev => prev.filter((_, i) => i !== index));
        setUnreadCount(prev => Math.max(0, prev - 1));
        setActiveBanner(null);
        navigate('/admin/agenda');
    };

    const handleDismissNotification = (e, index) => {
        e.stopPropagation();
        setNotifications(prev => prev.filter((_, i) => i !== index));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    // Quando o usuário entra na Agenda, zera o contador de notificações automaticamente
    useEffect(() => {
        if (location.pathname === '/admin/agenda' || location.pathname === '/admin/agenda/') {
            setUnreadCount(0);
        }
    }, [location.pathname]);

    const currentPage = NAV_ITEMS.find(item =>
        item.to === '/admin' ? location.pathname === '/admin' || location.pathname === '/admin/' : location.pathname.startsWith(item.to)
    );

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Overlay mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col
                    bg-sidebar-background border-r border-sidebar-border
                    transform transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
                    <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.5 2.1L13 7H9l3.5 5H10l-3.5-5L4 12l2.5 5H9l3.5-5 3.5 5h2.5L15 12l3.5-5h-2l-1.5-4.9z"/>
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-sidebar-foreground font-heading tracking-wide">Controle Gestão</p>
                        <p className="text-xs text-muted-foreground">Gestão Profissional</p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    <p className="px-3 mb-2 text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Menu</p>
                    {NAV_ITEMS.filter(i => !i.group).map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/admin'}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                                ${isActive
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground border border-transparent'
                                }`
                            }
                        >
                            {item.icon}
                            {item.label}
                        </NavLink>
                    ))}
                    <p className="px-3 mb-2 mt-5 text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Financeiro</p>
                    {NAV_ITEMS.filter(i => i.group === 'financeiro').map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                                ${isActive
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground border border-transparent'
                                }`
                            }
                        >
                            {item.icon}
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* User */}
                <div className="px-3 py-4 border-t border-sidebar-border">
                    <div className="flex items-center gap-3 px-3 py-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-primary">
                                {adminUser?.full_name?.[0] ?? 'A'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-sidebar-foreground truncate">
                                {adminUser?.full_name ?? 'Administrador'}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">{adminUser?.email ?? ''}</p>
                        </div>
                        <button
                            onClick={logoutAdmin}
                            title="Sair"
                            className="text-muted-foreground hover:text-foreground transition-colors p-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top bar */}
                <header className="relative flex items-center justify-between gap-4 px-6 py-3.5 border-b border-border bg-card/60 backdrop-blur-md flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            className="lg:hidden text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary/60 transition-colors"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h1 className="text-base font-semibold text-foreground">
                            {currentPage?.label ?? 'Página'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Central de Notificações com Sino */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    onClick={markAllAsRead}
                                    className="relative p-2 rounded-xl border border-border/80 bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer outline-none select-none group"
                                    title="Notificações de Agendamentos"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>

                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg animate-pulse">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 bg-card/98 backdrop-blur-xl border border-border shadow-2xl z-50 rounded-2xl overflow-hidden">
                                {/* Cabeçalho da Central */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-border/80 bg-secondary/30">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-foreground">Central de Alertas</span>
                                        {notifications.length > 0 && (
                                            <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                                {notifications.length}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {/* Botão de Ligar/Desligar Som */}
                                        <button
                                            type="button"
                                            onClick={toggleSound}
                                            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                                                soundEnabled 
                                                    ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20' 
                                                    : 'bg-secondary border-border text-muted-foreground hover:bg-secondary/80'
                                            }`}
                                            title={soundEnabled ? 'Som ativado (Clique para silenciar)' : 'Som mudo (Clique para ativar)'}
                                        >
                                            {soundEnabled ? '🔊 Som Ativo' : '🔇 Mudo'}
                                        </button>
                                    </div>
                                </div>

                                {/* Ações rápidas */}
                                <div className="grid grid-cols-2 gap-1.5 p-2 bg-secondary/15 border-b border-border/60 text-xs">
                                    <button
                                        type="button"
                                        onClick={testAlert}
                                        className="py-1.5 px-2 rounded-lg bg-secondary/60 hover:bg-secondary text-foreground text-center font-medium transition-colors border border-border/50 flex items-center justify-center gap-1.5"
                                    >
                                        <span>🔔 Testar Alerta</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleEnableDesktop}
                                        className="py-1.5 px-2 rounded-lg bg-secondary/60 hover:bg-secondary text-foreground text-center font-medium transition-colors border border-border/50 flex items-center justify-center gap-1.5"
                                    >
                                        <span>🖥️ Notif. Desktop</span>
                                    </button>
                                </div>

                                {/* Lista de Notificações */}
                                <div className="max-h-72 overflow-y-auto divide-y divide-border/40">
                                    {notifications.length === 0 ? (
                                        <div className="p-6 text-center text-muted-foreground">
                                            <div className="w-10 h-10 rounded-full bg-secondary/60 flex items-center justify-center mx-auto mb-2 opacity-60">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                                </svg>
                                            </div>
                                            <p className="text-xs font-medium">Nenhum novo agendamento pendente</p>
                                            <p className="text-[11px] text-muted-foreground/70 mt-0.5">Tudo limpo! O sistema avisará com som e alerta assim que um cliente agendar.</p>
                                        </div>
                                    ) : (
                                        notifications.map((n, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => handleNotificationClick(idx)}
                                                className="p-3 hover:bg-secondary/50 transition-colors cursor-pointer flex items-start gap-3 group relative"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                                                    ✂️
                                                </div>
                                                <div className="flex-1 min-w-0 pr-6">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <p className="text-xs font-bold text-foreground truncate">{n.client_name}</p>
                                                        <span className="text-[10px] font-semibold text-primary">{formatBRL(n.price)}</span>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground truncate">
                                                        Barbeiro: <strong className="text-foreground">{n.barber_name}</strong>
                                                    </p>
                                                    <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground/80">
                                                        <span>📅 {formatDate(n.date)} às {n.time}</span>
                                                        <span className="text-primary font-medium group-hover:underline">Ver na Agenda →</span>
                                                    </div>
                                                </div>
                                                {/* Botão de marcar individual como lida / dispensar */}
                                                <button
                                                    type="button"
                                                    title="Marcar como lida"
                                                    onClick={(e) => handleDismissNotification(e, idx)}
                                                    className="absolute top-2.5 right-2.5 p-1 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-secondary transition-all"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {notifications.length > 0 && (
                                    <div className="p-2.5 border-t border-border/80 bg-secondary/20 flex justify-between items-center text-xs">
                                        <button
                                            type="button"
                                            onClick={markAllAsRead}
                                            className="text-muted-foreground hover:text-foreground text-[11px] font-medium hover:underline"
                                        >
                                            Marcar todas como lidas
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                markAllAsRead();
                                                navigate('/admin/agenda');
                                            }}
                                            className="font-semibold text-primary hover:underline text-[11px] flex items-center gap-1"
                                        >
                                            Ir para Agenda completa <span>→</span>
                                        </button>
                                    </div>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Indicador Online */}
                        <div className="flex items-center gap-2 pl-2 border-l border-border/80">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-muted-foreground hidden sm:inline">Online</span>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {/* Banner de Teste Grátis (Trial) */}
                    {adminUser?.barbershop?.subscriptionStatus === 'trial' && (
                        <div className="mb-6 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
                            <div className="flex items-center gap-2.5">
                                <span className="text-base">⏳</span>
                                <div>
                                    <strong className="text-amber-300 font-bold">Você está utilizando o período de teste grátis (4 dias)!</strong>
                                    {adminUser?.barbershop?.trialDaysRemaining !== null && (
                                        <span className="text-amber-200/80 ml-1">
                                            ({adminUser.barbershop.trialDaysRemaining} {adminUser.barbershop.trialDaysRemaining === 1 ? 'dia restante' : 'dias restantes'})
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Link 
                                to="/planos"
                                className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all shrink-0"
                            >
                                Contratar Plano Definitivo →
                            </Link>
                        </div>
                    )}

                    <Outlet />
                </main>
            </div>

            {/* Banner Flutuante de Notificação em Tempo Real (Global Fixed / Top Layer) */}
            {activeBanner && (
                <div 
                    onClick={() => { navigate('/admin/agenda'); setActiveBanner(null); }}
                    className="fixed top-5 right-5 z-[999999] max-w-sm w-[calc(100vw-2.5rem)] sm:w-96 bg-card/95 backdrop-blur-xl border-2 border-primary/60 shadow-[0_25px_60px_rgba(0,0,0,0.85)] rounded-2xl p-4 animate-in slide-in-from-top-4 fade-in duration-300 cursor-pointer hover:scale-[1.02] transition-all bg-gradient-to-br from-card via-card to-primary/15"
                >
                    <div className="flex items-start gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-primary/20 text-primary flex items-center justify-center shrink-0 text-2xl shadow-inner animate-bounce">
                            🔔
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Novo Agendamento!</span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setActiveBanner(null); }}
                                    className="text-muted-foreground hover:text-foreground text-sm p-1 hover:bg-secondary/60 rounded-lg transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                            <p className="text-sm font-bold text-foreground mt-0.5 truncate">{activeBanner.client_name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                com <strong className="text-foreground">{activeBanner.barber_name}</strong> • {formatDate(activeBanner.date)} às <strong>{activeBanner.time}</strong>
                            </p>
                            <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-border/80 text-xs">
                                <span className="font-bold text-primary text-sm">{formatBRL(activeBanner.price)}</span>
                                <span className="text-primary font-semibold hover:underline flex items-center gap-1">
                                    Abrir Agenda <span>→</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
