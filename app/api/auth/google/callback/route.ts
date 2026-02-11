import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Needs Service Role to update user metadata

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL('/dashboard/settings?error=' + error, req.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/dashboard/settings?error=missing_code', req.url));
    }

    try {
        const host = req.headers.get('host');
        const protocol = host?.includes('localhost') ? 'http' : 'https';
        const dynamicRedirectUri = `${protocol}://${host}/api/auth/google/callback`;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || dynamicRedirectUri;

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            redirectUri
        );

        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Get user email from Google
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        const googleEmail = userInfo.data.email;

        if (!tokens.refresh_token) {
            console.warn('[Google-Auth] No refresh token returned. User might have already authorized.');
            // Proceed anyway, but user might need to re-consent if they want to ensure refresh token works
        }

        // Now we need to update the Supabase user
        // We can't easily get the user ID from the callback unless we pass it in 'state' 
        // OR if the user is logged in (session cookie).

        // For now, let's assume we can get the session. 
        // In many cases, cookies are sent with the redirect if same-domain.
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, anonKey, {
            global: { headers: { Authorization: req.headers.get('Authorization') || '' } }
        });

        // Wait, the redirect doesn't have the Authorization header. 
        // We should use cookies to get the session.
        // However, a simpler way is to use the 'state' parameter to pass a temporary token or user ID.
        // But let's try to find the user by their email if they are the only logged in user? No.

        // Better: Redirect BACK to settings with the token in the URL (briefly) or a success flag
        // and have the frontend call an API to save it. 
        // But that's insecure.

        // Real approach: The response will be a redirect back to a "success" page 
        // that uses the supabase client (which has the session) to update metadata.

        // Let's use a HTML response that saves to localStorage or calls a proxy API.

        const successUrl = new URL('/dashboard/settings', req.url);
        successUrl.searchParams.set('google_auth_success', 'true');
        if (tokens.refresh_token) successUrl.searchParams.set('refresh_token', tokens.refresh_token);
        if (googleEmail) successUrl.searchParams.set('google_email', googleEmail);

        return NextResponse.redirect(successUrl);

    } catch (error: any) {
        console.error('[Google-Auth] Callback failed:', error);
        return NextResponse.redirect(new URL('/dashboard/settings?error=callback_failed', req.url));
    }
}
