import React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Navigation } from "@/components/navigation"
import { FooterSection } from "@/components/footer-section"
import { AuthProvider } from "@/context/auth-context"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Pluto | AI-Powered Symptom Intelligence",
  description:
    "Understand your health instantly with AI-powered symptom intelligence designed for clarity and trust.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-foreground bg-background relative overflow-x-hidden selection:bg-primary/20 selection:text-primary">
        {/* Global Mesh Gradient Background */}
        <div className="fixed inset-0 -z-10 h-full w-full bg-background">
          <div className="absolute h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
          <div className="absolute top-[-10%] left-[-20%] h-[500px] w-[500px] rounded-full bg-blue-400/20 blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-20%] h-[500px] w-[500px] rounded-full bg-purple-400/20 blur-[100px]" />
        </div>

        <AuthProvider>
          <Navigation />
          {children}
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  )
}
