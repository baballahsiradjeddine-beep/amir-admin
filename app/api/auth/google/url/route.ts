import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
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

        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/userinfo.email'
            ],
            prompt: 'consent',
            state: 'initial'
        });

        return NextResponse.json({ url });
    } catch (error: any) {
        console.error('[Google-Auth] Failed to generate URL:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
