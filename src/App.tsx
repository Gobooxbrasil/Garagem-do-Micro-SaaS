import React, { useEffect } from 'react';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { ToastProvider } from './context/ToastContext';
import { AppRoutes } from './AppRoutes';

// Helper to detect subdomain
const getSubdomain = () => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');

    // If localhost or IP, no subdomain
    if (hostname === 'localhost' || hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        return null;
    }

    // If has subdomain (e.g., admin.garagemdemicrosaas.com.br)
    if (parts.length >= 3) {
        return parts[0]; // Returns 'admin', 'app', 'homolog', etc.
    }

    return null;
};

const SubdomainRouter: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const subdomain = getSubdomain();

    useEffect(() => {
        // Only redirect if we're on the root path
        if (location.pathname === '/') {
            if (subdomain === 'admin') {
                navigate('/admin', { replace: true });
            } else if (subdomain === 'app') {
                navigate('/ideas', { replace: true });
            } else if (subdomain === 'homolog') {
                // Homolog can show landing or ideas, keep as is
                // navigate('/ideas', { replace: true });
            }
            // Main domain (garagemdemicrosaas.com.br) stays on landing page
        }
    }, [subdomain, navigate, location.pathname]);

    return <AppRoutes />;
};

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider>
                    <SubdomainRouter />
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;