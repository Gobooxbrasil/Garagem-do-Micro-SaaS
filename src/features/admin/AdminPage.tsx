import React, { useState } from 'react';
import { useAuth } from '../../context/AuthProvider';
import AdminLayout from './AdminLayout';
import AdminLogin from './AdminLogin';
import { AdminSubview } from '../../types';

const AdminPage: React.FC = () => {
    const { session, isAdmin } = useAuth();
    const [currentView, setCurrentView] = useState<AdminSubview>('DASHBOARD');

    if (!session || !isAdmin) {
        return <AdminLogin onSuccess={() => { /* AuthProvider handles state update */ }} />;
    }

    return (
        <AdminLayout
            currentView={currentView}
            onNavigate={setCurrentView}
            onExit={() => window.location.href = '/'}
            session={session}
        />
    );
};

export default AdminPage;
