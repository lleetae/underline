import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

export function useAuth() {
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        // 1. Manual Hash Recovery (Fallback for Implicit Flow)
        const handleHash = async () => {
            if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
                try {
                    // Parse hash manually
                    const hash = window.location.hash.substring(1); // remove #
                    const params = new URLSearchParams(hash);
                    const accessToken = params.get('access_token');
                    const refreshToken = params.get('refresh_token');

                    if (accessToken) {
                        const { data, error } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken || '',
                        });

                        if (error) {
                            toast.error("세션 복구 실패: " + error.message);
                        } else if (data.session && mounted) {
                            setSession(data.session);
                            // Clear hash to prevent loop or clutter
                            window.history.replaceState(null, '', window.location.pathname);
                            return true; // Session established
                        }
                    }
                } catch (e) {
                    console.error("Error parsing hash:", e);
                }
            }
            return false;
        };

        const initAuth = async () => {
            const hashHandled = await handleHash();
            if (hashHandled) return;

            // 2. Standard Supabase Session Check
            const { data: { session } } = await supabase.auth.getSession();
            if (mounted) {
                if (session) {
                    setSession(session);
                } else {
                    // Only set loading false if we didn't just manually set session
                    // But since handleHash is async, we might have a race. 
                    // Ideally we wait, but for now let's rely on the state update.
                    if (!window.location.hash.includes('access_token')) {
                        setIsLoading(false);
                    }
                }
            }
        };

        initAuth();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                setSession(session);
                if (!session) {
                    setIsLoading(false);
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return { session, isLoading, setIsLoading };
}
