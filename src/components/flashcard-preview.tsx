"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Wand2, Download, RefreshCw, Layers, Edit3 } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

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
    const [mode, setMode] = useState<'edit' | 'study'>('edit')

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
        } catch (e) {
            console.error(e)
        } finally {
            setLoadingId(null)
        }
    }

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card/50 p-4 rounded-xl border backdrop-blur-sm sticky top-4 z-10 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <Layers className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Your Deck</h2>
                        <p className="text-sm text-muted-foreground">{cards.length} cards generated</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex p-1 bg-muted rounded-lg border w-full sm:w-auto">
                        <button
                            onClick={() => setMode('edit')}
                            className={cn(
                                "flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all w-full sm:w-auto",
                                mode === 'edit' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Edit3 className="w-4 h-4" />
                            Edit
                        </button>
                        <button
                            onClick={() => setMode('study')}
                            className={cn(
                                "flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all w-full sm:w-auto",
                                mode === 'study' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Layers className="w-4 h-4" />
                            Study
                        </button>
                    </div>
                    <Button onClick={() => onExport(cards)} className="gap-2 hidden sm:flex">
                        <Download className="w-4 h-4" />
                        Export
                    </Button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {mode === 'edit' ? (
                    <motion.div
                        key="edit-grid"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                    >
                        {cards.map((card, index) => (
                            <EditableCard
                                key={card.id}
                                card={card}
                                index={index}
                                loadingId={loadingId}
                                onUpdate={handleUpdate}
                                onRefine={handleSmartRefine}
                            />
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        key="study-grid"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        {cards.map((card, index) => (
                            <FlipCard key={card.id} card={card} index={index} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex justify-center sm:hidden pt-4">
                <Button onClick={() => onExport(cards)} className="w-full gap-2">
                    <Download className="w-4 h-4" />
                    Export to Anki
                </Button>
            </div>
        </div>
    )
}

function EditableCard({ card, index, loadingId, onUpdate, onRefine }: any) {
    return (
        <Card className="group relative transition-all hover:shadow-lg border-muted/60 bg-gradient-to-br from-card to-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                    Card {index + 1}
                </CardTitle>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                            {loadingId === card.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onRefine(card.id, "Make it simpler")}>Make Simpler</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onRefine(card.id, "Add a mnemonic")}>Add Mnemonic</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onRefine(card.id, "Translate to Spanish")}>Translate to Spanish</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase text-primary/60">Question</label>
                    <Textarea
                        value={card.front}
                        onChange={(e) => onUpdate(card.id, 'front', e.target.value)}
                        className="min-h-[80px] resize-none border-0 bg-secondary/30 focus-visible:ring-1 focus-visible:ring-primary/20 text-sm"
                        placeholder="Front side..."
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase text-primary/60">Answer</label>
                    <Textarea
                        value={card.back}
                        onChange={(e) => onUpdate(card.id, 'back', e.target.value)}
                        className="min-h-[100px] resize-none border-0 bg-secondary/30 focus-visible:ring-1 focus-visible:ring-primary/20 text-sm"
                        placeholder="Back side..."
                    />
                </div>
            </CardContent>
        </Card>
    )
}

function FlipCard({ card, index }: { card: Flashcard, index: number }) {
    const [isFlipped, setIsFlipped] = useState(false)

    return (
        <div
            className="h-[300px] w-full cursor-pointer perspective-1000 group"
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <motion.div
                className="relative h-full w-full transition-all duration-500 transform-style-3d"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Front */}
                <div className="absolute inset-0 h-full w-full backface-hidden">
                    <Card className="h-full flex flex-col items-center justify-center p-6 text-center shadow-md border-primary/10 bg-gradient-to-br from-card to-secondary/10 hover:shadow-xl transition-shadow">
                        <div className="absolute top-4 left-4 text-xs font-bold text-muted-foreground/50">#{index + 1}</div>
                        <div className="bg-primary/5 p-3 rounded-full mb-4 group-hover:bg-primary/10 transition-colors">
                            <Layers className="w-6 h-6 text-primary/60" />
                        </div>
                        <p className="text-lg font-medium text-foreground/90 font-serif leading-relaxed">
                            {card.front}
                        </p>
                        <div className="absolute bottom-4 text-xs text-muted-foreground/60 font-medium tracking-wide uppercase">
                            Click to flip
                        </div>
                    </Card>
                </div>

                {/* Back */}
                <div
                    className="absolute inset-0 h-full w-full backface-hidden"
                    style={{ transform: "rotateY(180deg)" }}
                >
                    <Card className="h-full flex flex-col items-center justify-center p-6 text-center shadow-lg border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                        <p className="text-base text-foreground/80 leading-relaxed">
                            {card.back}
                        </p>
                    </Card>
                </div>
            </motion.div>
        </div>
    )
}
