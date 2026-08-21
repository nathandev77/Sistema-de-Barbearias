import React, { useEffect, useState, useMemo } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import LiquidEther from '@/components/animate-ui/primitives/animate/LiquidEther';

export default function ClientLayout() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { clientUser, logoutClient } = useAuth();
    const [barbershopName, setBarbershopName] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('base44_client_token');
        const user = localStorage.getItem('base44_auth_client');
        
        if (!token || !user) {
            navigate(`/${slug}/login`, { replace: true });
        } else {
            // Busca o nome da barbearia pela rota real
            const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';
            fetch(`${API_URL}/auth/tenant/${slug}`)
                .then(res => res.json())
                .then(data => { if (data?.name) setBarbershopName(data.name); })
                .catch(() => setBarbershopName(slug));
        }
    }, [slug, navigate, clientUser]);

    if (!clientUser || clientUser.barbershopSlug !== slug) {
        return null; // previne renderização antes do redirecionamento
    }

    const etherBackground = useMemo(() => (
        <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
            <LiquidEther
                colors={['#5227FF', '#FF9FFC', '#B497CF']}
                mouseForce={20}
                cursorSize={100}
                isViscous
                viscous={30}
                iterationsViscous={32}
                iterationsPoisson={32}
                resolution={0.5}
                isBounce={false}
                autoDemo
                autoSpeed={0.5}
                autoIntensity={2.2}
                takeoverDuration={0.25}
                autoResumeDelay={3000}
                autoRampDuration={0.6}
            />
        </div>
    ), []);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'hsl(220 15% 6%)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* Interactive Background Animation */}
            {etherBackground}

            {/* Header */}
            <header style={{
                position: 'relative', zIndex: 10,
                padding: '20px 24px',
                background: 'rgba(15, 17, 21, 0.4)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'hsl(217 91% 60%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 15px hsl(217 91% 60% / 0.35)',
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 18, height: 18, color: '#fff' }} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9.5 4a1 1 0 0 0-.8.4L5.25 9H4a1 1 0 1 0 0 2h.585l.839 9.226A2 2 0 0 0 7.416 22h9.168a2 2 0 0 0 1.992-1.774L19.415 11H20a1 1 0 1 0 0-2h-1.25L15.3 4.4A1 1 0 0 0 14.5 4h-5zm-.972 5 2.222-2.857h2.5L15.472 9H8.528z" />
                        </svg>
                    </div>
                    <div>
                        <p style={{ fontSize: 16, fontWeight: 700, color: 'hsl(210 20% 95%)', lineHeight: 1.2 }}>
                            {barbershopName || 'Barbearia'}
                        </p>
                        <p style={{ fontSize: 11, color: 'hsl(220 10% 60%)' }}>Área do Cliente</p>
                    </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: 13, color: 'hsl(210 20% 95%)' }}>Olá, {clientUser?.full_name?.split(' ')[0] || 'Cliente'}</span>
                    <button
                        onClick={logoutClient}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff', fontSize: 12, padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                        }}
                    >
                        Sair
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main style={{ position: 'relative', zIndex: 10, flex: 1, padding: '32px 16px', overflowY: 'auto' }}>
                <Outlet />
            </main>
        </div>
    );
}
