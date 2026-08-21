import React from 'react';

export default function UserNotRegisteredError() {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-background gap-6 p-6">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8 text-destructive"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    />
                </svg>
            </div>
            <div className="text-center space-y-2 max-w-sm">
                <h1 className="text-xl font-semibold text-foreground">Acesso não autorizado</h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    Sua conta ainda não está cadastrada neste sistema. Entre em contato com o
                    administrador para liberar o seu acesso.
                </p>
            </div>
            <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors"
            >
                Tentar novamente
            </button>
        </div>
    );
}
