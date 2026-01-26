import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const sessionToken = req.cookies.get('authjs.session-token')?.value ||
            req.cookies.get('__Secure-authjs.session-token')?.value ||
            "DEMO_TOKEN";

        const pythonBackendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        const response = await fetch(`${pythonBackendUrl}/triage/${id}`, {
            method: 'GET',
            headers: {
                'x-session-token': sessionToken
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json({ error: errorData.detail || 'Python Backend Error' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Fetch Triage Detail Proxy Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
