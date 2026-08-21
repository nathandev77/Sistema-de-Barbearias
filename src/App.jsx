import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Agenda from '@/pages/Agenda';
import Historico from '@/pages/Historico';
import Clients from '@/pages/Clients';
import Services from '@/pages/Services';
import Barbers from '@/pages/Barbers';
import Sales from '@/pages/Sales';
import Vendas from '@/pages/Vendas';
import ControleGeral from '@/pages/ControleGeral';
import ProductsStore from '@/pages/ProductsStore';
import Products from '@/pages/Products';
import Plans from '@/pages/Plans';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';

import ClientLayout from '@/components/layout/ClientLayout';
import ClientLogin from '@/pages/ClientLogin';
import ClientPortal from '@/pages/ClientPortal';

import SaasLogin from '@/pages/SaasAdmin/SaasLogin';
import SaasDashboard from '@/pages/SaasAdmin/SaasDashboard';
import PricingPlans from '@/pages/PricingPlans';

const AuthenticatedApp = () => {
    const { isLoadingAuth, isLoadingPublicSettings, adminUser } = useAuth();

    if (isLoadingPublicSettings || isLoadingAuth) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <Routes>
            {/* ── SAAS PUBLIC PRICING & CHECKOUT ── */}
            <Route path="/planos" element={<PricingPlans />} />
            <Route path="/assinar" element={<PricingPlans />} />

            {/* ── ADMIN ROUTES ── */}
            <Route path="/admin/login" element={!adminUser ? <Login /> : <Navigate to="/admin" replace />} />

            {adminUser ? (
                <Route path="/admin" element={<AppLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="agenda" element={<Agenda />} />
                    <Route path="historico" element={<Historico />} />
                    <Route path="clientes" element={<Clients />} />
                    <Route path="servicos" element={<Services />} />
                    <Route path="barbeiros" element={<Barbers />} />
                    <Route path="vendas" element={<Vendas />} />
                    <Route path="controle" element={<ControleGeral />} />
                    <Route path="pdv" element={<ProductsStore />} />
                    <Route path="produtos" element={<Products />} />
                    <Route path="planos" element={<Plans />} />
                    <Route path="configuracoes" element={<Settings />} />
                </Route>
            ) : (
                <Route path="/admin/*" element={<Navigate to="/admin/login" replace />} />
            )}

            {/* ── CLIENT ROUTES ── */}
            <Route path="/:slug/login" element={<ClientLogin />} />
            <Route path="/:slug" element={<ClientLayout />}>
                <Route index element={<ClientPortal />} />
            </Route>

            {/* ── SAAS OWNER ROUTES ── */}
            <Route path="/saas-admin/login" element={<SaasLogin />} />
            <Route path="/saas-admin" element={
                localStorage.getItem('saas_master_key')
                    ? <SaasDashboard />
                    : <Navigate to="/saas-admin/login" replace />
            } />

            {/* Default redirects */}
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="*" element={<PageNotFound />} />
        </Routes>
    );
};

function App() {
    return (
        <AuthProvider>
            <QueryClientProvider client={queryClientInstance}>
                <Toaster>
                    <Router>
                        <AuthenticatedApp />
                    </Router>
                </Toaster>
            </QueryClientProvider>
        </AuthProvider>
    )
}

export default App