import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

/**
 * Centralized auth hook — replaces scattered `supabase.auth.getUser()` calls.
 *
 * Returns the current authenticated user (or null) and a `requireUser` helper
 * that can be called in event handlers to get a non-null user or bail early.
 */
export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const fetchUser = async () => {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (mounted) {
                setUser(currentUser);
                setLoading(false);
            }
        };

        fetchUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (mounted) {
                    setUser(session?.user ?? null);
                    setLoading(false);
                }
            },
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    /**
     * Imperatively get the current user. Useful inside event handlers where
     * you need a guaranteed non-null user and want to bail early if logged out.
     *
     * @returns The authenticated `User`, or `null` if not logged in.
     */
    const requireUser = useCallback(async (): Promise<User | null> => {
        const { data: { user: freshUser } } = await supabase.auth.getUser();
        return freshUser;
    }, []);

    return { user, loading, requireUser } as const;
}
