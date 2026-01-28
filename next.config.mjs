/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/chat',
        destination: 'http://localhost:8000/api/chat',
      },
      {
        source: '/api/triage',
        destination: 'http://localhost:8000/api/triage',
      },
      {
        source: '/api/consent',
        destination: 'http://localhost:8000/api/consent',
      },
      {
        source: '/api/memory',
        destination: 'http://localhost:8000/api/memory',
      },
    ]
  },
}

export default nextConfig
