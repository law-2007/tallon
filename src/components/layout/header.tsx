"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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

        return () => subscription.unsubscribe()
    }, [])

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-14 items-center justify-between px-4">
                <div className="flex items-center">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <span className="hidden font-bold sm:inline-block">
                            Cramly
                        </span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        <Link
                            href="/"
                            className={cn(
                                "transition-colors hover:text-foreground/80",
                                pathname === "/" ? "text-foreground" : "text-foreground/60"
                            )}
                        >
                            Generate
                        </Link>
                        <Link
                            href="/library"
                            className={cn(
                                "transition-colors hover:text-foreground/80",
                                pathname === "/library" ? "text-foreground" : "text-foreground/60"
                            )}
                        >
                            Library
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-2">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <div className="hidden md:block text-xs text-muted-foreground">{user.email}</div>
                            <UserNav />
                        </div>
                    ) : (
                        <Button onClick={() => setShowAuth(true)} size="sm">
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
