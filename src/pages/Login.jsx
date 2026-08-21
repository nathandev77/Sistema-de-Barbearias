import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { TypingText, TypingTextCursor } from '@/components/animate-ui/primitives/texts/typing';
import Beams from '@/components/ui/Beams';
import { 
    Sparkles, Building2, CreditCard, ArrowRight, ShieldCheck, 
    CheckCircle2, Lock, KeyRound, AlertCircle, Eye, EyeOff, Scissors, Mail, Check
} from 'lucide-react';
import { auth } from '@/api/base44Client';

// ─── Input com ícone ──────────────────────────────────────────────────────────
function Input({ id, type, value, onChange, placeholder, icon, rightElement, required = true, disabled = false }) {
    return (
        <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors duration-200">
                {icon}
            </div>
            <input
                id={id}
                type={type}
                required={required}
                disabled={disabled}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                style={{
                    background: disabled ? 'rgba(20, 20, 25, 0.3)' : 'rgba(20, 20, 25, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: disabled ? 'hsl(210 10% 60%)' : 'hsl(210 20% 95%)',
                    borderRadius: '12px',
                    padding: '13px 44px',
                    paddingRight: rightElement ? '44px' : '16px',
                    fontSize: '14px',
                    width: '100%',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={e => {
                    if (!disabled) {
                        e.target.style.borderColor = 'hsl(217 91% 60%)';
                        e.target.style.boxShadow = '0 0 0 3px hsl(217 91% 60% / 0.12)';
                    }
                }}
                onBlur={e => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.boxShadow = 'none';
                }}
            />
            {rightElement && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    {rightElement}
                </div>
            )}
        </div>
    );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
function Logo() {
    return (
        <div className="flex items-center justify-center gap-3 mb-6">
            <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: 'hsl(217 91% 60%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 24px hsl(217 91% 60% / 0.4)',
            }}>
                <Scissors style={{ width: 22, height: 22, color: '#fff' }} />
            </div>
            <div>
                <p style={{ fontSize: 19, fontWeight: 700, color: 'hsl(210 20% 95%)', lineHeight: 1.2, fontFamily: 'var(--font-heading)' }}>
                    Barber Control
                </p>
                <div style={{ fontSize: 11, color: 'hsl(220 10% 50%)', letterSpacing: '0.05em', height: 16 }}>
                    <TypingText
                        delay={0.5}
                        holdDelay={3000}
                        loop={true}
                        text="Gestão & Controle de Barbearias"
                    >
                        <TypingTextCursor />
                    </TypingText>
                </div>
            </div>
        </div>
    );
}

