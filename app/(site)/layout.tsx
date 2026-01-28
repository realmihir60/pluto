import React from "react"
import { Navigation } from "@/components/layout/navigation"
import { FooterWrapper } from "@/components/layout/footer-wrapper"
import { auth } from "@/auth"

export default async function MarketingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth();

    return (
        <>
            <Navigation session={session} />
            <main className="flex-1 flex flex-col">
                {children}
            </main>
            <FooterWrapper />
        </>
    )
}
