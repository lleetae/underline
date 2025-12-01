import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface DecryptedKakaoIdProps {
    encryptedId?: string;
    className?: string;
    fallback?: string;
}

export function DecryptedKakaoId({ encryptedId, className = "", fallback = "알 수 없음" }: DecryptedKakaoIdProps) {
    const [decryptedId, setDecryptedId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const decrypt = async () => {
            if (!encryptedId) return;

            setIsLoading(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;

                if (!token) {
                    console.error("No session token found for decryption");
                    return;
                }

                const response = await fetch('/api/decrypt/kakao', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ encryptedId })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (isMounted) {
                        setDecryptedId(data.decryptedId);
                    }
                } else {
                    console.error("Decryption failed:", await response.text());
                }
            } catch (e) {
                console.error("Error decrypting Kakao ID:", e);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        decrypt();

        return () => {
            isMounted = false;
        };
    }, [encryptedId]);

    if (isLoading) {
        return <span className={`animate-pulse bg-gray-200 rounded px-2 ${className}`}>...</span>;
    }

    return <span className={className}>{decryptedId || fallback}</span>;
}
