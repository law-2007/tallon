
import AnkiExport from 'anki-apkg-export'
import { Flashcard } from '@/components/flashcard-preview'

export async function exportToAnki(cards: Flashcard[], deckName: string = 'Cramly Deck') {
    try {
        const apkg = new AnkiExport(deckName)

        cards.forEach(card => {
            apkg.addCard(card.front, card.back)
        })

        const zip = await apkg.save()
        const blob = new Blob([zip], { type: 'application/octet-stream' })
        const url = URL.createObjectURL(blob)

        // Trigger download
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `${deckName.replace(/\s+/g, '-')}.apkg`
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)
        URL.revokeObjectURL(url)

    } catch (error) {
        console.error("Anki export failed:", error)
        throw new Error("Failed to export to Anki")
    }
}
