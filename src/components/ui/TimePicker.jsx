import React, { useState, useRef, useEffect } from 'react';

const DEFAULT_TIMES = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', 
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', 
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', 
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

export function TimePicker({ value, onChange, placeholder = "hh:mm", className = "", triggerClassName = "", times = DEFAULT_TIMES, align = "left" }) {
    const [open, setOpen] = useState(false);
    const ref = useRef();

    useEffect(() => {
        function handleClickOutside(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (t) => {
        onChange(t);
        setOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={ref}>
            <button 
                type="button"
                onClick={() => setOpen(!open)}
                className={triggerClassName || `w-full appearance-none px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer flex justify-between items-center gap-3 ${value ? 'bg-primary/10 border-primary/30 text-primary font-medium' : 'bg-secondary text-muted-foreground hover:bg-white/5'}`}
            >
                <span>{value || placeholder}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 opacity-70 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>

            {open && (
                <div className={`absolute top-full mt-2 z-50 w-64 p-4 bg-card border border-border rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-100 ${align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Horários</p>
                        {value && (
                            <button type="button" onClick={() => { onChange(''); setOpen(false); }} className="text-[10px] text-destructive hover:underline font-medium">Limpar</button>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                        {times.map((t) => {
                            const isSelected = value === t;
                            return (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => handleSelect(t)}
                                    className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                                        isSelected 
                                            ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                                            : 'bg-secondary text-foreground hover:bg-white/10 hover:scale-105 border border-border/50'
                                    }`}
                                >
                                    {t}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
