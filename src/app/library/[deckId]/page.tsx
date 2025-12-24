"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { FlashcardPreview, Flashcard } from "@/components/flashcard-preview"
import { Loader2 } from "lucide-react"
import { useParams } from "next/navigation"

export default function DeckPage() {
    const params = useParams()
    const deckId = params?.deckId as string
    const [cards, setCards] = useState<Flashcard[]>([])
    const [deckTitle, setDeckTitle] = useState("")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (deckId) fetchDeck()
    }, [deckId])

    const fetchDeck = async () => {
        setLoading(true)
        const { data: deck } = await supabase
            .from('decks')
            .select('title')
            .eq('id', deckId)
            .single()

        if (deck) setDeckTitle(deck.title)

        const { data: cardsData } = await supabase
            .from('cards')
            .select('*')
            .eq('deck_id', deckId)
            .order('created_at', { ascending: true })

        if (cardsData) {
            setCards(cardsData)
        }
        setLoading(false)
    }

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" /></div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">{deckTitle}</h1>
            </div>

            <FlashcardPreview
                initialCards={cards}
                onExport={() => { }}
                initialMode="study"
                onCardsChange={() => { }}
            />
        </div>
    )
}
