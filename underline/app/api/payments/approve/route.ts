import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { sendPushNotification } from '../../../lib/notifications';

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

        // Sanitize logs: Don't log full body as it may contain PII or tokens
        console.log(`Processing Order: ${body.orderId}, TID: ${body.tid}, Amount: ${body.amount}`);

        const { authResultCode, authResultMsg, tid, orderId, amount } = body;

        // 1. Check if authentication was successful
        if (authResultCode !== "0000") {
            console.log(`NicePayments Auth Failed: ${authResultMsg}`);
            return NextResponse.redirect(new URL(`/?payment_error=${encodeURIComponent(authResultMsg)}`, request.url), { status: 303 });
        }

        // 1.5 Extract Order Info & Pre-Validate
        // orderId format: matchRequestId_payerMemberId
        const [matchRequestId, payerMemberIdStr] = orderId.split('_');

        // Fetch Payer Member & Match Request Status BEFORE approving payment
        const { data: payerMember } = await supabaseAdmin
            .from('member')
            .select('has_welcome_coupon, auth_id')
            .eq('id', payerMemberIdStr)
            .single();

        const { data: matchRequestPre } = await supabaseAdmin
            .from('match_requests')
            .select('is_unlocked, sender_id, receiver_id')
            .eq('id', matchRequestId)
            .single();

        if (!matchRequestPre) {
            console.error(`Match request not found: ${matchRequestId}`);
            return NextResponse.redirect(new URL(`/?payment_error=${encodeURIComponent("Match request not found")}`, request.url), { status: 303 });
        }

        if (matchRequestPre.is_unlocked) {
            console.error(`Match request already unlocked: ${matchRequestId}`);
            // TODO: In a real scenario, we might need to cancel the auth with NicePay if it was a real attempt, 
            // but since we haven't called "approve" yet, the transaction shouldn't be finalized.
            // However, NicePay "Auth" step (step 1) happened on client side. 
            // We just stop here so we don't capture the money.
            return NextResponse.redirect(new URL(`/?payment_error=${encodeURIComponent("Already unlocked")}`, request.url), { status: 303 });
        }

        // Validate Amount strictly against Coupon
        const requestAmount = parseInt(String(amount));
        const validAmounts = [19900, 9900];

        if (!validAmounts.includes(requestAmount)) {
            console.error(`Invalid amount attempted: ${requestAmount}`);
            return NextResponse.redirect(new URL(`/?payment_error=${encodeURIComponent("Invalid payment amount")}`, request.url), { status: 303 });
        }

        if (requestAmount === 9900) {
            if (!payerMember?.has_welcome_coupon) {
                console.error("User tried to pay discounted price without coupon");
                return NextResponse.redirect(new URL(`/?payment_error=${encodeURIComponent("Invalid coupon usage")}`, request.url), { status: 303 });
            }
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
                amount: requestAmount, // Use validated amount
            }),
        });

        const paymentResult = await response.json();
        console.log(`Payment Approval Result Code: ${paymentResult.resultCode}`);
        console.log(`Payment Approval Result Msg: ${paymentResult.resultMsg}`);
        console.log(`Full Payment Result: ${JSON.stringify(paymentResult, null, 2)}`);

        if (paymentResult.resultCode === "0000") {
            // 3. Update Database

            // Validate Approved Amount
            // NicePay returns the actually captured amount. We must verify this matches our expectation.
            const approvedAmount = paymentResult.data?.amount || paymentResult.amount || 0;
            // Note: NicePay API response structure might vary, 'data.amount' or root 'amount'. 
            // Sandbox usually returns root amount for some endpoints, but let's be safe.
            // Based on logs, it seems to return at root.

            if (parseInt(String(approvedAmount)) !== requestAmount) {
                console.error(`Approved amount mismatch! Requested: ${requestAmount}, Approved: ${approvedAmount}`);
                // Critical Security Alert: Payment amount tamper?
                // We should theoretically void the payment here.
                return NextResponse.redirect(new URL(`/?payment_error=${encodeURIComponent("Payment amount mismatch")}`, request.url), { status: 303 });
            }

            // Coupon Consumption (Now safe to do since we validated eligibility before paying)
            if (payerMemberIdStr && requestAmount === 9900) {
                // Consume coupon
                await supabaseAdmin
                    .from('member')
                    .update({ has_welcome_coupon: false })
                    .eq('id', payerMemberIdStr);
            }

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

                // Get sender_id and receiver_id from match_request
                const { data: matchData, error: matchError } = await supabaseAdmin
                    .from('match_requests')
                    .select('sender_id, receiver_id')
                    .eq('id', matchRequestId)
                    .single();

                if (matchError) {
                    console.error("Error fetching match request for payment record:", matchError);
                } else {
                    console.log(`Found Match Request Sender ID: ${matchData?.sender_id}`);
                }

                // Fetch payer member again if needed, or reuse from above if valid
                // We need auth_id for user_id column (uuid)
                let payerAuthId = null;
                if (payerMemberIdStr) {
                    const { data: pm } = await supabaseAdmin
                        .from('member')
                        .select('auth_id')
                        .eq('id', payerMemberIdStr)
                        .single();
                    payerAuthId = pm?.auth_id;
                }

                if (payerAuthId) {
                    // Insert into payments table using auth UUID
                    const { error: paymentError } = await supabaseAdmin
                        .from('payments')
                        .insert({
                            user_id: payerAuthId,
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
                            user_id: payerMemberIdStr,
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
            } catch (e) {
                console.error("Failed to save payment history:", e);
            }

            // 5. Send Notification to the OTHER party
            console.log(`Processing payment notification. OrderId: ${orderId}, PayerMemberIdStr: ${payerMemberIdStr}`);

            if (payerMemberIdStr) {
                try {
                    const payerMemberId = payerMemberIdStr;
                    console.log(`PayerMemberId: ${payerMemberId} (Type: ${typeof payerMemberId})`);

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
                        // Explicitly convert to strings for comparison to avoid type mismatches
                        const senderIdStr = String(matchRequest.sender_id).trim();
                        const receiverIdStr = String(matchRequest.receiver_id).trim();
                        const payerIdStr = String(payerMemberId).trim();

                        console.log(`Comparing IDs: Sender=${senderIdStr}, Receiver=${receiverIdStr}, Payer=${payerIdStr}`);

                        let targetMemberId: string | null = null;

                        if (senderIdStr === payerIdStr) {
                            targetMemberId = receiverIdStr;
                        } else if (receiverIdStr === payerIdStr) {
                            targetMemberId = senderIdStr;
                        } else {
                            console.warn(`Payer ID ${payerIdStr} does not match sender ${senderIdStr} or receiver ${receiverIdStr}. Notification might be sent to wrong person or skipped.`);
                            // Fallback: If payer is neither, maybe we shouldn't send? Or default to receiver?
                            // Let's assume sender is the one who initiated if unclear, so send to receiver.
                            // But safer to log error.
                        }

                        if (targetMemberId) {
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

                                // Get payer's auth_id (sender of notification) - purely for logging/verification, we use payerMemberId for sender_id
                                const { data: payerMember } = await supabaseAdmin
                                    .from('member')
                                    .select('auth_id')
                                    .eq('id', payerMemberId)
                                    .single();

                                if (payerMember) {
                                    console.log(`Inserting notification: user_id=${targetMember.auth_id}, sender_id=${payerMemberId}`);
                                    const { data: insertedNotification, error: insertError } = await supabaseAdmin
                                        .from('notifications')
                                        .insert({
                                            user_id: targetMember.auth_id, // Receiver of notification
                                            type: 'contact_revealed',
                                            match_id: matchRequestId,
                                            sender_id: payerMember.auth_id, // Sender of notification (Payer Auth ID)
                                            is_read: false,
                                            metadata: {}
                                        })
                                        .select()
                                        .single();

                                    if (insertError) {
                                        console.error("Error inserting payment notification:", insertError);
                                    } else {
                                        console.log(`Notification sent successfully to member ${targetMemberId}`);

                                        // Send Push Notification
                                        try {
                                            const pushResult = await sendPushNotification(
                                                targetMemberId,
                                                "연락처 잠금 해제 알림",
                                                "상대방이 연락처를 확인했습니다.",
                                                "/mailbox?tab=matched"
                                            );

                                            // Log success to metadata
                                            if (insertedNotification) {
                                                await supabaseAdmin
                                                    .from('notifications')
                                                    .update({
                                                        metadata: {
                                                            ...insertedNotification.metadata,
                                                            push_result: pushResult || 'no_response',
                                                            push_attempted: true
                                                        }
                                                    })
                                                    .eq('id', insertedNotification.id);
                                            }
                                        } catch (pushError: any) {
                                            console.error("Failed to send push notification:", pushError);

                                            // Log error to metadata
                                            if (insertedNotification) {
                                                await supabaseAdmin
                                                    .from('notifications')
                                                    .update({
                                                        metadata: {
                                                            ...insertedNotification.metadata,
                                                            push_error: pushError.message || 'Unknown error',
                                                            push_attempted: true
                                                        }
                                                    })
                                                    .eq('id', insertedNotification.id);
                                            }
                                        }
                                    }
                                } else {
                                    console.error("Payer member not found in DB, but proceeding with ID from orderId");
                                }
                            }
                        } else {
                            console.error("Could not determine target member for notification.");
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
            return NextResponse.redirect(new URL(`/?view=mailbox&payment_success=true`, request.url), { status: 303 });
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
