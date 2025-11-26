import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
    session: Session | null;
    user: any | null;
    userAvatar: string | null;
    isLoading: boolean;
    isAdmin: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [userAvatar, setUserAvatar] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        // Initial Session Check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) {
                fetchUserData(session.user.id);
            } else {
                setIsLoading(false);
            }
        });

        // Listen for Auth Changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                fetchUserData(session.user.id);
            } else {
                setUserAvatar(null);
                setIsAdmin(false);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserData = async (userId: string) => {
        try {
            const { data } = await supabase.from('profiles').select('avatar_url, is_admin, is_blocked, blocked_reason').eq('id', userId).single();

            if (data) {
                if (data.is_blocked) {
                    await supabase.auth.signOut();
                    alert(`ACESSO NEGADO\n\nSua conta foi suspensa.\nMotivo: ${data.blocked_reason || 'Violação dos termos de uso.'}`);
                    return;
                }
                setUserAvatar(data.avatar_url);
                setIsAdmin(!!data.is_admin);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUserAvatar(null);
        setIsAdmin(false);
    };

    return (
        <AuthContext.Provider value={{ session, user: session?.user || null, userAvatar, isLoading, isAdmin, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
