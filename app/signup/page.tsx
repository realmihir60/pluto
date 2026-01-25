"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Activity, ArrowLeft } from "lucide-react"
import { useAuth } from "@/context/auth-context"

export default function SignupPage() {
    const { login } = useAuth()
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 -z-10 bg-background">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-md">
                {/* Back Link */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
                >
                    <ArrowLeft className="size-4" />
                    Back to Home
                </Link>

                {/* Card */}
                <div className="bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl p-8 shadow-xl ring-1 ring-white/5">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="mx-auto size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                            <Activity className="size-6 text-primary" />
                        </div>
                        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Create an account</h1>
                        <p className="text-sm text-muted-foreground mt-2">
                            Join Pluto to track your health patterns securely.
                        </p>
                    </div>

                    {/* Form */}
                    <form className="space-y-4" onSubmit={(e) => {
                        e.preventDefault();
                        login();
                    }}>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first-name">First name</Label>
                                <Input id="first-name" placeholder="Jane" className="bg-background/50 border-border/50" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last-name">Last name</Label>
                                <Input id="last-name" placeholder="Doe" className="bg-background/50 border-border/50" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                className="bg-background/50 border-border/50 focus:bg-background transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Create a password"
                                className="bg-background/50 border-border/50 focus:bg-background transition-colors"
                            />
                        </div>

                        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-10 mt-2">
                            Create Account
                        </Button>
                    </form>

                    {/* Footer */}
                    <p className="text-xs text-center text-muted-foreground mt-6 leading-relaxed">
                        By clicking continue, you agree to our{" "}
                        <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link>
                        {" "}and{" "}
                        <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
                    </p>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-muted-foreground mt-6">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary hover:underline font-medium">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}
