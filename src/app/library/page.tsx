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

    useEffect(() => {
        fetchDecks()
    }, [])

    const fetchDecks = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
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
            if (!data || data.length === 0) throw new Error("Delete failed")

            setDecks(prev => prev.filter(d => d.id !== deckToDelete))
            toast.success("Deck deleted")
        } catch (error: any) {
            toast.error("Delete failed")
        } finally {
            setDeckToDelete(null)
        }
    }

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" /></div>
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Your Decks</h1>
                    <p className="text-muted-foreground">Select a deck to start studying.</p>
                </div>
            </div>

            {decks.length === 0 ? (
                <div className="text-center py-20 border rounded-2xl border-white/5 bg-white/5 border-dashed">
                    <h3 className="text-lg font-medium text-muted-foreground mb-4">No decks found</h3>
                    <Link href="/generate">
                        <Button>Create your first deck</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 p-4">
                    {decks.map((deck, i) => {
                        // Deterministic pastel color logic to avoid adjacent repeats
                        const colors = ['bg-[#fdf2b8]', 'bg-[#d3f4f6]', 'bg-[#e4dcf7]', 'bg-[#fad4e4]', 'bg-[#d7f9d8]', 'bg-[#fbe7c6]'];
                        // Use index-based coloring modulo length to ensure sequence loop, minimizing neighbors having same color in standard grid flow
                        const color = colors[i % colors.length];
                        const rotate = (i % 2 === 0 ? 1 : -1) * (1 + (deck.id.charCodeAt(deck.id.length - 1) % 3)); // Slight random rotation

                        return (
                            <Link href={`/library/${deck.id}`} key={deck.id} className="block group">
                                <div className="relative w-full aspect-video transition-transform hover:scale-105 duration-300 ease-out cursor-pointer">
                                    {/* Stack effect layers */}
                                    <div className={`absolute inset-0 ${color} rounded-sm shadow-sm translate-y-2 translate-x-2 rotate-2 opacity-60`} />
                                    <div className={`absolute inset-0 ${color} rounded-sm shadow-sm translate-y-1 translate-x-1 rotate-1 opacity-80`} />

                                    {/* Main Note */}
                                    <div
                                        className={`absolute inset-0 ${color} rounded-sm shadow-md p-6 flex flex-col justify-between transform transition-transform group-hover:-translate-y-1`}
                                        style={{ transform: `rotate(${rotate}deg)` }}
                                    >
                                        {/* Paper Texture */}
                                        <div className="absolute inset-0 opacity-[0.4] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none rounded-sm" />

                                        {/* Paper Clip */}
                                        {/* Randomize between silver, gold, black clips and position */}
                                        {/* Paper Clip - Single Clean SVG */}
                                        <div
                                            className="absolute -top-5 w-8 h-12 z-20 drop-shadow-md opacity-90"
                                            style={{
                                                left: i % 3 === 0 ? "10%" : i % 3 === 1 ? "45%" : "20%",
                                                transform: `rotate(${i % 2 === 0 ? -5 : 5}deg)`
                                            }}
                                        >
                                            <svg viewBox="0 0 54 125" fill="none" className="w-full h-full text-zinc-400">
                                                <path
                                                    d="M20.5 7.5C20.5 3.63401 23.634 0.5 27.5 0.5C31.366 0.5 34.5 3.63401 34.5 7.5V107.5C34.5 116.889 26.8888 124.5 17.5 124.5C8.11116 124.5 0.5 116.889 0.5 107.5V37.5"
                                                    stroke="currentColor"
                                                    strokeWidth="8"
                                                    strokeLinecap="round"
                                                />
                                                <path
                                                    d="M53.5 17.5V107.5C53.5 116.889 45.8888 124.5 36.5 124.5"
                                                    stroke="currentColor"
                                                    strokeWidth="8"
                                                    strokeLinecap="round"
                                                />
                                                {/* Simple clip U-shape */}
                                            </svg>
                                        </div>

                                        <div className="relative z-10">
                                            <h3 className="font-special-elite text-2xl text-zinc-900 leading-tight mb-2 line-clamp-2">
                                                {deck.title}
                                            </h3>
                                            <p className="text-zinc-600 font-mono text-xs uppercase tracking-widest">
                                                {deck.card_count || 0} Cards
                                            </p>
                                        </div>

                                        <div className="relative z-10 flex justify-between items-end border-t border-zinc-900/10 pt-4 mt-2">
                                            <span className="text-[10px] font-mono text-zinc-500 uppercase">
                                                {new Date(deck.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}

            <Dialog open={!!deckToDelete} onOpenChange={(open) => !open && setDeckToDelete(null)}>
                <DialogContent className="bg-zinc-900 border-white/10 text-zinc-100">
                    <DialogHeader>
                        <DialogTitle>Delete Deck</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Are you sure you want to delete this deck? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeckToDelete(null)} className="border-white/10 hover:bg-white/5 text-zinc-300">Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete} className="bg-red-500/20 text-red-300 hover:bg-red-500/30">Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
