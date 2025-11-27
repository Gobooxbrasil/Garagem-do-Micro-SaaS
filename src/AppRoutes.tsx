import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ActionLoader } from './components/ui/LoadingStates';

// Lazy Load Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const IdeasPage = lazy(() => import('./features/ideas/IdeasPage')); // We'll create this
const ShowroomPage = lazy(() => import('./features/showroom/ShowroomPage')); // We'll create this
const RoadmapPage = lazy(() => import('./features/roadmap/RoadmapPage')); // We'll create this
const AdminPage = lazy(() => import('./features/admin/AdminPage')); // We'll create this
const ProfileView = lazy(() => import('./features/auth/ProfileView'));

export const AppRoutes: React.FC = () => {
    return (
        <Suspense fallback={<ActionLoader message="Carregando..." />}>
            <Routes>
                {/* Admin routes - NO LAYOUT */}
                <Route path="/admin/*" element={<AdminPage />} />

                {/* User routes - WITH LAYOUT */}
                <Route path="/" element={<Layout />}>
                    <Route index element={<LandingPageWrapper />} />
                    <Route path="ideas" element={<IdeasPage />} />
                    <Route path="showroom" element={<ShowroomPage />} />
                    <Route path="roadmap" element={<RoadmapPage />} />
                    <Route path="profile" element={<ProfileView />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>
        </Suspense>
    );
};

// Helper to decide between Landing and Ideas based on auth is handled in LandingPage or a wrapper
// For now, let's assume LandingPage handles the redirect if logged in, or we do it here.
import { useAuth } from './context/AuthProvider';

const LandingPageWrapper = () => {
    const { session } = useAuth();
    if (session) {
        return <Navigate to="/ideas" replace />;
    }
    return <LandingPage />;
};
