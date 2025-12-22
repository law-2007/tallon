"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Plus, Save, Trash2 } from "lucide-react"
import { Flashcard } from "./flashcard-preview"
import { toast } from "sonner"

interface ManualEntryProps {
    onSaveDeck: (cards: Flashcard[], title: string) => void
    onCancel: () => void
}

export function ManualEntry({ onSaveDeck, onCancel }: ManualEntryProps) {
    const [title, setTitle] = useState("")
    const [cards, setCards] = useState<Flashcard[]>([
        { id: crypto.randomUUID(), front: "", back: "" }
    ])

    const addCard = () => {
        setCards([...cards, { id: crypto.randomUUID(), front: "", back: "" }])
    }

    const removeCard = (id: string) => {
        if (cards.length === 1) {
            toast.error("You must have at least one card.")
            return
        }
        setCards(cards.filter(c => c.id !== id))
    }

    const updateCard = (id: string, field: 'front' | 'back', value: string) => {
        setCards(cards.map(c => c.id === id ? { ...c, [field]: value } : c))
    }

    const handleSave = () => {
        if (!title.trim()) {
            toast.error("Please enter a deck title.")
            return
        }
        if (cards.some(c => !c.front.trim() || !c.back.trim())) {
            toast.error("All cards must have a front and back.")
            return
        }
        onSaveDeck(cards, title)
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <div className="space-x-2">
                    <Button onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Deck
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Deck Title</Label>
                    <Input
                        placeholder="e.g., Biology Chapter 1"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-lg font-medium"
                    />
                </div>

                <div className="space-y-4">
                    {cards.map((card, index) => (
                        <Card key={card.id}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Card {index + 1}
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeCard(card.id)}
                                    className="text-destructive hover:text-destructive/90"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label>Front</Label>
                                    <Textarea
                                        placeholder="Question or term..."
                                        value={card.front}
                                        onChange={(e) => updateCard(card.id, 'front', e.target.value)}
                                        className="min-h-[80px]"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Back</Label>
                                    <Textarea
                                        placeholder="Answer or definition..."
                                        value={card.back}
                                        onChange={(e) => updateCard(card.id, 'back', e.target.value)}
                                        className="min-h-[80px]"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Button variant="outline" className="w-full" onClick={addCard}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Flashcard
                </Button>
            </div>
        </div>
    )
}
