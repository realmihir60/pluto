"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Session } from "next-auth"
import { signOut } from "next-auth/react"
import { Activity, Menu, X, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/demo", label: "Checkup" },
  { href: "/how-it-works", label: "Methodology" },
  { href: "/trust", label: "Security" },
]

export function Navigation({ session }: { session: Session | null }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "py-4" : "py-6"
        }`}
    >
      <nav
        className={`max-w-5xl mx-auto px-6 transition-all duration-500`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className={`relative glass border border-white/10 rounded-[2rem] px-6 h-16 flex items-center justify-between shadow-2xl shadow-black/5 transition-all duration-500 ${scrolled ? "bg-background/80" : "bg-background/40"
          }`}>
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group"
          >
            <div className="size-8 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
              <Activity className="size-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase text-foreground">Pluto</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <ul className="flex items-center gap-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`relative px-4 py-2 text-sm font-bold tracking-tight transition-all rounded-xl ${isActive
                        ? "text-primary bg-primary/5"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                )
              })}
            </ul>

            <div className="flex items-center gap-4 border-l border-border/50 pl-8">
              {session?.user ? (
                <Button asChild size="sm" className="rounded-xl font-bold tracking-tight shadow-xl shadow-primary/20">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/login" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors px-2">
                    Log in
                  </Link>
                  <Button asChild size="sm" className="h-10 px-6 rounded-xl font-bold tracking-tight primary-gradient shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95">
                    <Link href="/signup">Sign up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-primary transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="size-6" />
            ) : (
              <Menu className="size-6" />
            )}
          </button>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 10, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="md:hidden glass border border-white/10 rounded-[2.5rem] p-6 flex flex-col gap-6 shadow-2xl mt-4 overflow-hidden relative"
            >
              <ul className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between px-6 py-4 text-lg font-bold text-foreground hover:bg-primary/5 rounded-2xl transition-all"
                    >
                      {link.label}
                      <ChevronRight className="size-4 opacity-30" />
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="pt-6 border-t border-border/50 flex flex-col gap-4">
                {session?.user ? (
                  <Button asChild className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20">
                    <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline" className="w-full h-14 rounded-2xl font-bold text-lg">
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>Log in</Link>
                    </Button>
                    <Button asChild className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20">
                      <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>Sign up</Link>
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  )
}
