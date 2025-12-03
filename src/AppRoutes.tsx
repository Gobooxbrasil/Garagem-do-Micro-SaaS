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
                <Route path="/" element={<Layout />}>
                    <Route index element={<LandingPageWrapper />} />

                    {/* Protected routes - require authentication AND Telegram */}
                    <Route path="ideas" element={
                        <ProtectedRoute>
                            <TelegramGuard>
                                <IdeasPage />
                            </TelegramGuard>
                        </ProtectedRoute>
                    } />
                    <Route path="showroom" element={
                        <ProtectedRoute>
                            <TelegramGuard>
                                <ShowroomPage />
                            </TelegramGuard>
                        </ProtectedRoute>
                    } />
                    <Route path="roadmap" element={
                        <ProtectedRoute>
                            <TelegramGuard>
                                <RoadmapPage />
                            </TelegramGuard>
                        </ProtectedRoute>
                    } />
                    <Route path="downloads" element={
                        <ProtectedRoute>
                            <TelegramGuard>
                                <DownloadsPage />
                            </TelegramGuard>
                        </ProtectedRoute>
                    } />
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