export default function Login() {
    const { loginAdmin, firstAccessChangePassword } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Modes: 'login' | 'register' | 'firstAccess'
    const [mode, setMode] = useState('login');

    // Login state
    const [email, setEmail] = useState(searchParams.get('email') || '');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isTrialExpiredError, setIsTrialExpiredError] = useState(false);

    // Register Trial State (Nome da Barbearia + Email)
    const [barbershopName, setBarbershopName] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerSuccess, setRegisterSuccess] = useState(null);

    // First Access Change Password State
    const [tempPassword, setTempPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);

    useEffect(() => {
        const queryEmail = searchParams.get('email');
        if (queryEmail) {
            setEmail(queryEmail);
        }
    }, [searchParams]);

    // Password requirements check
    const passwordChecks = useMemo(() => ({
        length: newPassword.length >= 8,
        upper: /[A-Z]/.test(newPassword),
        lower: /[a-z]/.test(newPassword),
        number: /[0-9]/.test(newPassword),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(newPassword),
        match: newPassword && newPassword === confirmPassword
    }), [newPassword, confirmPassword]);

    const isNewPasswordValid = passwordChecks.length && 
                               passwordChecks.upper && 
                               passwordChecks.lower && 
                               passwordChecks.number && 
                               passwordChecks.special && 
                               passwordChecks.match;

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsTrialExpiredError(false);
        setLoading(true);

        try {
            const res = await loginAdmin(email.trim().toLowerCase(), password);

            if (res?.mustChangePassword) {
                // Ativar modo de primeiro acesso obrigatório
                setTempPassword(password);
                setMode('firstAccess');
                setError('');
                return;
            }

            navigate('/admin');
        } catch (err) {
            const msg = err?.message || '';
            if (msg.includes('TRIAL_EXPIRED') || msg.toLowerCase().includes('teste de 4 dias expirou')) {
                setIsTrialExpiredError(true);
                setError('Seu período de teste de 4 dias encerrou. Escolha um plano para reativar seu acesso.');
            } else if (msg.toLowerCase().includes('muitas tentativas') || msg.toLowerCase().includes('rate') || msg.includes('429')) {
                setError('Muitas tentativas de login. Aguarde alguns instantes e tente novamente.');
            } else if (msg.toLowerCase().includes('bloqueado') || msg.toLowerCase().includes('inativa')) {
                setError('Acesso bloqueado. Entre em contato com o suporte ou escolha um plano.');
            } else if (msg) {
                setError(msg);
            } else {
                setError('E-mail ou senha inválidos. Verifique suas credenciais.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterTrial = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!barbershopName.trim() || barbershopName.trim().length < 2) {
                throw new Error('Informe o nome da barbearia.');
            }
            if (!registerEmail.trim() || !registerEmail.includes('@')) {
                throw new Error('Informe um e-mail válido.');
            }

            const response = await auth.registerTrial({
                barbershopName: barbershopName.trim(),
                email: registerEmail.trim().toLowerCase()
            });

            setRegisterSuccess(response);
            setEmail(registerEmail.trim().toLowerCase());
        } catch (err) {
            setError(err.message || 'Erro ao gerar cadastro de teste grátis.');
        } finally {
            setLoading(false);
        }
    };

    const handleFirstAccessPasswordChange = async (e) => {
        e.preventDefault();
        setError('');

        if (!isNewPasswordValid) {
            setError('A nova senha deve cumprir todos os requisitos de segurança e ser confirmada.');
            return;
        }

        setLoading(true);

        try {
            await firstAccessChangePassword(
                email.trim().toLowerCase(),
                tempPassword,
                newPassword
            );

            navigate('/admin');
        } catch (err) {
            setError(err.message || 'Erro ao redefinir a senha no primeiro acesso.');
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

    return (
        <div style={{
            minHeight: '100vh',
            background: 'hsl(220 15% 6%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Interactive Background Animation */}
            {etherBackground}

            {/* Card */}
            <div style={{
                width: '100%',
                maxWidth: 460,
                background: 'rgba(15, 17, 21, 0.55)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                border: '1px solid rgba(255, 255, 255, 0.09)',
                borderRadius: 28,
                padding: '36px 32px',
                boxShadow: '0 32px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                position: 'relative',
                zIndex: 10,
            }}>
                {/* Logo */}
                <Logo />

                {/* Mode Tabs (Only when not in First Access forced mode) */}
                {mode !== 'firstAccess' && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        background: 'rgba(0, 0, 0, 0.4)',
                        padding: 4,
                        borderRadius: 14,
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        marginBottom: 24
                    }}>
                        <button
                            type="button"
                            onClick={() => { setMode('login'); setError(''); setRegisterSuccess(null); }}
                            style={{
                                padding: '9px 12px',
                                borderRadius: 10,
                                border: 'none',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: mode === 'login' ? 'hsl(217 91% 60%)' : 'transparent',
                                color: mode === 'login' ? '#fff' : 'hsl(220 10% 60%)',
                                boxShadow: mode === 'login' ? '0 2px 10px hsl(217 91% 60% / 0.3)' : 'none'
                            }}
                        >
                            Entrar
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMode('register'); setError(''); }}
                            style={{
                                padding: '9px 12px',
                                borderRadius: 10,
                                border: 'none',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                                background: mode === 'register' ? 'hsl(217 91% 60%)' : 'transparent',
                                color: mode === 'register' ? '#fff' : 'hsl(220 10% 60%)',
                                boxShadow: mode === 'register' ? '0 2px 10px hsl(217 91% 60% / 0.3)' : 'none'
                            }}
                        >
                            <Sparkles style={{ width: 13, height: 13 }} /> Teste Grátis (4d)
                        </button>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════ */}
                {/* 1. LOGIN FORM */}
                {/* ═══════════════════════════════════════════════════════ */}
                {mode === 'login' && (
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label htmlFor="login-email" style={{ fontSize: 11, fontWeight: 600, color: 'hsl(220 10% 50%)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                E-mail de Acesso
                            </label>
                            <Input
                                id="login-email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                icon={<Mail style={{ width: 16, height: 16 }} />}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label htmlFor="login-password" style={{ fontSize: 11, fontWeight: 600, color: 'hsl(220 10% 50%)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                    Senha (ou Senha Provisória do E-mail)
                                </label>
                            </div>
                            <Input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                icon={<Lock style={{ width: 16, height: 16 }} />}
                                rightElement={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        tabIndex={-1}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(220 10% 50%)', padding: 4, lineHeight: 0 }}
                                    >
                                        {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                                    </button>
                                }
                            />
                        </div>

                        {error && (
                            <div style={{
                                display: 'flex', flexDirection: 'column', gap: 8,
                                padding: '12px 14px', borderRadius: 12,
                                background: isTrialExpiredError ? 'hsl(45 93% 47% / 0.12)' : 'hsl(0 72% 51% / 0.1)',
                                border: `1px solid ${isTrialExpiredError ? 'hsl(45 93% 47% / 0.3)' : 'hsl(0 72% 51% / 0.2)'}`,
                                color: isTrialExpiredError ? 'hsl(45 93% 70%)' : 'hsl(0 72% 70%)', fontSize: 13,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                                    <span>{error}</span>
                                </div>
                                {isTrialExpiredError && (
                                    <Link
                                        to="/planos?reason=expired"
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                            marginTop: 4, padding: '8px 12px', background: 'hsl(45 93% 47%)',
                                            color: '#000', fontWeight: 700, borderRadius: 8, textDecoration: 'none', fontSize: 12
                                        }}
                                    >
                                        <CreditCard style={{ width: 14, height: 14 }} /> Escolher um Plano para Reativar
                                    </Link>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', padding: '13px',
                                borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                                background: 'hsl(217 91% 60%)',
                                color: '#fff', fontSize: 14, fontWeight: 700,
                                letterSpacing: '0.03em',
                                boxShadow: '0 4px 18px hsl(217 91% 60% / 0.35)',
                                opacity: loading ? 0.6 : 1,
                                transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                marginTop: 4,
                            }}
                        >
                            {loading ? (
                                <>
                                    <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                    Acessando...
                                </>
                            ) : 'Entrar no Painel'}
                        </button>
                    </form>
                )}

                {/* ═══════════════════════════════════════════════════════ */}
                {/* 2. REGISTER TRIAL FORM */}
                {/* ═══════════════════════════════════════════════════════ */}
                {mode === 'register' && !registerSuccess && (
                    <form onSubmit={handleRegisterTrial} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: 'hsl(220 10% 50%)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                Nome da Barbearia *
                            </label>
                            <Input
                                id="reg-barbershop"
                                type="text"
                                value={barbershopName}
                                onChange={e => setBarbershopName(e.target.value)}
                                placeholder="Ex: Barbearia Estilo & Arte"
                                icon={<Building2 style={{ width: 16, height: 16 }} />}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: 'hsl(220 10% 50%)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                Seu Melhor E-mail *
                            </label>
                            <Input
                                id="reg-email"
                                type="email"
                                value={registerEmail}
                                onChange={e => setRegisterEmail(e.target.value)}
                                placeholder="seuemail@gmail.com"
                                icon={<Mail style={{ width: 16, height: 16 }} />}
                            />
                            <p style={{ fontSize: 11, color: 'hsl(220 10% 55%)', marginTop: 2 }}>
                                Enviaremos a senha provisória de acesso para este e-mail.
                            </p>
                        </div>

                        {/* Security notice */}
                        <div style={{
                            padding: '10px 12px',
                            background: 'rgba(37, 99, 235, 0.1)',
                            border: '1px solid rgba(37, 99, 235, 0.25)',
                            borderRadius: 10,
                            fontSize: 12,
                            color: '#93c5fd',
                            display: 'flex',
                            gap: 8,
                            alignItems: 'flex-start'
                        }}>
                            <ShieldCheck style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1, color: '#38bdf8' }} />
                            <span>
                                <strong>4 Dias Grátis:</strong> No seu primeiro login, o sistema solicitará que você troque a senha recebida por uma definitiva.
                            </span>
                        </div>

                        {error && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '11px 14px', borderRadius: 10,
                                background: 'hsl(0 72% 51% / 0.1)',
                                border: '1px solid hsl(0 72% 51% / 0.2)',
                                color: 'hsl(0 72% 70%)', fontSize: 13,
                            }}>
                                <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', padding: '13px',
                                borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                                background: 'hsl(217 91% 60%)',
                                color: '#fff', fontSize: 14, fontWeight: 700,
                                letterSpacing: '0.03em',
                                boxShadow: '0 4px 18px hsl(217 91% 60% / 0.35)',
                                opacity: loading ? 0.6 : 1,
                                transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                marginTop: 4,
                            }}
                        >
                            {loading ? (
                                <>
                                    <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                    Criando e enviando e-mail...
                                </>
                            ) : 'Receber Acesso por E-mail →'}
                        </button>
                    </form>
                )}

                {/* ═══════════════════════════════════════════════════════ */}
                {/* 2.1 REGISTER TRIAL SUCCESS */}
                {/* ═══════════════════════════════════════════════════════ */}
                {mode === 'register' && registerSuccess && (
                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                        <div style={{
                            width: 54, height: 54, borderRadius: 18,
                            background: 'rgba(34, 197, 94, 0.15)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            color: '#4ade80',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px auto'
                        }}>
                            <CheckCircle2 style={{ width: 28, height: 28 }} />
                        </div>

                        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                            Acesso Enviado! 🎉
                        </h3>
                        <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5, marginBottom: 20 }}>
                            Enviamos a senha provisória da barbearia <strong>{registerSuccess.barbershopName}</strong> para:
                            <br />
                            <span style={{ color: '#38bdf8', fontFamily: 'monospace', fontWeight: 600 }}>{registerSuccess.email}</span>
                        </p>

                        <div style={{
                            padding: '12px 14px',
                            background: 'rgba(37, 99, 235, 0.1)',
                            border: '1px solid rgba(37, 99, 235, 0.25)',
                            borderRadius: 12,
                            fontSize: 13,
                            color: '#93c5fd',
                            textAlign: 'left',
                            marginBottom: 16,
                            display: 'flex',
                            gap: 10,
                            alignItems: 'center'
                        }}>
                            <Mail style={{ width: 18, height: 18, flexShrink: 0, color: '#38bdf8' }} />
                            <span>Sua <strong>senha temporária</strong> foi enviada para o seu e-mail.</span>
                        </div>

                        <div style={{
                            padding: '10px 12px',
                            background: 'rgba(234, 179, 8, 0.1)',
                            border: '1px solid rgba(234, 179, 8, 0.2)',
                            borderRadius: 10,
                            fontSize: 12,
                            color: '#fef08a',
                            textAlign: 'left',
                            marginBottom: 20
                        }}>
                            🔒 <strong>Primeiro Acesso:</strong> Copie a senha do seu e-mail para fazer o login. O sistema solicitará a troca obrigatória para sua nova senha pessoal.
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setMode('login');
                                setRegisterSuccess(null);
                            }}
                            style={{
                                width: '100%', padding: '13px',
                                borderRadius: 12, border: 'none', cursor: 'pointer',
                                background: 'hsl(217 91% 60%)',
                                color: '#fff', fontSize: 14, fontWeight: 700,
                                boxShadow: '0 4px 18px hsl(217 91% 60% / 0.35)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            }}
                        >
                            Fazer Login com a Senha Recebida →
                        </button>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════ */}
                {/* 3. FIRST ACCESS MANDATORY PASSWORD CHANGE */}
                {/* ═══════════════════════════════════════════════════════ */}
                {mode === 'firstAccess' && (
                    <form onSubmit={handleFirstAccessPasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{
                            padding: '12px 14px',
                            background: 'rgba(234, 179, 8, 0.12)',
                            border: '1px solid rgba(234, 179, 8, 0.3)',
                            borderRadius: 14,
                            marginBottom: 4
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fef08a', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                                <KeyRound style={{ width: 16, height: 16, color: '#facc15' }} />
                                <span>Primeiro Acesso Obrigatório</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 12, color: '#fef9c3', lineHeight: 1.4 }}>
                                Para garantir a segurança da sua conta, defina sua nova <strong>senha definitiva</strong> antes de acessar o painel.
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: 'hsl(220 10% 50%)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                E-mail
                            </label>
                            <Input
                                id="first-email"
                                type="email"
                                disabled={true}
                                value={email}
                                onChange={() => {}}
                                icon={<Mail style={{ width: 16, height: 16 }} />}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: 'hsl(220 10% 50%)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                Nova Senha Definitiva *
                            </label>
                            <Input
                                id="first-new-password"
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="Crie sua nova senha"
                                icon={<Lock style={{ width: 16, height: 16 }} />}
                                rightElement={
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(v => !v)}
                                        tabIndex={-1}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(220 10% 50%)', padding: 4, lineHeight: 0 }}
                                    >
                                        {showNewPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                                    </button>
                                }
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: 'hsl(220 10% 50%)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                Confirmar Nova Senha *
                            </label>
                            <Input
                                id="first-confirm-password"
                                type={showNewPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Repita a nova senha"
                                icon={<Lock style={{ width: 16, height: 16 }} />}
                            />
                        </div>

                        {/* Password criteria indicator */}
                        <div style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: 12,
                            padding: '10px 12px',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '6px 12px',
                            fontSize: 11
                        }}>
                            <div style={{ color: passwordChecks.length ? '#4ade80' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span>{passwordChecks.length ? '✓' : '•'} Mínimo 8 caracteres</span>
                            </div>
                            <div style={{ color: passwordChecks.upper ? '#4ade80' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span>{passwordChecks.upper ? '✓' : '•'} 1 Maiúscula (A-Z)</span>
                            </div>
                            <div style={{ color: passwordChecks.lower ? '#4ade80' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span>{passwordChecks.lower ? '✓' : '•'} 1 Minúscula (a-z)</span>
                            </div>
                            <div style={{ color: passwordChecks.number ? '#4ade80' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span>{passwordChecks.number ? '✓' : '•'} 1 Número (0-9)</span>
                            </div>
                            <div style={{ color: passwordChecks.special ? '#4ade80' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span>{passwordChecks.special ? '✓' : '•'} 1 Especial (!@#$)</span>
                            </div>
                            <div style={{ color: passwordChecks.match ? '#4ade80' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span>{passwordChecks.match ? '✓' : '•'} Senhas coincidem</span>
                            </div>
                        </div>

                        {error && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '11px 14px', borderRadius: 10,
                                background: 'hsl(0 72% 51% / 0.1)',
                                border: '1px solid hsl(0 72% 51% / 0.2)',
                                color: 'hsl(0 72% 70%)', fontSize: 13,
                            }}>
                                <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !isNewPasswordValid}
                            style={{
                                width: '100%', padding: '13px',
                                borderRadius: 12, border: 'none', cursor: (loading || !isNewPasswordValid) ? 'not-allowed' : 'pointer',
                                background: isNewPasswordValid ? 'hsl(217 91% 60%)' : 'rgba(255, 255, 255, 0.1)',
                                color: isNewPasswordValid ? '#fff' : 'hsl(220 10% 50%)',
                                fontSize: 14, fontWeight: 700,
                                letterSpacing: '0.03em',
                                boxShadow: isNewPasswordValid ? '0 4px 18px hsl(217 91% 60% / 0.35)' : 'none',
                                opacity: loading ? 0.6 : 1,
                                transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                marginTop: 4,
                            }}
                        >
                            {loading ? (
                                <>
                                    <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                    Salvando e entrando...
                                </>
                            ) : 'Salvar Nova Senha e Entrar →'}
                        </button>
                    </form>
                )}

                {/* Footer links */}
                <div style={{
                    marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 12, color: 'hsl(220 10% 50%)'
                }}>
                    <Link to="/planos" style={{ color: 'hsl(217 91% 65%)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CreditCard style={{ width: 13, height: 13 }} /> Planos & Assinaturas
                    </Link>
                </div>
            </div>

            {/* Spin keyframe */}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
