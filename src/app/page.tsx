"use client"

import { useState } from "react"
import { FileUpload } from "@/components/file-upload"
import { FlashcardPreview, Flashcard } from "@/components/flashcard-preview"
import { Button } from "@/components/ui/button"
import { extractText } from "@/lib/ocr"
import { exportToAnki } from "@/lib/anki"
import { supabase } from "@/lib/supabase"
import { UserNav } from "@/components/user-nav"
import { Sparkles, Loader2, Save } from "lucide-react"
import { toast } from "sonner"

export default function Home() {
  const [step, setStep] = useState<'upload' | 'processing' | 'preview'>('upload')
  const [cards, setCards] = useState<Flashcard[]>([])
  const [status, setStatus] = useState("")

  const handleFileSelect = async (file: File) => {
    try {
      setStep('processing')
      setStatus("Extracting text...")

      const text = await extractText(file)

      setStatus("Generating flashcards with AI...")
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({ text }),
      })

      if (!response.ok) throw new Error("Generation failed")

      const data = await response.json()
      const cardsWithIds = data.flashcards.map((c: any) => ({
        ...c,
        id: crypto.randomUUID()
      }))

      setCards(cardsWithIds)
      setStep('preview')
      toast.success("Flashcards generated successfully!")

    } catch (error) {
      console.error(error)
      toast.error("Something went wrong. Please try again.")
      setStep('upload')
    }
  }

  const handleExport = async (currentCards: Flashcard[]) => {
    try {
      await exportToAnki(currentCards)
      toast.success("Deck exported successfully!")
    } catch (e) {
      toast.error("Export failed")
    }
  }

  const handleSaveDeck = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Please login to save decks")
        return
      }

      // 1. Create Deck
      const { data: deck, error: deckError } = await supabase
        .from('decks')
        .insert({
          user_id: user.id,
          title: "New Study Deck " + new Date().toLocaleDateString()
        })
        .select()
        .single()

      if (deckError) throw deckError

      // 2. Insert Cards
      const cardsToInsert = cards.map(c => ({
        deck_id: deck.id,
        front: c.front,
        back: c.back
      }))

      const { error: cardsError } = await supabase
        .from('cards')
        .insert(cardsToInsert)

      if (cardsError) throw cardsError

      toast.success("Deck saved to your library!")

    } catch (error: any) {
      console.error(error)
      toast.error("Failed to save deck: " + error.message)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 selection:bg-primary/20 pb-20">
      <nav className="absolute top-0 right-0 p-4">
        <UserNav />
      </nav>

      <div className="container mx-auto px-4 py-16 md:py-24 max-w-5xl">
        <div className="text-center space-y-6 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Sparkles className="w-4 h-4" />
            <span>Cramly - AI Study Companion</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-5 duration-500 delay-100">
            Cramly
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-500 delay-200">
            Cramly instantly extracts key concepts and generates smart flashcards for efficient learning.
          </p>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          {step === 'upload' && (
            <FileUpload onFileSelect={handleFileSelect} />
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center p-12 bg-card rounded-xl border border-border shadow-sm max-w-xl mx-auto">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-lg font-medium">{status}</p>
              <p className="text-sm text-muted-foreground mt-2">This may take a few seconds...</p>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-8">
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  Start Over
                </Button>
                <Button variant="secondary" onClick={handleSaveDeck}>
                  <Save className="w-4 h-4 mr-2" />
                  Save to Library
                </Button>
              </div>
              <FlashcardPreview initialCards={cards} onExport={handleExport} />
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
