import React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Navigation } from "@/components/layout/navigation"
import { FooterSection } from "@/components/sections/footer-section"
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

import { auth } from "@/auth"
import { SessionProvider } from "next-auth/react"
import { FooterWrapper } from "@/components/layout/footer-wrapper"

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <body className="font-sans antialiased text-foreground bg-background relative overflow-x-hidden selection:bg-primary/20 selection:text-primary flex flex-col min-h-screen">
        <SessionProvider session={session}>
          <Navigation session={session} />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <FooterWrapper />
          <Analytics />
        </SessionProvider>
      </body>
    </html>
  )
}
