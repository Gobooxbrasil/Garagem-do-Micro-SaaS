import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { session } = useAuth();
    const location = useLocation();

    if (!session) {
        // Redirect to landing page, preserving the intended destination
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
