"use client"

import { useState } from "react"
import { FileUpload } from "./file-upload"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Sparkles } from "lucide-react"

interface ContentInputProps {
    onFileSelect: (file: File, limit: number) => void
    onTextSubmit: (text: string, limit: number) => void
}

export function ContentInput({ onFileSelect, onTextSubmit }: ContentInputProps) {
    const [text, setText] = useState("")
    const [limit, setLimit] = useState([10])

    const handleSubmit = () => {
        if (text.trim()) {
            onTextSubmit(text, limit[0])
        }
    }

    return (
        <div className="w-full max-w-3xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Generate Flashcards</CardTitle>
                    <CardDescription>
                        Upload a document or paste your notes to generate flashcards with AI.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Number of cards: {limit[0]}</Label>
                            </div>
                            <Slider
                                value={limit}
                                onValueChange={setLimit}
                                max={50}
                                min={5}
                                step={5}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <Tabs defaultValue="file" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="file">File Upload</TabsTrigger>
                            <TabsTrigger value="text">Paste Text</TabsTrigger>
                        </TabsList>

                        <TabsContent value="file" className="mt-0">
                            <FileUpload onFileSelect={(f) => onFileSelect(f, limit[0])} />
                        </TabsContent>

                        <TabsContent value="text" className="mt-0 space-y-4">
                            <Textarea
                                placeholder="Paste your notes, article, or text here..."
                                className="min-h-[300px] p-4 text-base resize-y"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                            />
                            <Button
                                className="w-full"
                                onClick={handleSubmit}
                                disabled={!text.trim()}
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate Flashcards
                            </Button>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
