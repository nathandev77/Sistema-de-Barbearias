import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth } from '@/api/base44Client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [adminUser, setAdminUser] = useState(null);
    const [clientUser, setClientUser] = useState(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);

    useEffect(() => {
        const initialize = async () => {
            try {
                // Simula carregamento de configurações públicas
                await new Promise(res => setTimeout(res, 200));
                setIsLoadingPublicSettings(false);

                const admin = await auth.getAdminUser();
                const client = await auth.getClientUser();
                
                setAdminUser(admin);
                setClientUser(client);
            } catch (err) {
                console.error("Auth init error:", err);
            } finally {
                setIsLoadingAuth(false);
            }
        };

        initialize();
    }, []);

    const loginAdmin = useCallback(async (email, password) => {
        const u = await auth.loginAdmin(email, password);
        if (u && !u.mustChangePassword) {
            setAdminUser(u);
        }
        return u;
    }, []);

    const firstAccessChangePassword = useCallback(async (email, tempPassword, newPassword) => {
        const u = await auth.firstAccessChangePassword({ email, tempPassword, newPassword });
        setAdminUser(u);
        return u;
    }, []);

    const loginClient = useCallback(async (email, password, barbershopId, barbershopSlug) => {
        const u = await auth.loginClient(email, password, barbershopId, barbershopSlug);
        setClientUser(u);
        return u;
    }, []);

    const logoutAdmin = useCallback(async () => {
        await auth.logoutAdmin();
        setAdminUser(null);
    }, []);

    const logoutClient = useCallback(async () => {
        await auth.logoutClient();
        setClientUser(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                adminUser,
                clientUser,
                isLoadingAuth,
                isLoadingPublicSettings,
                loginAdmin,
                firstAccessChangePassword,
                loginClient,
                logoutAdmin,
                logoutClient,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
