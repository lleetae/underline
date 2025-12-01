import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { BatchUtils } from "../utils/BatchUtils";

export function useProfile(userId: string | undefined) {
    const [hasProfile, setHasProfile] = useState(false);
    const [isSignedUp, setIsSignedUp] = useState(false);
    const [isParticipant, setIsParticipant] = useState(false);
    const [isApplied, setIsApplied] = useState(false);
    const [profileId, setProfileId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkProfile = useCallback(async () => {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        try {
            // 1. Fetch Member Profile
            const { data: memberData, error: _memberError } = await supabase
                .from('member')
                .select('id')
                .eq('auth_id', userId)
                .single();

            if (memberData) {
                setHasProfile(true);
                setIsSignedUp(true);
                setProfileId(memberData.id);

                // 2. Parallel Fetch: Check Application Statuses
                const currentBatchDate = BatchUtils.getCurrentBatchStartDate();
                const { start: currentStart, end: currentEnd } = BatchUtils.getBatchApplicationRange(currentBatchDate);

                const targetBatchDate = BatchUtils.getTargetBatchStartDate();
                const { start: targetStart, end: targetEnd } = BatchUtils.getBatchApplicationRange(targetBatchDate);

                const [participantResult, applicationResult] = await Promise.all([
                    // Check if user is a PARTICIPANT in the CURRENT batch
                    supabase
                        .from('dating_applications')
                        .select('status')
                        .eq('member_id', memberData.id)
                        .gte('created_at', currentStart.toISOString())
                        .lte('created_at', currentEnd.toISOString())
                        .eq('status', 'active')
                        .maybeSingle(),

                    // Check if user has APPLIED for the TARGET batch
                    supabase
                        .from('dating_applications')
                        .select('status')
                        .eq('member_id', memberData.id)
                        .gte('created_at', targetStart.toISOString())
                        .lte('created_at', targetEnd.toISOString())
                        .neq('status', 'cancelled')
                        .maybeSingle()
                ]);

                setIsParticipant(!!participantResult.data);
                setIsApplied(!!applicationResult.data);

            } else {
                setHasProfile(false);
                setIsSignedUp(false);
                setIsParticipant(false);
                setIsApplied(false);
                setProfileId(null);
            }
        } catch (error) {
            console.error("Error checking profile:", error);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        checkProfile();
    }, [checkProfile]);

    return {
        hasProfile,
        setHasProfile,
        isSignedUp,
        setIsSignedUp,
        isParticipant,
        setIsParticipant,
        isApplied,
        setIsApplied,
        profileId,
        isLoading,
        checkProfile // Expose for manual refresh
    };
}
