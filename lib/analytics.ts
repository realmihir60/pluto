export type EventName = 'VIEW_LANDING' | 'START_INPUT' | 'SUBMIT_TRIAGE' | 'INTERACTION_ERROR';

export const trackEvent = async (name: EventName, data: Record<string, any> = {}) => {
    try {
        const payload = {
            name,
            timestamp: new Date().toISOString(),
            url: window.location.pathname,
            ...data
        };

        // Developer Console Log
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Analytics]: ${name}`, payload);
        }

        // Server-side Log
        await fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true // Ensure request survives page navigation
        });

    } catch (err) {
        // Fail silently to not impact user experience
        console.warn("Analytics Error:", err);
    }
};
