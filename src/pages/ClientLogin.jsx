import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import Beams from '@/components/ui/Beams';

const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

// ── Ícones ────────────────────────────────────────────────────────────────────
const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);
const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);
const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
);
const AlertIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
);
const ScissorsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9.5 4a1 1 0 0 0-.8.4L5.25 9H4a1 1 0 1 0 0 2h.585l.839 9.226A2 2 0 0 0 7.416 22h9.168a2 2 0 0 0 1.992-1.774L19.415 11H20a1 1 0 1 0 0-2h-1.25L15.3 4.4A1 1 0 0 0 14.5 4h-5zm-.972 5 2.222-2.857h2.5L15.472 9H8.528z" />
    </svg>
);

// ── Input com ícone ────────────────────────────────────────────────────────────
function InputField({ id, type = 'text', value, onChange, placeholder, icon, required = true }) {
    return (
        <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors">
                {icon}
            </div>
            <input
                id={id}
                type={type}
                required={required}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                style={{
                    background: 'rgba(20, 20, 25, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'hsl(210 20% 95%)',
                    borderRadius: '12px',
                    padding: '13px 16px 13px 44px',
                    fontSize: '14px',
                    width: '100%',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={e => {
                    e.target.style.borderColor = 'hsl(217 91% 60%)';
                    e.target.style.boxShadow = '0 0 0 3px hsl(217 91% 60% / 0.12)';
                }}
                onBlur={e => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.boxShadow = 'none';
                }}
            />
        </div>
    );
}

export default function ClientLogin() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { clientUser } = useAuth();

    const [barbershop, setBarbershop] = useState(null);
    const [shopNotFound, setShopNotFound] = useState(false);
    const [tab, setTab] = useState('login'); // 'login' | 'register'

    // Login state
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register state
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPhone, setRegPhone] = useState('');
    const [regPassword, setRegPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Já está logado nesta barbearia → redireciona
    useEffect(() => {
        if (localStorage.getItem('clientToken') && localStorage.getItem('clientId')) {
            navigate(`/${slug}`, { replace: true });
        }
    }, [clientUser, slug, navigate]);

    // Busca dados da barbearia
    useEffect(() => {
        fetch(`${API_URL}/auth/tenant/${slug}`)
            .then(async res => {
                if (!res.ok) throw new Error('not found');
                return res.json();
            })
            .then(setBarbershop)
            .catch(() => setShopNotFound(true));
    }, [slug]);

    const saveClientSession = (data) => {
        localStorage.setItem('base44_client_token', data.token);
        const clientToStore = {
            id: data.client.id,
            email: data.client.email,
            full_name: data.client.name,
            role: 'client',
            barbershopSlug: slug,
            barbershopId: data.barbershop.id,
        };
        localStorage.setItem('base44_auth_client', JSON.stringify(clientToStore));
        return clientToStore;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/portal/${slug}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: loginEmail, password: loginPassword })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao entrar');
            saveClientSession(data);
            window.location.href = `/${slug}`;
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/portal/${slug}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: regName, email: regEmail, phone: regPhone, password: regPassword })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao criar conta');
            saveClientSession(data);
            window.location.href = `/${slug}`;
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const etherBackground = useMemo(() => (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <Beams 
                beamWidth={3}
                beamHeight={30}
                beamNumber={20}
                lightColor="#ffffff"
                speed={2}
                noiseIntensity={1.75}
                scale={0.2}
                rotation={30}
            />
        </div>
    ), []);

    if (shopNotFound) {
        return (
            <div style={{ minHeight: '100vh', background: 'hsl(220 15% 6%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: '#fff' }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Barbearia não encontrada</h1>
                    <p style={{ color: 'hsl(220 10% 60%)', fontSize: 14 }}>O link que você acessou não existe ou foi alterado.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'hsl(220 15% 6%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px 16px', position: 'relative', overflow: 'hidden',
        }}>
            {etherBackground}

            <div style={{
                width: '100%', maxWidth: 420,
                background: 'rgba(15, 17, 21, 0.45)',
                backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 24, padding: '40px 36px',
                boxShadow: '0 32px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                position: 'relative', zIndex: 10,
            }}>
                {/* Logo + Nome da Barbearia */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{
                        width: 52, height: 52, borderRadius: 16,
                        background: 'hsl(217 91% 60%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                        boxShadow: '0 0 24px hsl(217 91% 60% / 0.4)',
                    }}>
                        <span style={{ color: '#fff' }}><ScissorsIcon /></span>
                    </div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                        {barbershop ? barbershop.name : '...'}
                    </h1>
                    <p style={{ fontSize: 13, color: 'hsl(220 10% 55%)' }}>Área do Cliente · Agende seu horário</p>
                </div>

                {/* Tabs Login / Cadastro */}
                <div style={{
                    display: 'flex', gap: 4,
                    background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 4, marginBottom: 28,
                }}>
                    {['login', 'register'].map(t => (
                        <button
                            key={t}
                            onClick={() => { setTab(t); setError(''); }}
                            style={{
                                flex: 1, padding: '9px 0', borderRadius: 9, border: 'none',
                                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: tab === t ? 'hsl(217 91% 60%)' : 'transparent',
                                color: tab === t ? '#fff' : 'hsl(220 10% 55%)',
                                boxShadow: tab === t ? '0 4px 12px hsl(217 91% 60% / 0.3)' : 'none',
                            }}
                        >
                            {t === 'login' ? 'Entrar' : 'Criar Conta'}
                        </button>
                    ))}
                </div>

                {/* ── LOGIN FORM ── */}
                {tab === 'login' && (
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: 'hsl(220 10% 50%)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>E-mail</label>
                            <InputField id="login-email" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="seu@email.com" icon={<MailIcon />} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: 'hsl(220 10% 50%)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Senha</label>
                            <InputField id="login-password" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" icon={<LockIcon />} />
                        </div>

                        {error && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'hsl(0 72% 51% / 0.1)', border: '1px solid hsl(0 72% 51% / 0.2)', color: 'hsl(0 72% 70%)', fontSize: 13 }}>
                                <AlertIcon />{error}
                            </div>
                        )}

                        <button type="submit" disabled={loading} style={{ marginTop: 4, width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: 'hsl(217 91% 60%)', color: '#fff', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 18px hsl(217 91% 60% / 0.35)', opacity: loading ? 0.7 : 1, transition: 'all 0.2s' }}>
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>

                        <p style={{ textAlign: 'center', fontSize: 12, color: 'hsl(220 10% 50%)', marginTop: 4 }}>
                            Não tem conta?{' '}
                            <button type="button" onClick={() => setTab('register')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(217 91% 65%)', fontWeight: 600, fontSize: 12 }}>
                                Criar agora →
                            </button>
                        </p>
                    </form>
                )}

                {/* ── REGISTER FORM ── */}
                {tab === 'register' && (
                    <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: 'hsl(220 10% 50%)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Nome Completo</label>
                            <InputField id="reg-name" value={regName} onChange={e => setRegName(e.target.value)} placeholder="Seu nome" icon={<UserIcon />} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: 'hsl(220 10% 50%)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>E-mail</label>
                            <InputField id="reg-email" type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="seu@email.com" icon={<MailIcon />} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: 'hsl(220 10% 50%)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Telefone (opcional)</label>
                            <InputField id="reg-phone" type="tel" value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="(11) 99999-9999" icon={<PhoneIcon />} required={false} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: 'hsl(220 10% 50%)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Senha</label>
                            <InputField id="reg-password" type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="Mín. 6 caracteres" icon={<LockIcon />} />
                        </div>

                        {error && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'hsl(0 72% 51% / 0.1)', border: '1px solid hsl(0 72% 51% / 0.2)', color: 'hsl(0 72% 70%)', fontSize: 13 }}>
                                <AlertIcon />{error}
                            </div>
                        )}

                        <button type="submit" disabled={loading} style={{ marginTop: 4, width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: 'hsl(217 91% 60%)', color: '#fff', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 18px hsl(217 91% 60% / 0.35)', opacity: loading ? 0.7 : 1, transition: 'all 0.2s' }}>
                            {loading ? 'Criando conta...' : 'Criar Conta'}
                        </button>

                        <p style={{ textAlign: 'center', fontSize: 12, color: 'hsl(220 10% 50%)', marginTop: 4 }}>
                            Já tem conta?{' '}
                            <button type="button" onClick={() => setTab('login')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(217 91% 65%)', fontWeight: 600, fontSize: 12 }}>
                                Entrar →
                            </button>
                        </p>
                    </form>
                )}
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
