"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { FlashcardPreview, Flashcard } from "@/components/flashcard-preview"
import { Button } from "@/components/ui/button"
import { extractText } from "@/lib/ocr"
import { exportToAnki } from "@/lib/anki"
import { supabase } from "@/lib/supabase"

import { Sparkles, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { ContentInput } from "@/components/content-input"
import { ManualEntry } from "@/components/manual-entry"

import { AuthModal } from "@/components/auth-modal"

// Rename the main component logic to HomeContent
function HomeContent() {
  const router = useRouter()
  const [step, setStep] = useState<'upload' | 'processing' | 'preview' | 'manual'>('upload')
  const [cards, setCards] = useState<Flashcard[]>([])
  const [deckTitle, setDeckTitle] = useState("")
  const [status, setStatus] = useState("")
  const [initialMode, setInitialMode] = useState<'edit' | 'study'>('edit')
  const [showAuth, setShowAuth] = useState(false)

  const searchParams = useSearchParams()
  const deckId = searchParams.get('deck')

  console.log("HomeContent Render. DeckID:", deckId, "Step:", step)

  useEffect(() => {
    console.log("useEffect triggered. DeckID:", deckId)
    if (deckId) {
      loadDeck(deckId)
    }
  }, [deckId])

  const loadDeck = async (id: string) => {
    try {
      setStep('processing')
      setStatus("Loading deck...")

      // Fetch deck details
      const { data: deck, error: deckError } = await supabase
        .from('decks')
        .select('*')
        .eq('id', id)
        .single()

      if (deckError) throw deckError

      // Fetch cards
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
        // status could be loaded here too if we tracked it per user/session
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
        link.setAttribute("download", "cramly_deck.csv");
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

      if (!user) {
        setShowAuth(true)
        return
      }

      let currentDeckId = searchParams.get('deck')

      // Validate Cards
      for (let i = 0; i < cards.length; i++) {
        if (!cards[i].front.trim() || !cards[i].back.trim()) {
          toast.error(`Card ${i + 1} is incomplete. Both sides must have text.`)
          return
        }
      }
      let deck

      if (currentDeckId) {
        // Update existing deck
        const { data: updatedDeckRows, error: updateError } = await supabase
          .from('decks')
          .update({
            title: deckTitle || "Study Deck",
            updated_at: new Date().toISOString()
          })
          .eq('id', currentDeckId)
          .select()

        if (updateError) throw updateError

        // Use more descriptive error if no rows returned (RLS or Not Found)
        if (!updatedDeckRows || updatedDeckRows.length === 0) {
          throw new Error("Could not update deck. Make sure you have the 'UPDATE' RLS policy enabled for 'decks' table.")
        }

        deck = updatedDeckRows[0]

        // Delete existing cards
        const { error: deleteError } = await supabase
          .from('cards')
          .delete()
          .eq('deck_id', deck.id)

        if (deleteError) throw deleteError

      } else {
        // Create new deck
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

        // Update URL to reflect the new deck ID so subsequent saves are updates
        // Using router.replace ensures searchParams and dependent hooks update correctly
        router.replace(`/?deck=${deck.id}`, { scroll: false })
      }

      // 3. Robust Card Sync (Fetch - Diff - Sync)
      // First, fetch all existing card IDs for this deck to know what's really in the DB
      const { data: existingRows } = await supabase
        .from('cards')
        .select('id')
        .eq('deck_id', deck.id)

      const existingIds = new Set(existingRows?.map(r => r.id) || [])
      const currentids = new Set(cards.map(c => c.id))

      const toInsert = cards.filter(c => !existingIds.has(c.id))
      const toUpdate = cards.filter(c => existingIds.has(c.id))
      const toDeleteIds = (existingRows || [])
        .filter(r => !currentids.has(r.id))
        .map(r => r.id)

      // Execute Sync Operations
      if (toDeleteIds.length > 0) {
        const { error: delErr } = await supabase.from('cards').delete().in('id', toDeleteIds)
        if (delErr) { console.error("Sync Delete Error", delErr); throw delErr }
      }

      if (toInsert.length > 0) {
        const { error: insErr } = await supabase.from('cards').insert(
          toInsert.map(c => ({
            id: c.id, // Explicitly use our client-generated ID
            deck_id: deck.id,
            front: c.front,
            back: c.back
          }))
        )
        if (insErr) { console.error("Sync Insert Error", insErr); throw insErr }
      }

      if (toUpdate.length > 0) {
        const { error: upErr } = await supabase.from('cards').upsert(
          toUpdate.map(c => ({
            id: c.id,
            deck_id: deck.id,
            front: c.front,
            back: c.back
          }))
        )
        if (upErr) { console.error("Sync Update Error", upErr); throw upErr }
      }

      toast.success(currentDeckId ? "Deck updated!" : "Deck saved to your library!")

      // Force a slight state refresh or just let the user continue editing
      if (!currentDeckId) {
        // If we just created it, we wanted to switch mode effectively
        // searchParams won't update automatically in client component unless we use router or force it
        // verified above with window.history, but let's be safe
      }

    } catch (error: any) {
      console.error("Save error:", error)
      toast.error("Failed to save deck: " + error.message)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen">

      <main>
        {step === 'upload' && (
          <div className="space-y-8">
            <section className="text-center space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                Master any topic with AI
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Convert your notes, PDFs, and documents into interactive flashcards in seconds.
              </p>

              <div className="flex justify-center gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep('manual')}
                  className="h-12 px-6"
                >
                  Create Manually
                </Button>
              </div>
            </section>

            <ContentInput
              onFileSelect={handleFileSelect}
              onTextSubmit={handleTextSubmit}
            />
          </div>
        )}

        {step === 'manual' && (
          <ManualEntry
            onSaveDeck={handleManualSave}
            onCancel={() => setStep('upload')}
          />
        )}

        {step === 'processing' && (
          <div className="text-center py-24 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <p className="text-xl font-medium text-muted-foreground">{status}</p>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center border-b pb-4">
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
        )}
      </main>
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={() => {
          setShowAuth(false)
          handleSaveDeck()
        }}
      />
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>}>
      <HomeContent />
    </Suspense>
  )
}
