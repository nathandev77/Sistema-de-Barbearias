import React, { useState, useRef, useEffect } from 'react';

const DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function DatePicker({ value, onChange, placeholder = "dd/mm/aaaa", className = "", triggerClassName = "", align = "left" }) {
    const [open, setOpen] = useState(false);
    
    const getInitialMonth = () => {
        if (value) {
            const [y, m, d] = value.split('-');
            return new Date(y, m - 1, 1);
        }
        return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    };

    const [currentMonth, setCurrentMonth] = useState(getInitialMonth());
    const ref = useRef();

    useEffect(() => {
        setCurrentMonth(getInitialMonth());
    }, [value, open]); // reset month view to selected value when opening

    useEffect(() => {
        function handleClickOutside(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayIndex = currentMonth.getDay();

    const handlePrev = (e) => {
        e.stopPropagation();
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };
    
    const handleNext = (e) => {
        e.stopPropagation();
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleSelect = (day) => {
        const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dStr = String(d.getDate()).padStart(2, '0');
        onChange(`${y}-${m}-${dStr}`);
        setOpen(false);
    };

    const setToday = () => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dStr = String(d.getDate()).padStart(2, '0');
        onChange(`${y}-${m}-${dStr}`);
        setOpen(false);
    };

    const formattedValue = value ? value.split('-').reverse().join('/') : '';

    return (
        <div className={`relative ${className}`} ref={ref}>
            <button 
                type="button"
                onClick={() => setOpen(!open)}
                className={triggerClassName 
                    ? `flex items-center justify-between gap-2 whitespace-nowrap select-none cursor-pointer transition-all ${triggerClassName}`
                    : `w-full appearance-none px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer flex justify-between items-center gap-2.5 select-none ${value ? 'bg-primary/10 border-primary/30 text-primary font-medium' : 'bg-secondary text-muted-foreground hover:bg-white/5'}`
                }
            >
                <span className="truncate">{formattedValue || placeholder}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 opacity-70 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </button>

            {open && (
                <div className={`absolute top-full mt-2 z-50 w-[260px] p-4 bg-card border border-border rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-100 ${align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <button type="button" onClick={handlePrev} className="p-1.5 bg-secondary hover:bg-white/10 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <span className="text-sm font-bold text-foreground">
                            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </span>
                        <button type="button" onClick={handleNext} className="p-1.5 bg-secondary hover:bg-white/10 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {DAYS.map((d, i) => (
                            <div key={i} className="text-center text-[10px] font-bold text-muted-foreground uppercase">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: firstDayIndex }).map((_, i) => <div key={`empty-${i}`} />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const currentIterDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                            const y = currentIterDate.getFullYear();
                            const m = String(currentIterDate.getMonth() + 1).padStart(2, '0');
                            const dStr = String(day).padStart(2, '0');
                            const dateStr = `${y}-${m}-${dStr}`;
                            
                            const isSelected = value === dateStr;
                            const todayStr = new Date().toISOString().slice(0, 10);
                            const isToday = todayStr === dateStr;

                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => handleSelect(day)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-full text-[13px] transition-all ${
                                        isSelected 
                                            ? 'bg-primary text-primary-foreground font-bold shadow-md scale-105' 
                                            : isToday 
                                                ? 'bg-secondary border border-primary/30 text-primary font-bold'
                                                : 'text-foreground hover:bg-secondary hover:scale-105'
                                    }`}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                        <button type="button" onClick={() => { onChange(''); setOpen(false); }} className={`text-xs px-2 py-1 rounded hover:bg-secondary transition-colors ${value ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                            Limpar
                        </button>
                        <button type="button" onClick={setToday} className="text-xs px-3 py-1.5 bg-secondary hover:bg-white/10 text-primary font-bold rounded-lg transition-colors">
                            Hoje
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
