import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

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

/**
 * Upload profile photo with automatic blur thumbnail generation
 * POST /api/upload/photo
 * 
 * Strategy:
 * 1. Receive original image
 * 2. Upload original to private bucket
 * 3. Generate blurred thumbnail
 * 4. Upload thumbnail to public bucket
 * 5. Return both URLs
 */
export async function POST(request: NextRequest) {
    try {
        if (!supabaseAdmin) {
            console.error('Supabase Admin client not initialized');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // 1. Verify Authentication
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('photo') as File;

        // We ignore the userId passed in formData and use the authenticated user's ID
        // const userId = formData.get('userId') as string; 

        // Check if user exists in member table (optional but good practice)
        const { data: memberData, error: memberError } = await supabaseAdmin
            .from('member')
            .select('id')
            .eq('auth_id', user.id)
            .single();

        if (memberError || !memberData) {
            return NextResponse.json({ error: 'Member profile not found' }, { status: 404 });
        }

        // Use the member ID for filename
        const userId = memberData.id;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { error: 'File must be an image' },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File size must be less than 5MB' },
                { status: 400 }
            );
        }

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Generate unique filename
        const timestamp = Date.now();
        const extension = file.name.split('.').pop();
        const filename = `${userId}_${timestamp}.${extension}`;

        // 1. Optimize original image (Resize & Compress)
        const optimizedBuffer = await sharp(buffer)
            .rotate() // Auto-rotate based on EXIF
            .resize(1920, 1920, {
                fit: 'inside', // Maintain aspect ratio, max dimensions
                withoutEnlargement: true // Don't upscale smaller images
            })
            .jpeg({ quality: 80, mozjpeg: true }) // Compress to JPEG
            .toBuffer();

        // 1. Upload optimized original to PRIVATE bucket
        const { data: originalUpload, error: originalError } = await supabaseAdmin
            .storage
            .from('profile-photos-original')
            .upload(filename, optimizedBuffer, {
                contentType: 'image/jpeg', // Always JPEG after conversion
                upsert: false
            });

        if (originalError) {
            console.error('Original upload error:', originalError);
            return NextResponse.json(
                { error: 'Failed to upload original photo' },
                { status: 500 }
            );
        }

        // 2. Generate blurred thumbnail from optimized buffer
        const blurredBuffer = await sharp(optimizedBuffer)
            .resize(800, 800, {
                fit: 'cover',
                position: 'center'
            })
            .blur(20)  // Apply heavy blur
            .jpeg({ quality: 70 })
            .toBuffer();

        // 3. Upload blurred to PUBLIC bucket
        const blurredFilename = `blurred_${filename}`;
        const { error: blurredError } = await supabaseAdmin
            .storage
            .from('profile-photos-blurred')
            .upload(blurredFilename, blurredBuffer, {
                contentType: 'image/jpeg',
                upsert: false
            });

        if (blurredError) {
            console.error('Blurred upload error:', blurredError);

            // Cleanup: delete original
            await supabaseAdmin.storage
                .from('profile-photos-original')
                .remove([filename]);

            return NextResponse.json(
                { error: 'Failed to upload blurred photo' },
                { status: 500 }
            );
        }

        // 4. Get public URL for blurred image
        const { data: blurredUrlData } = supabaseAdmin
            .storage
            .from('profile-photos-blurred')
            .getPublicUrl(blurredFilename);

        return NextResponse.json({
            success: true,
            originalPath: originalUpload.path,
            blurredUrl: blurredUrlData.publicUrl,
            filename: filename
        });

    } catch (error) {
        console.error('Photo upload error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
