import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const { input } = await req.json();
        const session = await auth();

        // Use a mock/fallback for demo or real token if available (Auth.js session usually doesn't expose the raw JWT to server code easily without work, 
        // but we can pass the user email as a fallback or if we have a real token use that)
        // For this migration, we'll try to find the session token in cookies
        const sessionToken = req.cookies.get('authjs.session-token')?.value ||
            req.cookies.get('__Secure-authjs.session-token')?.value ||
            "DEMO_TOKEN";

        const pythonBackendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        const response = await fetch(`${pythonBackendUrl}/triage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-session-token': sessionToken
            },
            body: JSON.stringify({ input }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json({ error: errorData.detail || 'Python Backend Error' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Triage Proxy Error:', error);
        return NextResponse.json(
            { error: `Internal Server Error: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        );
    }
}
