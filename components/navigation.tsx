"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Session } from "next-auth"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/demo", label: "Checkup" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/trust", label: "Trust & Safety" },
]

export function Navigation({ session }: { session: Session | null }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav
        className="bg-background/95 backdrop-blur-sm border-b border-border"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2"
          >
            <Image
              src="/logo.jpg"
              alt=""
              width={28}
              height={28}
              className="rounded-sm"
              aria-hidden="true"
            />
            <span className="text-lg font-semibold text-foreground">Pluto</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <ul className="flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`relative px-3 py-1.5 text-sm font-medium transition-colors rounded-md ${isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                )
              })}
            </ul>

            <div className="flex items-center gap-2 border-l border-border pl-4">
              {session?.user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">Log in</Link>
                  <Link href="/signup" className="text-sm font-medium text-primary hover:text-primary/80">Sign up</Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-muted-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
            )}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background p-4 flex flex-col gap-4 shadow-xl">
            <ul className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 text-base font-medium text-foreground hover:bg-secondary/50 rounded-lg"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="border-t border-border pt-4 flex flex-col gap-3">
              {session?.user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full inline-flex h-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-medium"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="w-full inline-flex h-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground font-medium">Log in</Link>
                  <Link href="/signup" className="w-full inline-flex h-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-medium">Sign up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
