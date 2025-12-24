
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Wand2, Download, RefreshCw, Layers, Edit3, PlusCircle, Sparkles, Trash2 } from "lucide-react"
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
    onCardsChange: (cards: Flashcard[]) => void
}

export function FlashcardPreview({ initialCards, onExport, initialMode = 'edit', onCardsChange }: FlashcardPreviewProps) {
    const [cards, setCards] = useState<Flashcard[]>(initialCards)
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [mode, setMode] = useState<'edit' | 'study'>(initialMode)

    // Sync from parent (e.g. when loading a deck)
    useEffect(() => {
        setCards(initialCards)
    }, [initialCards])

    // Wrapper to update both local and parent state
    const updateCards = (newCards: Flashcard[]) => {
        setCards(newCards)
        onCardsChange(newCards)
    }

    // ... Study Mode State ...
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
        if (newMode === 'study') {
            // Validate cards before studying
            for (let i = 0; i < cards.length; i++) {
                if (!cards[i].front.trim() || !cards[i].back.trim()) {
                    toast.error(`Card ${i + 1} is incomplete.Please fill both sides before studying.`)
                    return
                }
            }
            startStudySession()
        }
        setMode(newMode)
    }

    const handleUpdate = (id: string, field: 'front' | 'back', value: string) => {
        const newCards = cards.map(card =>
            card.id === id ? { ...card, [field]: value } : card
        )
        updateCards(newCards)
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
            const newCards = cards.map(c => c.id === id ? { ...c, ...refined } : c)
            updateCards(newCards)
        } catch (e) {
            console.error(e)
        } finally {
            setLoadingId(null)
        }
    }

    const handleRating = (rating: 'again' | 'hard' | 'good' | 'easy') => {
        // ... (Study logic affects queue, not card content usually, but if it did it would use updateCards)
        // For now study queue rating doesn't change card content, just queue flow.
        const currentCard = studyQueue[0]
        const remaining = studyQueue.slice(1)

        setIsFlipped(false)

        if (rating === 'again' || rating === 'hard') {
            setStudyQueue([...remaining, currentCard])
        } else {
            setCompletedCount(prev => prev + 1)
            if (remaining.length === 0) {
                setShowCompletion(true)
                return
            }
            setStudyQueue(remaining)
        }
    }

    const handleSkip = (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent flip
        const currentCard = studyQueue[0]
        const remaining = studyQueue.slice(1)
        // Move current card to the end of the queue
        setStudyQueue([...remaining, currentCard])
        setIsFlipped(false)
        toast.info("Card skipped. It will appear again later.", { duration: 1500 })
    }

    const handleAddCard = () => {
        const newCard: Flashcard = {
            id: crypto.randomUUID(),
            front: "",
            back: ""
        }
        updateCards([...cards, newCard])
    }

    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000)
        const minutes = Math.floor(seconds / 60)
        return minutes > 0 ? `${minutes}m ${seconds % 60} s` : `${seconds} s`
    }

    const handleDeleteCard = (id: string, index: number) => {
        // Confirmation could be optional for single cards, but better safe.
        // For speed, let's just delete or use a small toast undo? 
        // User asked for "delete a card from the deck".
        const newCards = cards.filter(c => c.id !== id)
        updateCards(newCards)
        toast.success("Card deleted")
    }

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border sticky top-4 z-10 shadow-sm">
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
                            <AnimatePresence>
                                {cards.map((card, index) => (
                                    <motion.div
                                        key={card.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    >
                                        <EditableCard
                                            card={card}
                                            index={index}
                                            loadingId={loadingId}
                                            onUpdate={handleUpdate}
                                            onRefine={handleSmartRefine}
                                            onDelete={() => handleDeleteCard(card.id, index)}
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
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
                                            variant="secondary"
                                            className="w-full max-w-xs text-lg shadow-sm transition-all hover:bg-secondary/80"
                                            onClick={handleSkip}
                                        >
                                            Skip Card
                                        </Button>
                                    ) : (
                                        <div className="grid grid-cols-4 gap-2 w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
                                            <div className="flex flex-col gap-1 items-center">
                                                <Button
                                                    variant="secondary"
                                                    className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20"
                                                    onClick={() => handleRating('again')}
                                                >
                                                    Again
                                                </Button>
                                            </div>
                                            <div className="flex flex-col gap-1 items-center">
                                                <Button
                                                    variant="secondary"
                                                    className="w-full bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                                                    onClick={() => handleRating('hard')}
                                                >
                                                    Hard
                                                </Button>
                                            </div>
                                            <div className="flex flex-col gap-1 items-center">
                                                <Button
                                                    variant="secondary"
                                                    className="w-full bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border-sky-500/20"
                                                    onClick={() => handleRating('good')}
                                                >
                                                    Good
                                                </Button>
                                            </div>
                                            <div className="flex flex-col gap-1 items-center">
                                                <Button
                                                    variant="secondary"
                                                    className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
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

function EditableCard({ card, index, loadingId, onUpdate, onRefine, onDelete }: any) {
    return (
        <Card className="group relative transition-all hover:scale-[1.02] hover:shadow-2xl border-[var(--palette-taupe)]/20 bg-white rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                    Card {index + 1}
                </CardTitle>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/10 rounded-full">
                                {loadingId === card.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-zinc-300">
                            <DropdownMenuItem onClick={() => onRefine(card.id, "Make it simpler")}>Make Simpler</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onRefine(card.id, "Add a mnemonic")}>Add Mnemonic</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:bg-red-400/10 rounded-full"
                        onClick={onDelete}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase text-indigo-400/80">Question</label>
                    <Textarea
                        value={card.front}
                        onChange={(e) => onUpdate(card.id, 'front', e.target.value)}
                        className="min-h-[80px] resize-none border-white/5 bg-black/20 focus-visible:ring-1 focus-visible:ring-indigo-500/50 text-sm rounded-xl"
                        placeholder="Front side..."
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase text-purple-400/80">Answer</label>
                    <Textarea
                        value={card.back}
                        onChange={(e) => onUpdate(card.id, 'back', e.target.value)}
                        className="min-h-[100px] resize-none border-white/5 bg-black/20 focus-visible:ring-1 focus-visible:ring-purple-500/50 text-sm rounded-xl"
                        placeholder="Back side..."
                    />
                </div>
            </CardContent>
        </Card>
    )
}

function StickyNote({ card, isFlipped, onFlip }: { card: Flashcard, isFlipped: boolean, onFlip: () => void }) {
    // Deterministic color based on card ID
    const colors = ['bg-[#fdf2b8]', 'bg-[#d3f4f6]', 'bg-[#e4dcf7]', 'bg-[#fad4e4]', 'bg-[#d7f9d8]', 'bg-[#fbe7c6]'];
    const color = colors[card.id.charCodeAt(0) % colors.length];

    return (
        <div
            className="w-full h-full cursor-pointer perspective-1000 group relative"
            onClick={onFlip}
        >
            <motion.div
                className="relative w-full h-full transition-all duration-300 transform-style-3d shadow-xl"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.15, type: "spring", stiffness: 260, damping: 20 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Front (Question) */}
                <div
                    className={`absolute inset-0 w-full h-full backface-hidden ${color} rounded-sm shadow-md overflow-hidden`}
                    style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: "rotateY(0deg) translateZ(1px)" /* Force it slightly forward */
                    }}
                >
                    <div className="w-full h-full p-8 flex flex-col items-center justify-center text-center relative">
                        {/* Paper Texture Overlay */}
                        <div className="absolute inset-0 opacity-[0.6] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-multiply" />

                        {/* Tape - Top Center */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-8 bg-white/40 backdrop-blur-[1px] shadow-sm rotate-[-1deg] z-10" />

                        {/* Front Indicator */}
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full border border-black/10 text-[10px] uppercase tracking-widest text-black/40 font-bold z-10">
                            Question
                        </div>

                        <div className="font-special-elite text-3xl md:text-4xl text-zinc-900 leading-relaxed max-w-lg overflow-y-auto max-h-[80%] scrollbar-hide z-10 font-bold">
                            <MathDisplay content={card.front} />
                        </div>
                        <div className="absolute bottom-4 text-xs text-zinc-500/60 font-mono tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            Click to flip
                        </div>
                    </div>
                </div>

                {/* Back (Answer) */}
                <div
                    className={`absolute inset-0 w-full h-full backface-hidden ${color} rounded-sm shadow-md overflow-hidden`}
                    style={{
                        transform: "rotateY(180deg) translateZ(1px)", /* Match padding */
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden'
                    }}
                >
                    <div className="w-full h-full p-8 flex flex-col items-center justify-center text-center relative">
                        {/* Paper Texture Overlay */}
                        <div className="absolute inset-0 opacity-[0.6] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-multiply" />

                        {/* Tape - Top Center */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-8 bg-white/40 backdrop-blur-[1px] shadow-sm rotate-[1deg] z-10" />

                        {/* Back Indicator */}
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full border border-black/10 text-[10px] uppercase tracking-widest text-black/40 font-bold z-10">
                            Answer
                        </div>

                        <div className="font-space-mono text-xl md:text-2xl text-zinc-900 leading-relaxed max-w-lg overflow-y-auto max-h-[80%] scrollbar-hide z-10 font-medium">
                            <MathDisplay content={card.back} />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Shadow underneath - Removed dark bloom */}
            {/* <div className="absolute inset-0 bg-black/20 blur-xl -z-10 translate-y-4 rounded-full opacity-60" /> */}
        </div>
    )
}
