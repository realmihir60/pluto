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
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/:path*",
      },
      {
        source: "/api/analyze-document",
        destination: "/api/analyze-document" // Keep Next.js api routes intact?
        // Wait, if I rewrite /api/:path*, it swallows everything.
        // I should only rewrite Python routes locally.
        // Or Next.js checks API routes first? 'rewrites' happens AFTER filesystem?
        // "Rewrites are applied after checking the filesystem... unless 'beforeFiles' is used"
        // Actually, standard rewrites happen AFTER filesystem check (pages, public files, etc).
        // So /api/analyze-document (Next.js route) will match filesystem and NOT be rewritten.
        // Correct.
      }
    ]
  },
}

export default nextConfig
