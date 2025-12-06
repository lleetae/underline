import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    const {
        data: { session },
    } = await supabase.auth.getSession();

    // Protected Routes
    const protectedRoutes = ['/my-profile', '/mailbox', '/payment', '/add-book'];
    const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route));

    if (isProtectedRoute && !session) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = '/';
        redirectUrl.searchParams.set('login_required', 'true');
        return NextResponse.redirect(redirectUrl);
    }

    // Auth Routes (Redirect to home if already logged in)
    // const authRoutes = ['/login', '/signup']; // Assuming these exist, but main page is currently login/signup hybrid
    // if (authRoutes.includes(req.nextUrl.pathname) && session) {
    //   return NextResponse.redirect(new URL('/', req.url));
    // }

    return res;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - icons (PWA icons)
         * - manifest.json (PWA manifest)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json).*)',
    ],
};
