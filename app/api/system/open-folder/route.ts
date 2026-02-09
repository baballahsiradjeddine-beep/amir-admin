import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import os from 'os';

export async function POST(req: NextRequest) {
    try {
        const { path } = await req.json();

        if (!path) {
            return NextResponse.json({ error: 'Path is required' }, { status: 400 });
        }

        // Platform specific command
        let command = '';
        switch (process.platform) {
            case 'win32':
                command = `start "" "${path}"`;
                break;
            case 'darwin':
                command = `open "${path}"`;
                break;
            case 'linux':
                command = `xdg-open "${path}"`;
                break;
            default:
                return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 });
        }

        exec(command, (error) => {
            if (error) {
                console.error('[System] Open folder error:', error);
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
