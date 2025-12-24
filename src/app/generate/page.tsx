"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { FlashcardPreview, Flashcard } from "@/components/flashcard-preview"
import { Button } from "@/components/ui/button"
import { extractText } from "@/lib/ocr"
import { exportToAnki } from "@/lib/anki"
import { supabase } from "@/lib/supabase"

import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { ContentInput } from "@/components/content-input"
import { ManualEntry } from "@/components/manual-entry"

import { AuthModal } from "@/components/auth-modal"

function GenerateContent() {
    const router = useRouter()
    const [step, setStep] = useState<'upload' | 'processing' | 'preview' | 'manual'>('upload')
    const [cards, setCards] = useState<Flashcard[]>([])
    const [deckTitle, setDeckTitle] = useState("")
    const [status, setStatus] = useState("")
    const [initialMode, setInitialMode] = useState<'edit' | 'study'>('edit')
    const [showAuth, setShowAuth] = useState(false)

    const searchParams = useSearchParams()
    const deckId = searchParams.get('deck')

    useEffect(() => {
        if (deckId) {
            loadDeck(deckId)
        }
    }, [deckId])

    const loadDeck = async (id: string) => {
        try {
            setStep('processing')
            setStatus("Loading deck...")

            const { data: deck, error: deckError } = await supabase
                .from('decks')
                .select('*')
                .eq('id', id)
                .single()

            if (deckError) throw deckError

            const { data: fetchedCards, error: cardsError } = await supabase
                .from('cards')
                .select('*')
                .eq('deck_id', id)

            if (cardsError) throw cardsError

            setDeckTitle(deck.title)
            setCards(fetchedCards.map((c: any) => ({
                id: c.id,
                front: c.front,
                back: c.back,
            })))

            setInitialMode('study')
            setStep('preview')
        } catch (error: any) {
            console.error("Deck load error:", error)
            toast.error("Failed to load deck: " + (error.message || "Unknown error"))
            setStep('upload')
        }
    }

    const generateCards = async (text: string, limit: number) => {
        try {
            setStatus(`Generating ${limit} flashcards...`)
            const response = await fetch('/api/generate', {
                method: 'POST',
                body: JSON.stringify({ text, limit }),
            })

            if (!response.ok) throw new Error("Generation failed")

            const data = await response.json()
            const cardsWithIds = data.flashcards.map((c: any) => ({
                ...c,
                id: crypto.randomUUID()
            }))


            setCards(cardsWithIds)
            if (data.title) setDeckTitle(data.title)

            setInitialMode('study')
            setStep('preview')
            toast.success("Generated.")
        } catch (error) {
            console.error(error)
            toast.error("Generation failed.")
            setStep('upload')
        }
    }

    const handleFileSelect = async (file: File, limit: number) => {
        try {
            setStep('processing')
            setStatus("Extracting text...")

            const text = await extractText(file)
            await generateCards(text, limit)

        } catch (error) {
            console.error(error)
            toast.error("Error with file: " + (error instanceof Error ? error.message : "Unknown error"))
            setStep('upload')
        }
    }

    const handleTextSubmit = async (text: string, limit: number) => {
        setStep('processing')
        await generateCards(text, limit)
    }

    const handleManualSave = (newCards: Flashcard[], title: string) => {
        setCards(newCards)
        setDeckTitle(title)
        setInitialMode('study')
        setStep('preview')
        toast.success("Deck ready for preview.")
    }

    const handleExport = async (currentCards: Flashcard[], format: 'anki' | 'csv' = 'anki') => {
        try {
            if (format === 'anki') {
                await exportToAnki(currentCards)
                toast.success("Anki exported.")
            } else if (format === 'csv') {
                const csvContent = "data:text/csv;charset=utf-8,"
                    + currentCards.map(c => `"${c.front.replace(/"/g, '""')}","${c.back.replace(/"/g, '""')}"`).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", "tallon_deck.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("CSV exported.")
            }
        } catch (e) {
            toast.error("Export failed")
        }
    }

    const handleSaveDeck = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            // If user is not logged in, we STILL allow generation (as per previous request), 
            // BUT if they try to SAVE, we prompt login.
            // The issue reported is "generate button still asks for sign in".
            // The button "Generate Flashcards" in `ContentInput` calls `onTextSubmit` or `onFileSelect`.
            // Those call `generateCards`. `generateCards` does NOT have an auth check.
            // However, the `handleSaveDeck` function DOES.
            // Let's verify if `handleSaveDeck` is being called inappropriately.
            // It is not.
            // Wait, the user said "Generate button".
            // Let's check `ContentInput` to see if IT triggers something.
            // Ah, maybe the user means the "Start Generating" on the landing page redirects to /generate 
            // and `GeneratePage` has a `useEffect` that checks auth? No, it doesn't.

            // Re-reading logic: `handleSaveDeck` is ONLY called by the "Save to Library" button.
            // The `Generate Flashcards` button calls `handleTextSubmit` -> `generateCards`.
            // `generateCards` -> fetch /api/generate.
            // I will investigate `api/generate` next. 
            // For now, I'll ensure `handleSaveDeck` logic remains clean but maybe the user is confused 
            // and clicking "Save" thinking it's "Generate"? Or maybe `ContentInput` has a form submit that saves?

            if (!user) {
                setShowAuth(true)
                return
            }

            let currentDeckId = searchParams.get('deck')

            for (let i = 0; i < cards.length; i++) {
                if (!cards[i].front.trim() || !cards[i].back.trim()) {
                    toast.error(`Card ${i + 1} is incomplete. Both sides must have text.`)
                    return
                }
            }
            let deck

            if (currentDeckId) {
                const { data: updatedDeckRows, error: updateError } = await supabase
                    .from('decks')
                    .update({
                        title: deckTitle || "Study Deck",
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', currentDeckId)
                    .select()

                if (updateError) throw updateError

                if (!updatedDeckRows || updatedDeckRows.length === 0) {
                    throw new Error("Could not update deck. Make sure you have the 'UPDATE' RLS policy enabled for 'decks' table.")
                }

                deck = updatedDeckRows[0]

                const { error: deleteError } = await supabase
                    .from('cards')
                    .delete()
                    .eq('deck_id', deck.id)

                if (deleteError) throw deleteError

            } else {
                const { data: newDeck, error: createError } = await supabase
                    .from('decks')
                    .insert({
                        user_id: user.id,
                        title: deckTitle || "New Study Deck " + new Date().toLocaleDateString()
                    })
                    .select()
                    .single()

                if (createError) throw createError
                deck = newDeck

                router.replace(`/generate?deck=${deck.id}`, { scroll: false })
            }

            // Robust Card Sync Logic (simplified for brevity but functionally identical)
            const { data: existingRows } = await supabase.from('cards').select('id').eq('deck_id', deck.id)
            const existingIds = new Set(existingRows?.map(r => r.id) || [])
            const currentids = new Set(cards.map(c => c.id))

            const toInsert = cards.filter(c => !existingIds.has(c.id))
            const toUpdate = cards.filter(c => existingIds.has(c.id))
            const toDeleteIds = (existingRows || []).filter(r => !currentids.has(r.id)).map(r => r.id)

            if (toDeleteIds.length > 0) await supabase.from('cards').delete().in('id', toDeleteIds)

            if (toInsert.length > 0) {
                await supabase.from('cards').insert(toInsert.map(c => ({
                    id: c.id, deck_id: deck.id, front: c.front, back: c.back
                })))
            }

            if (toUpdate.length > 0) {
                await supabase.from('cards').upsert(toUpdate.map(c => ({
                    id: c.id, deck_id: deck.id, front: c.front, back: c.back
                })))
            }

            toast.success(currentDeckId ? "Deck updated!" : "Deck saved to your library!")

        } catch (error: any) {
            console.error("Save error:", error)
            toast.error("Failed to save deck: " + error.message)
        }
    }

    return (
        <div className="p-8 max-w-4xl mx-auto min-h-screen pt-24">
            <main>
                {step === 'upload' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex flex-col items-center gap-4 text-center mb-12">
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                                Generate Your Deck
                            </h1>
                            <p className="text-lg text-muted-foreground">
                                Upload your notes or paste text below. AI will do the rest.
                            </p>
                        </div>
                        <ContentInput
                            onFileSelect={handleFileSelect}
                            onTextSubmit={handleTextSubmit}
                        />

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/10"></span>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-4 text-muted-foreground font-medium tracking-widest">
                                    Or
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <Button
                                variant="ghost"
                                onClick={() => setStep('manual')}
                                className="h-auto py-2 px-6 hover:bg-white/5 text-muted-foreground hover:text-foreground"
                            >
                                Create Manually
                            </Button>
                        </div>

                    </div>
                )
                }

                {
                    step === 'manual' && (
                        <ManualEntry
                            onSaveDeck={handleManualSave}
                            onCancel={() => setStep('upload')}
                        />
                    )
                }

                {
                    step === 'processing' && (
                        <div className="text-center py-24 space-y-4">
                            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                            <p className="text-xl font-medium text-muted-foreground">{status}</p>
                        </div>
                    )
                }

                {
                    step === 'preview' && (
                        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                <div>
                                    <h2 className="text-2xl font-bold">{deckTitle || "Generated Deck"}</h2>
                                    <p className="text-muted-foreground">{cards.length} Cards</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setStep('upload')}>
                                        Start Over
                                    </Button>
                                    <Button variant="secondary" onClick={handleSaveDeck}>
                                        <Save className="w-4 h-4 mr-2" />
                                        {(deckId || (deckTitle && cards.length > 0 && window.location.search.includes('deck='))) ? "Update Deck" : "Save to Library"}
                                    </Button>
                                </div>
                            </div>
                            <FlashcardPreview
                                initialCards={cards}
                                onExport={handleExport}
                                initialMode={initialMode}
                                onCardsChange={setCards}
                            />
                        </div>
                    )
                }
            </main >
            <AuthModal
                isOpen={showAuth}
                onClose={() => setShowAuth(false)}
                onSuccess={() => {
                    setShowAuth(false)
                    handleSaveDeck()
                }}
            />
        </div >
    )
}

export default function GeneratePage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>}>
            <GenerateContent />
        </Suspense>
    )
}
