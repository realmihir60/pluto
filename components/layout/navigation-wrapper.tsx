"use client"

import { usePathname } from "next/navigation"
import { Navigation } from "./navigation"

export function NavigationWrapper({ session }: { session: any }) {
    const pathname = usePathname()
    const isAdminPage = pathname?.startsWith("/admin")

    if (isAdminPage) return null
    return <Navigation session={session} />
}
