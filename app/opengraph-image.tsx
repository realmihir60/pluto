import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Pluto - AI Symptom Intelligence'
export const size = {
    width: 1200,
    height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: 'white',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                }}
            >
                {/* Background Gradients */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-20%',
                        left: '-10%',
                        width: '600px',
                        height: '600px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        borderRadius: '50%',
                        filter: 'blur(100px)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-20%',
                        right: '-10%',
                        width: '600px',
                        height: '600px',
                        background: 'rgba(37, 99, 235, 0.15)',
                        borderRadius: '50%',
                        filter: 'blur(100px)',
                    }}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', zIndex: 10 }}>
                    {/* Logo Icon Mock */}
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '24px',
                        background: 'rgba(37, 99, 235, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(37, 99, 235, 0.2)',
                    }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: '-0.05em', color: '#0f172a' }}>
                            Pluto
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 500, color: '#64748b', marginTop: '4px' }}>
                            Private. Fast. AI Symptom Checker.
                        </div>
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
        }
    )
}
