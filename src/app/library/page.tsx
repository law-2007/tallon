"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { PlusCircle, BookOpen, Loader2, Trash2 } from "lucide-react"
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

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation() // Prevent card click
        if (!confirm("Delete this deck?")) return

        try {
            const { error } = await supabase.from('decks').delete().eq('id', id)
            if (error) throw error
            setDecks(prev => prev.filter(d => d.id !== id))
            toast.success("Deck deleted")
        } catch (error) {
            toast.error("Delete failed")
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
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 pr-8 truncate">
                                    <BookOpen className="h-4 w-4 text-primary shrink-0" />
                                    <Link href={`/?deck=${deck.id}`} className="hover:underline truncate">
                                        {deck.title}
                                    </Link>
                                </CardTitle>
                                <CardDescription>{deck.card_count || 0} cards</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col flex-1 justify-end">
                                <div className="text-sm text-muted-foreground mb-4">
                                    Created: {new Date(deck.created_at).toLocaleDateString()}
                                </div>
                                <div className="flex gap-2">
                                    <Link
                                        href={`/?deck=${deck.id}`}
                                        className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "flex-1")}
                                    >
                                        Study
                                    </Link>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-destructive hover:bg-destructive/10 shrink-0"
                                        onClick={(e) => handleDelete(e, deck.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
