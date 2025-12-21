"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Wand2, Download, RefreshCw, Save, MoreHorizontal } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner" // or fallback

export interface Flashcard {
    id: string
    front: string
    back: string
}

interface FlashcardPreviewProps {
    initialCards: Flashcard[]
    onExport: (cards: Flashcard[]) => void
}

export function FlashcardPreview({ initialCards, onExport }: FlashcardPreviewProps) {
    const [cards, setCards] = useState<Flashcard[]>(initialCards)
    const [loadingId, setLoadingId] = useState<string | null>(null)

    const handleUpdate = (id: string, field: 'front' | 'back', value: string) => {
        setCards(cards.map(card =>
            card.id === id ? { ...card, [field]: value } : card
        ))
    }

    const handleSmartRefine = async (id: string, instruction: string) => {
        const cardToRefine = cards.find(c => c.id === id)
        if (!cardToRefine) return

        setLoadingId(id)
        try {
            const res = await fetch('/api/refine', {
                method: 'POST',
                body: JSON.stringify({ card: cardToRefine, instruction }),
            })
            if (!res.ok) throw new Error("Refinement failed")

            const refined = await res.json()
            setCards(cards.map(c => c.id === id ? { ...c, ...refined } : c))
            // toast("Card updated!")
        } catch (e) {
            console.error(e)
            // toast("Failed to refine card", "error")
        } finally {
            setLoadingId(null)
        }
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Your Flashcards</h2>
                <Button onClick={() => onExport(cards)} className="gap-2">
                    <Download className="w-4 h-4" />
                    Export to Anki
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {cards.map((card, index) => (
                    <Card key={card.id} className="group relative transition-all hover:shadow-md border-muted-foreground/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Card {index + 1}
                            </CardTitle>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                            {loadingId === card.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleSmartRefine(card.id, "Make it simpler")}>
                                            Make Simpler
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleSmartRefine(card.id, "Add a mnemonic")}>
                                            Add Mnemonic
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleSmartRefine(card.id, "Translate to Spanish")}>
                                            Translate to Spanish
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase text-muted-foreground">Term</label>
                                <Textarea
                                    value={card.front}
                                    onChange={(e) => handleUpdate(card.id, 'front', e.target.value)}
                                    className="min-h-[80px] resize-none border-0 bg-secondary/50 focus-visible:ring-1 focus-visible:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase text-muted-foreground">Definition</label>
                                <Textarea
                                    value={card.back}
                                    onChange={(e) => handleUpdate(card.id, 'back', e.target.value)}
                                    className="min-h-[120px] resize-none border-0 bg-secondary/50 focus-visible:ring-1 focus-visible:ring-primary/20"
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
