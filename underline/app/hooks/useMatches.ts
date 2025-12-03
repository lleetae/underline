import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { BatchUtils } from "../utils/BatchUtils";

export function useMatches(userId: string | undefined, profileId: string | null) {
    const [sentMatchRequests, setSentMatchRequests] = useState<Array<any>>([]);
    const [receivedMatchRequests, setReceivedMatchRequests] = useState<Array<any>>([]);
    const [matches, setMatches] = useState<Array<any>>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchMatches = useCallback(async () => {
        if (!userId || !profileId) {
            setIsLoading(false);
            return;
        }

        try {
            const cycleStartDate = BatchUtils.getCurrentInteractionCycleStart();

            // Parallel Fetch: Sent Requests, Received Requests, Confirmed Matches
            const [receivedResult, sentResult, matchesResult] = await Promise.all([
                // 1. Fetch Received Requests
                supabase
                    .from('match_requests')
                    .select(`
            id,
            sender_id,
            letter,
            created_at,
            sender:member!sender_id (
              id,
              nickname,
              age,
              birth_date,
              location,
              sido,
              sigungu,
              photo_url,
              photos,
              auth_id
            )
          `)
                    .eq('receiver_id', profileId)
                    .eq('status', 'pending')
                    .gte('created_at', cycleStartDate.toISOString())
                    .order('created_at', { ascending: false }),

                // 2. Fetch Sent Requests
                supabase
                    .from('match_requests')
                    .select(`
            id,
            receiver_id,
            letter,
            created_at,
            receiver:member!receiver_id (
              id,
              nickname,
              age,
              birth_date,
              birth_date,
              location,
              sido,
              sigungu,
              photo_url,
              photos,
              auth_id
            )
          `)
                    .eq('sender_id', profileId)
                    .eq('status', 'pending')
                    .gte('created_at', cycleStartDate.toISOString())
                    .order('created_at', { ascending: false }),

                // 3. Fetch Matches (Accepted Requests) via API
                (async () => {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                        const response = await fetch('/api/matches/list', {
                            headers: {
                                'Authorization': `Bearer ${session.access_token}`
                            }
                        });
                        if (response.ok) {
                            const { matches } = await response.json();
                            return matches;
                        }
                    }
                    return [];
                })()
            ]);

            // Process Received Requests
            if (receivedResult.data) {
                const formattedReceived = receivedResult.data
                    .filter((req: any) => req.sender && req.sender.auth_id !== null)
                    .map((req: any) => {
                        const photos = req.sender.photos && req.sender.photos.length > 0
                            ? req.sender.photos
                            : (req.sender.photo_url ? [req.sender.photo_url] : []);

                        const age = req.sender.age || (req.sender.birth_date
                            ? new Date().getFullYear() - parseInt(req.sender.birth_date.substring(0, 4))
                            : 0);

                        const location = (req.sender.sido && req.sender.sigungu)
                            ? `${req.sender.sido} ${req.sender.sigungu}`
                            : (req.sender.location || "알 수 없음");

                        return {
                            id: req.id,
                            profileId: req.sender.id.toString(),
                            nickname: req.sender.nickname,
                            age: age,
                            location: location,
                            photo: photos[0] || "",
                            letter: req.letter,
                            timestamp: new Date(req.created_at),
                            isBlurred: true
                        };
                    });
                setReceivedMatchRequests(formattedReceived);
            }

            // Process Sent Requests
            if (sentResult.data) {
                const formattedSent = sentResult.data
                    .filter((req: any) => req.receiver.auth_id !== null)
                    .map((req: any) => {
                        const photos = req.receiver.photos && req.receiver.photos.length > 0
                            ? req.receiver.photos
                            : (req.receiver.photo_url ? [req.receiver.photo_url] : []);

                        const age = req.receiver.age || (req.receiver.birth_date
                            ? new Date().getFullYear() - parseInt(req.receiver.birth_date.substring(0, 4))
                            : 0);

                        const location = (req.receiver.sido && req.receiver.sigungu)
                            ? `${req.receiver.sido} ${req.receiver.sigungu}`
                            : (req.receiver.location || "알 수 없음");

                        return {
                            profileId: req.receiver.id.toString(),
                            nickname: req.receiver.nickname,
                            age: age,
                            location: location,
                            photo: photos[0] || "",
                            letter: req.letter,
                            timestamp: new Date(req.created_at),
                            isBlurred: true
                        };
                    });
                setSentMatchRequests(formattedSent);
            }

            // Process Matches
            if (matchesResult) {
                setMatches(matchesResult);
            }

        } catch (error) {
            console.error("Error fetching matches:", error);
        } finally {
            setIsLoading(false);
        }
    }, [userId, profileId]);

    useEffect(() => {
        fetchMatches();
    }, [fetchMatches]);

    // Realtime Subscription
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel('match_requests_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'match_requests'
                },
                () => {
                    fetchMatches();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, fetchMatches]);

    const acceptMatch = async (requestId: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch('/api/match/accept', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ requestId })
            });

            if (!response.ok) {
                throw new Error('Failed to accept match');
            }

            const { match: updatedMatch } = await response.json();

            // Send Notification to the sender
            try {
                if (session && updatedMatch) {
                    await fetch('/api/notifications/create', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify({
                            type: 'match_accepted',
                            targetMemberId: updatedMatch.sender_id, // Notify the sender
                            matchId: updatedMatch.id
                        })
                    });
                }
            } catch (e) {
                console.error("Error sending notification:", e);
            }

            // Update local state
            setReceivedMatchRequests(prev => prev.filter(req => req.id !== requestId));

            // Refresh matches to get the new match in the list
            fetchMatches();

            return true;
        } catch (error) {
            console.error("Error accepting match:", error);
            throw error;
        }
    };

    const rejectMatch = async (requestId: string) => {
        try {
            const { error } = await supabase
                .from('match_requests')
                .update({ status: 'rejected' })
                .eq('id', requestId);

            if (error) throw error;

            setReceivedMatchRequests(prev => prev.filter(req => req.id !== requestId));
            return true;
        } catch (error) {
            console.error("Error rejecting match:", error);
            throw error;
        }
    };

    return {
        sentMatchRequests,
        receivedMatchRequests,
        matches,
        isLoading,
        refreshMatches: fetchMatches,
        acceptMatch,
        rejectMatch
    };
}
