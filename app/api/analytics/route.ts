import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, timestamp, ...data } = body;

        // In a real startup, this would go to PostHog, Mixpanel, or Supabase.
        // For "Founder Mode", we log to Vercel/Server stdout which is free and instant.
        console.log(JSON.stringify({
            level: 'info',
            event: 'analytics_event',
            name,
            timestamp,
            data,
            userAgent: req.headers.get('user-agent'),
            ip: req.headers.get('x-forwarded-for') || 'unknown'
        }));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Analytics Endpoint Error:", error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
