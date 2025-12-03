import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ActionLoader } from './components/ui/LoadingStates';

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
                        <AdminPage />
                    </ProtectedRoute>
                } />

                {/* User routes - WITH LAYOUT */}
                <Route path="/" element={<Layout />}>
                    <Route index element={<LandingPageWrapper />} />

                    {/* Protected routes - require authentication */}
                    <Route path="ideas" element={
                        <ProtectedRoute>
                            <IdeasPage />
                        </ProtectedRoute>
                    } />
                    <Route path="showroom" element={
                        <ProtectedRoute>
                            <ShowroomPage />
                        </ProtectedRoute>
                    } />
                    <Route path="roadmap" element={
                        <ProtectedRoute>
                            <RoadmapPage />
                        </ProtectedRoute>
                    } />
                    <Route path="downloads" element={
                        <ProtectedRoute>
                            <DownloadsPage />
                        </ProtectedRoute>
                    } />
                    <Route path="profile" element={
                        <ProtectedRoute>
                            <ProfileView />
                        </ProtectedRoute>
                    } />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>
        </Suspense>
    );
};

// Helper to decide between Landing and Ideas based on auth
import { useAuth } from './context/AuthProvider';

const LandingPageWrapper = () => {
    const { session } = useAuth();
    if (session) {
        return <Navigate to="/ideas" replace />;
    }
    return <LandingPage />;
};
