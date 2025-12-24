"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
// import { Library, PlusCircle } from "lucide-react" // Unused
import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/user-nav"
import { AuthModal } from "@/components/auth-modal"
import { supabase } from "@/lib/supabase"

export function Header() {
    const pathname = usePathname()
    const [user, setUser] = useState<any>(null)
    const [showAuth, setShowAuth] = useState(false)

    useEffect(() => {
        checkUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null)
        })

        const handleAuthRequest = () => setShowAuth(true)
        window.addEventListener("open-auth", handleAuthRequest)

        return () => {
            subscription.unsubscribe()
            window.removeEventListener("open-auth", handleAuthRequest)
        }
    }, [])

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
    }


    // ... imports

    // ... imports

    if (pathname?.startsWith("/library")) {
        return null
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[var(--header)] text-[var(--header-foreground)] backdrop-blur supports-[backdrop-filter]:bg-[var(--header)]/95 shadow-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <div className="flex items-center">
                    <Link href="/" className="mr-8 flex items-center hover:opacity-90 transition-opacity">
                        <div className="relative h-14 w-auto flex items-center justify-center">
                            <div className="relative w-48 h-full"> {/* Adjusted width for wordmark aspect ratio */}
                                <Image
                                    src="/logo-composite.png?v=2"
                                    alt="Tallon Logo"
                                    fill
                                    className="object-contain object-left"
                                    priority
                                    unoptimized
                                />
                            </div>
                        </div>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        <button
                            onClick={() => {
                                if (user) {
                                    window.location.href = "/generate"
                                } else {
                                    window.dispatchEvent(new CustomEvent("open-auth"))
                                }
                            }}
                            className={cn(
                                "transition-all hover:text-primary bg-transparent border-0 p-0 text-sm font-medium",
                                pathname === "/generate" ? "text-primary font-bold" : "text-muted-foreground"
                            )}
                        >
                            Generate
                        </button>
                        <button
                            onClick={() => {
                                if (user) {
                                    window.location.href = "/library"
                                } else {
                                    window.dispatchEvent(new CustomEvent("open-auth"))
                                }
                            }}
                            className={cn(
                                "transition-all hover:text-primary bg-transparent border-0 p-0 text-sm font-medium",
                                pathname === "/library" ? "text-primary font-bold" : "text-muted-foreground"
                            )}
                        >
                            Library
                        </button>
                    </nav>
                </div>

                <div className="flex items-center gap-2">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <div className="hidden md:block text-xs text-muted-foreground">{user.email}</div>
                            <UserNav />
                        </div>
                    ) : (
                        <Button
                            onClick={() => setShowAuth(true)}
                            size="sm"
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            Sign In
                        </Button>
                    )}
                </div>
            </div>

            <AuthModal
                isOpen={showAuth}
                onClose={() => setShowAuth(false)}
                onSuccess={() => {
                    setShowAuth(false)
                    checkUser()
                }}
            />
        </header>
    )
}
