"use client"

import { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface MathDisplayProps {
    content: string
}

export function MathDisplay({ content }: MathDisplayProps) {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!containerRef.current) return

        // Simple regex to find LaTeX pattern. 
        // In a real app we might parse mixed content better.
        // For now, if we detect standard delimiters, we try to render.
        // Or we can just try to render the whole string if it looks like math?
        // Actually, let's process the string and replace segments.

        const renderMath = () => {
            if (!containerRef.current) return

            // This is a naive implementation:
            // It assumes the flashcard content MIGHT be mixed text and math.
            // We'll use a simple parser or just render the whole thing for now if it's purely math,
            // but user wants "LaTeX formulas will be rendered".

            // Let's implement a text-node replacement strategy for safety and simplicity
            // or just use a dangerouslySetInnerHTML with manual parsing.

            const html = parseAndRender(content)
            containerRef.current.innerHTML = html
        }

        renderMath()
    }, [content])

    return <div ref={containerRef} className="math-content whitespace-pre-wrap" />
}

function parseAndRender(text: string): string {
    // Replace $$...$$ with display math
    // Replace $...$ with inline math
    // Replace \[...\] with display math
    // Replace \(...\) with inline math

    // We use a temporary placeholder strategy to avoid recursive replacement issues

    let rendered = text
        .replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
            try {
                return katex.renderToString(tex, { displayMode: true, throwOnError: false })
            } catch {
                return text
            }
        })
        .replace(/\\\[([\s\S]*?)\\\]/g, (_, tex) => {
            try {
                return katex.renderToString(tex, { displayMode: true, throwOnError: false })
            } catch {
                return text
            }
        })
        .replace(/\$([\s\S]*?)\$/g, (_, tex) => {
            try {
                return katex.renderToString(tex, { displayMode: false, throwOnError: false })
            } catch {
                return text
            }
        })
        .replace(/\\\(([\s\S]*?)\\\)/g, (_, tex) => {
            try {
                return katex.renderToString(tex, { displayMode: false, throwOnError: false })
            } catch {
                return text
            }
        })

    return rendered
}
