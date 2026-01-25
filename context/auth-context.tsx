"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface AuthContextType {
    isAuthenticated: boolean
    login: () => void
    logout: () => void
    isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        // Check localStorage on mount
        const storedAuth = localStorage.getItem("pluto_authenticated")
        if (storedAuth === "true") {
            setIsAuthenticated(true)
        }
        setIsLoading(false)
    }, [])

    const login = () => {
        localStorage.setItem("pluto_authenticated", "true")
        setIsAuthenticated(true)
        router.push("/demo")
    }

    const logout = () => {
        localStorage.removeItem("pluto_authenticated")
        setIsAuthenticated(false)
        router.push("/")
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
