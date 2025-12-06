import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MaintenanceGuard } from './components/MaintenanceGuard';
import { ActionLoader } from './components/ui/LoadingStates';
import { useAuth } from './context/AuthProvider';

// Lazy Load Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const IdeasPage = lazy(() => import('./features/ideas/IdeasPage'));
const ShowroomPage = lazy(() => import('./features/showroom/ShowroomPage'));
const RoadmapPage = lazy(() => import('./features/roadmap/RoadmapPage'));
const DownloadsPage = lazy(() => import('./features/downloads/DownloadsPage'));
const AdminPage = lazy(() => import('./features/admin/AdminPage'));
const ProfileView = lazy(() => import('./features/auth/ProfileView'));

export const AppRoutes: React.FC = () => {
    return (
        <Suspense fallback={<ActionLoader message="Carregando..." />}>
            <Routes>
                {/* Admin routes - NO LAYOUT, but protected (Bypasses Maintenance Check internally via ProtectedRoute+Admin check, but we can leave it unwrapped for safety or wrap it. 
                    Let's leave it unwrapped here so admins can ALWAYS access admin panel even if Guard breaks, 
                    although Guard has admin bypass logic. 
                */}
                <Route path="/admin/*" element={
                    <ProtectedRoute>
                        <AdminPage />
                    </ProtectedRoute>
                } />

                {/* Public & App Routes - Wrapped in MaintenanceGuard */}
                <Route element={<MaintenanceGuard><Outlet /></MaintenanceGuard>}>
                    {/* Landing Page */}
                    <Route path="/" element={<LandingPageWrapper />} />

                    {/* User routes - WITH LAYOUT */}
                    <Route element={<Layout />}>
                        {/* Public routes (Action-based auth) */}
                        <Route path="ideas" element={<IdeasPage />} />
                        <Route path="showroom" element={<ShowroomPage />} />
                        <Route path="roadmap" element={<RoadmapPage />} />
                        <Route path="downloads" element={<DownloadsPage />} />

                        {/* Protected routes - require authentication */}
                        <Route path="profile" element={
                            <ProtectedRoute>
                                <ProfileView />
                            </ProtectedRoute>
                        } />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
};

// Helper to decide between Landing and Ideas based on auth
const LandingPageWrapper = () => {
    const { session } = useAuth();
    if (session) {
        return <Navigate to="/ideas" replace />;
    }
    return <LandingPage />;
};

