import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function ProtectedRoute() {
    const { user, isLoadingAuth } = useAuth();

    if (isLoadingAuth) return null;

    if (!user) return <Navigate to="/" replace />;

    return <Outlet />;
}
