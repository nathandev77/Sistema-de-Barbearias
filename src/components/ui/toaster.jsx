import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within Toaster');
    return ctx;
}

let _toast = null;
export function toast(opts) {
    if (_toast) _toast(opts);
}

export function Toaster({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((opts) => {
        const id = Date.now();
        const t = { id, title: '', description: '', variant: 'default', ...opts };
        setToasts(prev => [...prev, t]);
        setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 4000);
    }, []);

    // Expose globally
    _toast = addToast;

    return (
        <ToastContext.Provider value={{ toast: addToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`pointer-events-auto min-w-[280px] max-w-sm rounded-xl border px-4 py-3 shadow-lg
                            animate-in fade-in slide-in-from-bottom-2 transition-all
                            ${t.variant === 'destructive'
                                ? 'bg-destructive text-destructive-foreground border-destructive/30'
                                : 'bg-card text-foreground border-border'
                            }`}
                    >
                        {t.title && <p className="text-sm font-semibold">{t.title}</p>}
                        {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
