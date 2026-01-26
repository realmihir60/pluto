import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json();
        const session = await auth();

        const sessionToken = req.cookies.get('authjs.session-token')?.value ||
            req.cookies.get('__Secure-authjs.session-token')?.value ||
            "DEMO_TOKEN";

        const pythonBackendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        const response = await fetch(`${pythonBackendUrl}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-session-token': sessionToken
            },
            body: JSON.stringify({ messages }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json({ error: errorData.detail || 'Python Backend Error' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Chat Proxy Error:", error);
        return NextResponse.json(
            { error: "Failed to process chat request" },
            { status: 500 }
        );
    }
}
