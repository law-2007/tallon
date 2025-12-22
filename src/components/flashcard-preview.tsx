"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Wand2, Download, RefreshCw, Layers, Edit3, PlusCircle, Sparkles } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { MathDisplay } from "./math-display"
import { toast } from "sonner"

export interface Flashcard {
    id: string
    front: string
    back: string
    status?: 'again' | 'hard' | 'good' | 'easy'
}

interface FlashcardPreviewProps {
    initialCards: Flashcard[]
    onExport: (cards: Flashcard[]) => void
    initialMode?: 'edit' | 'study'
}

export function FlashcardPreview({ initialCards, onExport, initialMode = 'edit' }: FlashcardPreviewProps) {
    const [cards, setCards] = useState<Flashcard[]>(initialCards)
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [mode, setMode] = useState<'edit' | 'study'>(initialMode)

    // Study Mode State
    const [studyQueue, setStudyQueue] = useState<Flashcard[]>([])
    const [isFlipped, setIsFlipped] = useState(false)
    const [sessionStart, setSessionStart] = useState<number>(Date.now())
    const [completedCount, setCompletedCount] = useState(0)
    const [showCompletion, setShowCompletion] = useState(false)

    // Initial setup for study mode
    useEffect(() => {
        if (initialMode === 'study') {
            startStudySession()
        }
    }, [initialMode])

    const startStudySession = () => {
        setStudyQueue([...cards])
        setCompletedCount(0)
        setSessionStart(Date.now())
        setShowCompletion(false)
        setIsFlipped(false)
        setMode('study')
    }

    const handleModeChange = (newMode: 'edit' | 'study') => {
        setMode(newMode)
        if (newMode === 'study') {
            startStudySession()
        }
    }

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

    const handleRating = (rating: 'again' | 'hard' | 'good' | 'easy') => {
        const currentCard = studyQueue[0]
        const remaining = studyQueue.slice(1)

        setIsFlipped(false)

        if (rating === 'again' || rating === 'hard') {
            // Re-queue card
            setStudyQueue([...remaining, currentCard])
        } else {
            // Mark complete
            setCompletedCount(prev => prev + 1)
            if (remaining.length === 0) {
                setShowCompletion(true)
                return
            }
            setStudyQueue(remaining)
        }
    }

    const handleAddCard = () => {
        const newCard: Flashcard = {
            id: crypto.randomUUID(),
            front: "",
            back: ""
        }
        setCards([...cards, newCard])
    }

    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000)
        const minutes = Math.floor(seconds / 60)
        return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`
    }

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card/50 p-4 rounded-xl border backdrop-blur-sm sticky top-4 z-10 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <Layers className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Your Deck</h2>
                        <p className="text-sm text-muted-foreground">
                            {mode === 'study' && !showCompletion
                                ? `${studyQueue.length} cards to review`
                                : `${cards.length} cards total`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex p-1 bg-muted rounded-lg border w-full sm:w-auto">
                        <button
                            onClick={() => handleModeChange('edit')}
                            className={cn(
                                "flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all w-full sm:w-auto",
                                mode === 'edit' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Edit3 className="w-4 h-4" />
                            Edit
                        </button>
                        <button
                            onClick={() => handleModeChange('study')}
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
                        key="edit-container"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                        </div>
                        <Button
                            onClick={handleAddCard}
                            variant="outline"
                            className="w-full border-dashed h-24 hover:bg-accent/50 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all"
                        >
                            <PlusCircle className="w-6 h-6 mr-2" />
                            Add New Flashcard
                        </Button>
                    </motion.div>
                ) : showCompletion ? (
                    <CompletionView
                        timeSpent={formatTime(Date.now() - sessionStart)}
                        cardsReviewed={completedCount}
                        onRestart={startStudySession}
                    />
                ) : (
                    <div className="max-w-2xl mx-auto">
                        <div className="mb-4 text-center text-sm text-stone-500 font-medium font-mono">
                            {studyQueue.length > 0 ? `Current Card` : "Done"}
                        </div>

                        {studyQueue.length > 0 && (
                            <>
                                <div className="relative w-full aspect-[4/3]">
                                    <AnimatePresence mode="popLayout" initial={false}>
                                        <motion.div
                                            key={studyQueue[0].id}
                                            initial={{ opacity: 0, x: 100, rotate: 2 }}
                                            animate={{ opacity: 1, x: 0, rotate: 0 }}
                                            exit={{ opacity: 0, x: -100, rotate: -2 }}
                                            transition={{ type: "spring", stiffness: 200, damping: 25 }}
                                            className="absolute inset-0 z-0"
                                        >
                                            <StickyNote
                                                card={studyQueue[0]}
                                                isFlipped={isFlipped}
                                                onFlip={() => setIsFlipped(!isFlipped)}
                                            />
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* Controls */}
                                <div className="mt-8 flex justify-center items-center gap-4 h-16 relative z-10 pt-8">
                                    {!isFlipped ? (
                                        <Button
                                            size="lg"
                                            className="w-full max-w-xs text-lg shadow-md transition-all hover:scale-105 active:scale-95"
                                            onClick={() => setIsFlipped(true)}
                                        >
                                            Show Answer
                                        </Button>
                                    ) : (
                                        <div className="grid grid-cols-4 gap-2 w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
                                            <div className="flex flex-col gap-1 items-center">
                                                <Button
                                                    variant="secondary"
                                                    className="w-full bg-red-100 hover:bg-red-200 text-red-700 border-red-200"
                                                    onClick={() => handleRating('again')}
                                                >
                                                    Again
                                                </Button>
                                            </div>
                                            <div className="flex flex-col gap-1 items-center">
                                                <Button
                                                    variant="secondary"
                                                    className="w-full bg-amber-100 hover:bg-amber-200 text-amber-700 border-amber-200"
                                                    onClick={() => handleRating('hard')}
                                                >
                                                    Hard
                                                </Button>
                                            </div>
                                            <div className="flex flex-col gap-1 items-center">
                                                <Button
                                                    variant="secondary"
                                                    className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-200"
                                                    onClick={() => handleRating('good')}
                                                >
                                                    Good
                                                </Button>
                                            </div>
                                            <div className="flex flex-col gap-1 items-center">
                                                <Button
                                                    variant="secondary"
                                                    className="w-full bg-green-100 hover:bg-green-200 text-green-700 border-green-200"
                                                    onClick={() => handleRating('easy')}
                                                >
                                                    Easy
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

function CompletionView({ timeSpent, cardsReviewed, onRestart }: { timeSpent: string, cardsReviewed: number, onRestart: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center space-y-8 relative overflow-hidden rounded-xl border bg-card/50"
        >
            <div className="bg-primary/10 p-6 rounded-full relative z-10">
                <motion.div
                    animate={{
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1],
                        color: ["#eab308", "#22c55e", "#3b82f6", "#eab308"] // Yellow, Green, Blue, Yellow
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                >
                    <Sparkles className="w-16 h-16" />
                </motion.div>
            </div>
            <div className="space-y-2 relative z-10">
                <h2 className="text-3xl font-bold tracking-tight">Deck Completed!</h2>
                <p className="text-muted-foreground text-lg">You are making great progress.</p>
            </div>

            <div className="grid grid-cols-2 gap-8 w-full max-w-md relative z-10">
                <div className="bg-card border p-6 rounded-2xl shadow-sm">
                    <div className="text-3xl font-bold text-primary">{cardsReviewed}</div>
                    <div className="text-sm text-muted-foreground uppercase tracking-widest font-medium">Cards Reviewed</div>
                </div>
                <div className="bg-card border p-6 rounded-2xl shadow-sm">
                    <div className="text-3xl font-bold text-primary">{timeSpent}</div>
                    <div className="text-sm text-muted-foreground uppercase tracking-widest font-medium">Time Focused</div>
                </div>
            </div>

            <Button size="lg" onClick={onRestart} className="px-8">
                <RefreshCw className="mr-2 h-4 w-4" />
                Review Again
            </Button>
        </motion.div>
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

function StickyNote({ card, isFlipped, onFlip }: { card: Flashcard, isFlipped: boolean, onFlip: () => void }) {
    return (
        <div
            className="w-full h-full cursor-pointer perspective-1000 group relative"
            onClick={onFlip}
        >
            <motion.div
                className="relative w-full h-full transition-all duration-500 transform-style-3d shadow-xl"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 260, damping: 20 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Front (Question) */}
                <div className="absolute inset-0 w-full h-full backface-hidden">
                    <div className="w-full h-full bg-[#fef9c3] p-8 flex flex-col items-center justify-center text-center shadow-lg transform rotate-[0.5deg]">
                        {/* Tape effect */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-white/30 backdrop-blur-sm rotate-[-1deg] shadow-sm z-10" />

                        <div className="font-serif text-2xl text-stone-800 leading-relaxed max-w-md overflow-y-auto max-h-full scrollbar-none">
                            <MathDisplay content={card.front} />
                        </div>
                        <div className="absolute bottom-4 text-xs text-stone-400 font-mono tracking-widest uppercase">
                            Click to reveal
                        </div>
                    </div>
                </div>

                {/* Back (Answer) */}
                <div
                    className="absolute inset-0 w-full h-full backface-hidden"
                    style={{ transform: "rotateY(180deg)" }}
                >
                    <div className="w-full h-full bg-[#fef9c3] p-8 flex flex-col items-center justify-center text-center shadow-lg transform rotate-[-0.5deg]">
                        {/* Tape effect */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-white/30 backdrop-blur-sm rotate-[1deg] shadow-sm z-10" />

                        <div className="font-serif text-2xl text-stone-800 leading-relaxed max-w-md overflow-y-auto max-h-full scrollbar-none">
                            <MathDisplay content={card.back} />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Subtle shadow underneath */}
            <div className="absolute inset-0 bg-black/5 blur-xl -z-10 translate-y-4" />
        </div>
    )
}
