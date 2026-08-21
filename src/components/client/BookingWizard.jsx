import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Service, Barber, Appointment } from '@/api/base44Client';
import { AnimatePresence, motion } from 'framer-motion';
import { Select } from '@/components/ui/OldSelect';
import { DatePicker } from '@/components/ui/DatePicker';
import { TimePicker } from '@/components/ui/TimePicker';

export default function BookingWizard() {
    const { clientUser } = useAuth();
    
    const [step, setStep] = useState(1);
    
    const [services, setServices] = useState([]);
    const [barbers, setBarbers] = useState([]);
    
    const [selectedServices, setSelectedServices] = useState([]);
    const [selectedBarber, setSelectedBarber] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [availableTimes, setAvailableTimes] = useState([]);
    const [loadingTimes, setLoadingTimes] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (selectedBarber && selectedDate) {
            setLoadingTimes(true);
            setSelectedTime(''); // reseta a hora ao trocar a data
            Appointment.getAvailableSlots(selectedBarber.id, selectedDate)
                .then(setAvailableTimes)
                .catch(console.error)
                .finally(() => setLoadingTimes(false));
        } else {
            setAvailableTimes([]);
        }
    }, [selectedBarber, selectedDate]);

    useEffect(() => {
        Service.list({ is_active: true }).then(setServices);
        Barber.list({ is_active: true }).then(setBarbers);
    }, []);

    const handleConfirm = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
            await Appointment.create({
                clientId: clientUser.id,
                serviceIds: selectedServices.map(s => s.id),
                barberId: selectedBarber.id,
                date: selectedDate,
                time: selectedTime,
                price: totalPrice,
                status: 'agendado',
                notes: `Agendado pelo Portal do Cliente (${clientUser?.email})`
            });
            setSuccess(true);
        } catch (e) {
            console.error(e);
            setErrorMsg(e.message || 'Ocorreu um erro ao criar o agendamento.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(15, 17, 21, 0.6)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'hsl(142 71% 45% / 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 32, height: 32, color: 'hsl(142 71% 45%)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Agendamento Confirmado!</h2>
                <p style={{ color: 'hsl(220 10% 60%)', fontSize: 14 }}>Te esperamos no dia {selectedDate} às {selectedTime}.</p>
                <button 
                    onClick={() => { setStep(1); setSelectedServices([]); setSelectedBarber(null); setSelectedDate(''); setSelectedTime(''); setSuccess(false); }}
                    style={{ marginTop: 24, background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
                    Novo Agendamento
                </button>
            </div>
        );
    }

    return (
        <div style={{
            background: 'rgba(15, 17, 21, 0.4)',
            backdropFilter: 'blur(32px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 24,
            padding: '32px',
        }}>
            {/* Header / Steps */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
                {[1, 2, 3, 4].map(s => (
                    <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: step >= s ? 'hsl(217 91% 60%)' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
                ))}
            </div>

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 16 }}>1. Escolha os Serviços</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            {services.map(s => {
                                const isSelected = selectedServices.some(sel => sel.id === s.id);
                                return (
                                    <div 
                                        key={s.id} 
                                        onClick={() => {
                                            if (isSelected) {
                                                setSelectedServices(prev => prev.filter(sel => sel.id !== s.id));
                                            } else {
                                                setSelectedServices(prev => [...prev, s]);
                                            }
                                        }}
                                        style={{ 
                                            padding: 16, borderRadius: 12, cursor: 'pointer',
                                            background: isSelected ? 'hsl(217 91% 60% / 0.15)' : 'rgba(0,0,0,0.2)',
                                            border: `1px solid ${isSelected ? 'hsl(217 91% 60%)' : 'rgba(255,255,255,0.05)'}`,
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{s.name}</div>
                                        <div style={{ fontSize: 13, color: 'hsl(220 10% 50%)', marginTop: 4 }}>R$ {s.price.toFixed(2)} • {s.duration_minutes} min</div>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ marginTop: 24, textAlign: 'right' }}>
                            <button 
                                disabled={selectedServices.length === 0}
                                onClick={() => setStep(2)}
                                style={{ background: 'hsl(217 91% 60%)', color: '#fff', padding: '12px 24px', borderRadius: 8, border: 'none', cursor: selectedServices.length > 0 ? 'pointer' : 'not-allowed', opacity: selectedServices.length > 0 ? 1 : 0.5, fontWeight: 600 }}>
                                Próximo Passo
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 16 }}>2. Escolha o Profissional</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            {barbers.map(b => (
                                <div 
                                    key={b.id} 
                                    onClick={() => setSelectedBarber(b)}
                                    style={{ 
                                        padding: 16, borderRadius: 12, cursor: 'pointer',
                                        background: selectedBarber?.id === b.id ? 'hsl(217 91% 60% / 0.15)' : 'rgba(0,0,0,0.2)',
                                        border: `1px solid ${selectedBarber?.id === b.id ? 'hsl(217 91% 60%)' : 'rgba(255,255,255,0.05)'}`,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{b.name}</div>
                                    <div style={{ fontSize: 13, color: 'hsl(220 10% 50%)', marginTop: 4 }}>Especialidade: {b.specialty}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
                            <button onClick={() => setStep(1)} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '12px 24px', borderRadius: 8, cursor: 'pointer' }}>Voltar</button>
                            <button 
                                disabled={!selectedBarber}
                                onClick={() => setStep(3)}
                                style={{ background: 'hsl(217 91% 60%)', color: '#fff', padding: '12px 24px', borderRadius: 8, border: 'none', cursor: selectedBarber ? 'pointer' : 'not-allowed', opacity: selectedBarber ? 1 : 0.5, fontWeight: 600 }}>
                                Próximo Passo
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 16 }}>3. Escolha Data e Hora</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'hsl(220 10% 60%)' }}>Data</label>
                                <DatePicker 
                                    value={selectedDate}
                                    onChange={setSelectedDate}
                                    placeholder="Data da reserva"
                                    triggerClassName="w-full flex justify-between items-center gap-2 bg-black/30 border border-white/10 text-white px-4 py-3 rounded-lg hover:bg-white/5 transition-all outline-none focus:border-primary/50"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'hsl(220 10% 60%)' }}>
                                    {loadingTimes ? 'Carregando horários...' : availableTimes.length === 0 && selectedDate ? 'Nenhum horário disponível' : 'Horário'}
                                </label>
                                <TimePicker
                                    value={selectedTime}
                                    onChange={setSelectedTime}
                                    placeholder="Horário da reserva"
                                    triggerClassName="w-full flex justify-between items-center gap-2 bg-black/30 border border-white/10 text-white px-4 py-3 rounded-lg hover:bg-white/5 transition-all outline-none focus:border-primary/50"
                                    times={availableTimes}
                                />
                            </div>
                        </div>
                        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
                            <button onClick={() => setStep(2)} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '12px 24px', borderRadius: 8, cursor: 'pointer' }}>Voltar</button>
                            <button 
                                disabled={!selectedDate || !selectedTime}
                                onClick={() => setStep(4)}
                                style={{ background: 'hsl(217 91% 60%)', color: '#fff', padding: '12px 24px', borderRadius: 8, border: 'none', cursor: (selectedDate && selectedTime) ? 'pointer' : 'not-allowed', opacity: (selectedDate && selectedTime) ? 1 : 0.5, fontWeight: 600 }}>
                                Resumo e Confirmação
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 4 && (
                    <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 16 }}>4. Confirmar Agendamento</h2>
                        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ color: 'hsl(220 10% 60%)' }}>Serviços</span>
                                <strong style={{ color: '#fff', textAlign: 'right' }}>
                                    {selectedServices.map(s => s.name).join(', ')} <br/>
                                    <span style={{ fontSize: 14, color: 'hsl(217 91% 60%)' }}>(Total: R$ {selectedServices.reduce((sum, s) => sum + s.price, 0).toFixed(2)})</span>
                                </strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ color: 'hsl(220 10% 60%)' }}>Profissional</span>
                                <strong style={{ color: '#fff' }}>{selectedBarber?.name}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'hsl(220 10% 60%)' }}>Data e Hora</span>
                                <strong style={{ color: '#fff' }}>{selectedDate} às {selectedTime}</strong>
                            </div>
                        </div>
                        {errorMsg && (
                            <div style={{ marginTop: 16, padding: 12, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 8, color: '#ef4444', fontSize: 14, textAlign: 'center' }}>
                                {errorMsg}
                            </div>
                        )}
                        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
                            <button disabled={loading} onClick={() => setStep(3)} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '12px 24px', borderRadius: 8, cursor: 'pointer' }}>Voltar</button>
                            <button 
                                disabled={loading}
                                onClick={handleConfirm}
                                style={{ background: 'hsl(142 71% 45%)', color: '#fff', padding: '12px 32px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                {loading ? 'Confirmando...' : 'Confirmar Agendamento'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
