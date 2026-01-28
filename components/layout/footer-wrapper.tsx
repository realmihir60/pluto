"use client"

import { usePathname } from "next/navigation"
import { FooterSection } from "@/components/sections/footer-section"

export function FooterWrapper() {
    const pathname = usePathname()
    const isChatPage = pathname?.startsWith("/demo") || pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin")

    if (isChatPage) return null
    return <FooterSection />
}
