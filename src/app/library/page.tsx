"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PlusCircle, BookOpen, Loader2, Trash2, Info, Calendar } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface Deck {
    id: string
    title: string
    created_at: string
    card_count?: number
}

export default function LibraryPage() {
    const [decks, setDecks] = useState<Deck[]>([])
    const [loading, setLoading] = useState(true)
    const [deckToDelete, setDeckToDelete] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        fetchDecks()
    }, [])

    const fetchDecks = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                // If no user, we can't show library. Redirect or show empty?
                // User asked: "why is there 3 decks... it should be empty"
                setDecks([])
                setLoading(false)
                return
            }

            const { data, error } = await supabase
                .from('decks')
                .select('*, cards(count)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error

            const formattedDecks = data.map((d: any) => ({
                ...d,
                card_count: d.cards[0]?.count || 0
            }))

            setDecks(formattedDecks)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load library")
        } finally {
            setLoading(false)
        }
    }

    const confirmDelete = async () => {
        if (!deckToDelete) return

        try {
            const { data, error } = await supabase.from('decks').delete().eq('id', deckToDelete).select()

            if (error) throw error

            if (!data || data.length === 0) {
                throw new Error("Could not delete deck. Check 'DELETE' RLS policy.")
            }

            setDecks(prev => prev.filter(d => d.id !== deckToDelete))
            toast.success("Deck deleted")
        } catch (error: any) {
            console.error("Delete error:", error)
            toast.error("Delete failed: " + (error.message || "Unknown error"))
        } finally {
            setDeckToDelete(null)
        }
    }

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
    }

    return (
        <div className="container py-8 mx-auto px-4 min-h-screen">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Library</h1>
                    <p className="text-muted-foreground">Manage your flashcard decks.</p>
                </div>
                <Link href="/">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create New Deck
                    </Button>
                </Link>
            </div>

            {decks.length === 0 ? (
                <div className="text-center py-20 border rounded-lg bg-muted/20">
                    <h3 className="text-lg font-medium text-muted-foreground mb-4">No decks found</h3>
                    <Link href="/">
                        <Button variant="outline">Create your first deck</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {decks.map((deck) => (
                        <Card
                            key={deck.id}
                            className="hover:shadow-md transition-shadow group relative flex flex-col h-full"
                        >
                            <CardHeader className="pb-2 relative">
                                <div className="absolute top-4 right-4 z-10">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                                                <Info className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem className="text-xs text-muted-foreground cursor-default focus:bg-transparent">
                                                <Calendar className="mr-2 h-3 w-3" />
                                                Created: {new Date(deck.created_at).toLocaleDateString()}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <CardTitle className="flex items-center gap-2 pr-8 truncate">
                                    <BookOpen className="h-4 w-4 text-primary shrink-0" />
                                    <Link href={`/?deck=${deck.id}`} className="hover:underline truncate text-lg">
                                        {deck.title}
                                    </Link>
                                </CardTitle>
                                <CardDescription>{deck.card_count || 0} cards</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col flex-1 justify-end pt-4">
                                <div className="flex gap-2">
                                    <Link
                                        href={`/?deck=${deck.id}`}
                                        className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "flex-1 font-medium")}
                                    >
                                        Study
                                    </Link>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0"
                                        onClick={(e) => { e.stopPropagation(); setDeckToDelete(deck.id); }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={!!deckToDelete} onOpenChange={(open) => !open && setDeckToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Deck</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this deck? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeckToDelete(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
