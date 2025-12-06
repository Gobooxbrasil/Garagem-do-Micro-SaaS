import React from 'react';
import { usePlatformSettings } from '../hooks/use-platform-settings';
import { useAuth } from '../context/AuthProvider';
import { MaintenancePage } from '../pages/MaintenancePage';
import { ActionLoader } from './ui/LoadingStates';

interface MaintenanceGuardProps {
    children: React.ReactNode;
}

export const MaintenanceGuard: React.FC<MaintenanceGuardProps> = ({ children }) => {
    const { data: settings, isLoading } = usePlatformSettings();
    const { session, isAdmin } = useAuth();

    if (isLoading) {
        return <ActionLoader message="Verificando status do sistema..." />;
    }

    // Se não estiver em manutenção, libera geral
    if (!settings?.maintenance_mode) {
        return <>{children}</>;
    }

    // Se estiver em manutenção:

    // 1. Admins sempre têm acesso
    if (isAdmin) {
        return (
            <>
                {/* Banner flutuante para avisar admin que está em manutenção */}
                <div className="fixed bottom-4 left-4 z-50 bg-yellow-400 text-black px-4 py-2 rounded-full text-xs font-bold shadow-lg border-2 border-black animate-pulse pointer-events-none opacity-80">
                    🚧 MODO MANUTENÇÃO ATIVO
                </div>
                {children}
            </>
        );
    }

    // 2. Usuários na Whitelist têm acesso
    if (session?.user?.id && settings.maintenance_allowed_users?.includes(session.user.id)) {
        return (
            <>
                <div className="fixed bottom-4 left-4 z-50 bg-green-400 text-black px-4 py-2 rounded-full text-xs font-bold shadow-lg border-2 border-black pointer-events-none opacity-80">
                    🔓 ACESSO DE EXCEÇÃO PERMITIDO
                </div>
                {children}
            </>
        );
    }

    // 3. Bloqueia para o resto
    return <MaintenancePage />;
};
