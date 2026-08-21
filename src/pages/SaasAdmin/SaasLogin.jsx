import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, KeyRound, Loader2, AlertCircle } from 'lucide-react';
import { fetchSaas } from '@/lib/saas-client';

export default function SaasLogin() {
    const [key, setKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Temporariamente salvamos a chave para fazer o teste
            localStorage.setItem('saas_master_key', key);
            
            // Fazemos uma chamada rápida para testar a chave
            await fetchSaas('/saas/dashboard');
            
            navigate('/saas-admin');
        } catch (err) {
            localStorage.removeItem('saas_master_key');
            setError('Acesso Negado: Chave Mestra inválida ou ocorreu um erro.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black overflow-hidden relative">
            {/* Background Animations */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse delay-1000"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="z-10 w-full max-w-md p-8"
            >
                <div className="bg-card/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
                    
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20 shadow-lg shadow-primary/10">
                            <Shield className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Barber Control</h1>
                        <p className="text-xs font-semibold tracking-wider uppercase text-primary/80 mt-1">Painel Master & Gestão Global</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1 flex items-center gap-2">
                                <KeyRound className="w-4 h-4 text-primary" /> Master Key
                            </label>
                            <input
                                type="password"
                                placeholder="Insira a chave de acesso..."
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 text-white placeholder:text-gray-500 h-12 rounded-xl focus:border-primary/50 focus:ring-primary/50 px-4"
                                required
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="flex items-center justify-center w-full h-12 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Autenticando...
                                </>
                            ) : (
                                "Acessar Painel"
                            )}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
