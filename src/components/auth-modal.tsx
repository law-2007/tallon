"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface AuthModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: (user: any) => void
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const clearInputs = () => {
        setEmail("")
        setPassword("")
    }

    const handleTabChange = () => {
        setPassword("")
        // Keep email as user might want to switch mode
    }

    const handleAuth = async (action: 'login' | 'signup') => {
        setLoading(true)
        try {
            let result
            if (action === 'signup') {
                result = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        // In production, set this to your verification URL
                        // emailRedirectTo: `${location.origin}/auth/callback`
                    }
                })
            } else {
                result = await supabase.auth.signInWithPassword({ email, password })
            }

            const { data, error } = result

            if (error) throw error

            if (action === 'signup') {
                if (data.session) {
                    toast.success("Account created! You are logged in.")
                    onSuccess(data.user)
                    onClose()
                } else {
                    // Supabase default: Email needs confirmation
                    toast.info("Account created! Check your email to confirm.", {
                        description: "If you don't receive it, ask admin to disable email confirmation."
                    })
                    clearInputs()
                }
            } else if (data.user) {
                toast.success("Welcome back!")
                onSuccess(data.user)
                onClose()
                clearInputs()
            }
        } catch (error: any) {
            toast.error(error.message || "Authentication failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Welcome to Cramly</DialogTitle>
                    <DialogDescription>
                        Sign in to save your decks and access them anywhere.
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="login" className="w-full" onValueChange={handleTabChange}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">Login</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="student@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                    </div>

                    <TabsContent value="login">
                        <Button className="w-full" onClick={() => handleAuth('login')} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Login
                        </Button>
                    </TabsContent>
                    <TabsContent value="signup">
                        <Button className="w-full" onClick={() => handleAuth('signup')} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Account
                        </Button>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
