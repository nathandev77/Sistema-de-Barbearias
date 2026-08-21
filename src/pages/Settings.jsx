import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchApi } from '@/api/base44Client';
import { Loader2, Save } from 'lucide-react';

const DAYS = [
    { value: '0', label: 'Domingo' },
    { value: '1', label: 'Segunda-feira' },
    { value: '2', label: 'Terça-feira' },
    { value: '3', label: 'Quarta-feira' },
    { value: '4', label: 'Quinta-feira' },
    { value: '5', label: 'Sexta-feira' },
    { value: '6', label: 'Sábado' },
];

export default function Settings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedDays, setSelectedDays] = useState([]);

    const loadSettings = async () => {
        try {
            const data = await fetchApi('/tenant/settings');
            if (data.workingDays) {
                setSelectedDays(data.workingDays.split(','));
            }
        } catch (error) {
            console.error("Erro ao carregar configurações:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const toggleDay = (dayValue) => {
        if (selectedDays.includes(dayValue)) {
            setSelectedDays(selectedDays.filter(d => d !== dayValue));
        } else {
            setSelectedDays([...selectedDays, dayValue]);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetchApi('/tenant/settings', {
                method: 'PUT',
                body: JSON.stringify({ workingDays: selectedDays.join(',') })
            });
            alert('Configurações salvas com sucesso!');
        } catch (error) {
            alert('Erro ao salvar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Configurações da Barbearia</h2>
                <p className="text-sm text-muted-foreground mt-1">Gerencie dias de funcionamento e outras preferências globais.</p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm p-6"
            >
                <h3 className="text-lg font-semibold text-foreground mb-4">Dias de Funcionamento</h3>
                <p className="text-sm text-muted-foreground mb-6">
                    Selecione os dias da semana em que a barbearia estará aberta. O robô de agendamentos não oferecerá horários nos dias desmarcados.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {DAYS.map(day => {
                        const isSelected = selectedDays.includes(day.value);
                        return (
                            <button
                                key={day.value}
                                onClick={() => toggleDay(day.value)}
                                className={`flex items-center justify-between p-4 rounded-xl border text-sm font-medium transition-all ${
                                    isSelected 
                                    ? 'bg-primary/10 border-primary/50 text-primary' 
                                    : 'bg-secondary/50 border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                                }`}
                            >
                                <span>{day.label}</span>
                                <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-background border border-muted'
                                }`}>
                                    {isSelected && (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-8 flex justify-end">
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-70"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
