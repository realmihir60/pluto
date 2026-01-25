"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/demo", label: "Checkup" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/trust", label: "Trust & Safety" },
]

export function Navigation() {
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
            className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
            aria-label="Pluto Home"
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

          {/* Nav Links */}
          <ul className="flex items-center gap-1" role="list">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`relative px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md ${isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="nav-underline"
                        className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary"
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 35,
                        }}
                      />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>
    </header>
  )
}
