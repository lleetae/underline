import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Server-side Supabase client with service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;

export async function POST(request: NextRequest) {
    try {
        if (!supabaseAdmin) {
            console.error('Supabase Admin client not initialized');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        console.log("Payment approval request received");

        // Parse the request body from NicePayments returnUrl
        const contentType = request.headers.get("content-type") || "";
        let body: any = {};

        if (contentType.includes("application/json")) {
            body = await request.json();
        } else if (contentType.includes("application/x-www-form-urlencoded")) {
            const formData = await request.formData();
            formData.forEach((value, key) => {
                body[key] = value;
            });
        }

        console.log(`NicePayments Callback Body: ${JSON.stringify(body, null, 2)}`);

        const { authResultCode, authResultMsg, tid, orderId, amount } = body;

        // 1. Check if authentication was successful
        if (authResultCode !== "0000") {
            console.log(`NicePayments Auth Failed: ${authResultMsg}`);
            return NextResponse.redirect(new URL(`/?payment_error=${encodeURIComponent(authResultMsg)}`, request.url), { status: 303 });
        }

        // 2. Call NicePayments Approval API
        const nicepayClientId = process.env.NEXT_PUBLIC_NICEPAY_CLIENT_ID;
        const nicepaySecretKey = process.env.NICEPAY_SECRET_KEY;

        if (!nicepayClientId || !nicepaySecretKey) {
            throw new Error("Missing NicePayments keys");
        }

        const authorization = Buffer.from(`${nicepayClientId}:${nicepaySecretKey}`).toString("base64");

        // 2.1 Get Access Token
        console.log("Requesting Access Token...");
        const tokenResponse = await fetch("https://sandbox-api.nicepay.co.kr/v1/access-token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Basic ${authorization}`,
            },
            body: JSON.stringify({}),
        });

        const tokenResult = await tokenResponse.json();
        console.log(`Access Token Result: ${JSON.stringify(tokenResult, null, 2)}`);

        if (tokenResult.resultCode !== "0000" || !tokenResult.accessToken) {
            throw new Error(`Failed to get access token: ${tokenResult.resultMsg}`);
        }

        const accessToken = tokenResult.accessToken;
        const apiUrl = `https://sandbox-api.nicepay.co.kr/v1/payments/${tid}`;

        console.log(`Calling Approval API: ${apiUrl} with Bearer Token`);

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                amount: amount || 9900, // Ensure amount matches
            }),
        });

        const paymentResult = await response.json();
        console.log(`Payment Approval Result Code: ${paymentResult.resultCode}`);
        console.log(`Payment Approval Result Msg: ${paymentResult.resultMsg}`);
        console.log(`Full Payment Result: ${JSON.stringify(paymentResult, null, 2)}`);

        if (paymentResult.resultCode === "0000") {
            // 3. Update Database
            // orderId format: matchRequestId_payerMemberId (new) OR matchRequestId (old)
            const [matchRequestId, payerMemberIdStr] = orderId.split('_');

            console.log(`Updating match request ${matchRequestId} to unlocked`);

            const { error } = await supabaseAdmin
                .from("match_requests")
                .update({
                    is_unlocked: true,
                    payment_tid: tid,
                })
                .eq("id", matchRequestId);

            if (error) {
                console.log(`Error updating match request: ${JSON.stringify(error)}`);
                return NextResponse.redirect(new URL(`/?payment_error=db_update_failed`, request.url), { status: 303 });
            }

            // 4. Insert into payments table
            try {
                console.log(`Attempting to insert payment record for Match Request ID: ${matchRequestId}`);

                // Get sender_id from match_request to find the user who paid
                const { data: matchData, error: matchError } = await supabaseAdmin
                    .from('match_requests')
                    .select('sender_id')
                    .eq('id', matchRequestId)
                    .single();

                if (matchError) {
                    console.error("Error fetching match request for payment record:", matchError);
                } else {
                    console.log(`Found Match Request Sender ID: ${matchData?.sender_id}`);
                }

                if (matchData?.sender_id) {
                    // Get auth_id from member table
                    const { data: memberData, error: memberError } = await supabaseAdmin
                        .from('member')
                        .select('auth_id')
                        .eq('id', matchData.sender_id)
                        .single();

                    if (memberError) {
                        console.error("Error fetching member for payment record:", memberError);
                    } else {
                        console.log(`Found Member Auth ID: ${memberData?.auth_id}`);
                    }

                    if (memberData?.auth_id) {
                        const { error: paymentError } = await supabaseAdmin
                            .from('payments')
                            .insert({
                                user_id: memberData.auth_id,
                                match_id: matchRequestId,
                                amount: typeof amount === 'string' ? parseInt(amount) : amount,
                                status: 'completed',
                                payment_method: body.payMethod || 'card',
                                transaction_id: tid,
                                completed_at: new Date().toISOString()
                            });

                        if (paymentError) {
                            console.error("Error inserting payment record:", paymentError);
                            console.error("Payment Insert Payload:", {
                                user_id: memberData.auth_id,
                                match_id: matchRequestId,
                                amount: typeof amount === 'string' ? parseInt(amount) : amount,
                                status: 'completed',
                                payment_method: body.payMethod || 'card',
                                transaction_id: tid,
                                completed_at: new Date().toISOString()
                            });
                        } else {
                            console.log("Payment record inserted successfully.");
                        }
                    } else {
                        console.error("Could not find sender_id for match request. MatchData:", matchData);
                    }
                } else {
                    console.error("Could not find sender_id for match request:", matchRequestId);
                }
            } catch (e) {
                console.error("Failed to save payment history:", e);
            }

            // 4. Send Notification to the OTHER party
            console.log(`Processing payment notification. OrderId: ${orderId}, PayerMemberIdStr: ${payerMemberIdStr}`);

            if (payerMemberIdStr) {
                try {
                    const payerMemberId = parseInt(payerMemberIdStr);
                    console.log(`Parsed PayerMemberId: ${payerMemberId}`);

                    // Fetch match request to find sender and receiver
                    const { data: matchRequest, error: matchError } = await supabaseAdmin
                        .from('match_requests')
                        .select('sender_id, receiver_id')
                        .eq('id', matchRequestId)
                        .single();

                    if (matchError || !matchRequest) {
                        console.error("Error fetching match request for notification:", matchError);
                    } else {
                        console.log(`Match Request found: sender=${matchRequest.sender_id}, receiver=${matchRequest.receiver_id}`);

                        // Determine target user (the one who did NOT pay)
                        const targetMemberId = matchRequest.sender_id === payerMemberId
                            ? matchRequest.receiver_id
                            : matchRequest.sender_id;

                        console.log(`Target Member ID (Receiver of notification): ${targetMemberId}`);

                        // Get target user's auth_id
                        const { data: targetMember, error: targetError } = await supabaseAdmin
                            .from('member')
                            .select('auth_id')
                            .eq('id', targetMemberId)
                            .single();

                        if (targetError || !targetMember) {
                            console.error("Error fetching target member auth_id:", targetError);
                        } else {
                            console.log(`Target Member Auth ID: ${targetMember.auth_id}`);

                            // Get payer's auth_id (sender of notification) - Just to verify it exists if needed, 
                            // but we use payerMemberId for sender_id column now.
                            // Actually, we don't strictly need payerMember auth_id for the insert anymore 
                            // since we use payerMemberId (int) for sender_id.
                            // But let's keep the check to ensure payer exists.
                            const { data: payerMember } = await supabaseAdmin
                                .from('member')
                                .select('auth_id')
                                .eq('id', payerMemberId)
                                .single();

                            if (payerMember) {
                                console.log(`Inserting notification: user_id=${targetMember.auth_id}, sender_id=${payerMemberId}`);
                                const { error: insertError } = await supabaseAdmin
                                    .from('notifications')
                                    .insert({
                                        user_id: targetMember.auth_id, // Receiver of notification
                                        type: 'contact_revealed',
                                        match_id: matchRequestId,
                                        sender_id: payerMemberId, // Sender of notification (Payer Member ID - BigInt)
                                        is_read: false,
                                        metadata: {}
                                    });

                                if (insertError) {
                                    console.error("Error inserting payment notification:", insertError);
                                } else {
                                    console.log(`Notification sent successfully to member ${targetMemberId}`);
                                }
                            } else {
                                console.error("Payer member not found");
                            }
                        }
                    }
                } catch (notifyError) {
                    console.error("Error sending payment notification:", notifyError);
                    // Don't fail the payment if notification fails
                }
            } else {
                console.warn("No payerMemberId found in orderId, skipping notification");
            }

            console.log("Payment flow completed successfully");
            return NextResponse.redirect(new URL(`/?payment_success=true`, request.url), { status: 303 });
        } else {
            console.log(`Payment Approval Failed: ${paymentResult.resultMsg}`);
            return NextResponse.redirect(new URL(`/?payment_error=${encodeURIComponent(paymentResult.resultMsg)}`, request.url), { status: 303 });
        }

    } catch (error: any) {
        console.error("Error processing payment:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.redirect(new URL(`/?payment_error=${encodeURIComponent(errorMessage)}`, request.url), { status: 303 });
    }
}
