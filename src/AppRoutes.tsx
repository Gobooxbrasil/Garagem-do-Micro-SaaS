import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TelegramGuard } from './features/telegram/TelegramGuard';
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
                {/* Admin routes - NO LAYOUT, but protected */}
                <Route path="/admin/*" element={
                    <ProtectedRoute>
                        <TelegramGuard>
                            <AdminPage />
                        </TelegramGuard>
                    </ProtectedRoute>
                } />

                {/* User routes - WITH LAYOUT */}
                <Route path="/" element={<LayoutWrapper />}>
                    <Route index element={<LandingPageWrapper />} />

                    {/* Public routes (Action-based auth) */}
                    <Route path="ideas" element={<IdeasPage />} />
                    <Route path="showroom" element={<ShowroomPage />} />
                    <Route path="roadmap" element={<RoadmapPage />} />
                    <Route path="downloads" element={<DownloadsPage />} />

                    {/* Protected routes - require authentication AND Telegram */}
                    <Route path="profile" element={
                        <ProtectedRoute>
                            <TelegramGuard>
                                <ProfileView />
                            </TelegramGuard>
                        </ProtectedRoute>
                    } />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
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

// Wrapper to apply TelegramGuard only for authenticated users
const LayoutWrapper = () => {
    const { session } = useAuth();

    if (session) {
        return (
            <TelegramGuard>
                <Layout />
            </TelegramGuard>
        );
    }

    return <Layout />;
};

