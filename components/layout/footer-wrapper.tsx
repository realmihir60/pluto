"use client"

import { usePathname } from "next/navigation"
import { FooterSection } from "./footer-section"

export function FooterWrapper() {
    const pathname = usePathname()
    const isChatPage = pathname?.startsWith("/demo") || pathname?.startsWith("/dashboard")

    if (isChatPage) return null
    return <FooterSection />
}
