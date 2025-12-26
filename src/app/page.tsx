"use client"

import Link from "next/link"
import { useRef, useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Brain, Zap, Layers, UserPlus, Calculator, Atom, BookOpen, PenTool, Lightbulb, GraduationCap } from "lucide-react"
import { motion, useScroll, useTransform, useInView } from "framer-motion"

export default function LandingPage() {
  const stickyRef = useRef(null)
  const isStickyInView = useInView(stickyRef, { amount: 0.5, once: true })
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    const generatedNotes: any[] = [];
    const letters = ['T', 'A', 'L', 'L', 'O', 'N'];
    const icons = [Brain, Calculator, Atom, BookOpen, PenTool, Lightbulb, GraduationCap, Zap, Sparkles];
    const colors = [
      '#fbf8cc', '#fde4cf', '#ffcfd2', '#f1c0e8', '#cfbaf0',
      '#a3c4f3', '#90dbf4', '#8eecf5', '#98f5e1', '#b9fbc0',
    ];
    const cols = 6;
    const total = 18;
    const startTallon = 6;

    for (let i = 0; i < total; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;

      // Constraint Logic: No Neighboring Colors
      const forbiddenColors = new Set();
      if (col > 0) forbiddenColors.add(generatedNotes[i - 1].color);
      if (row > 0) forbiddenColors.add(generatedNotes[i - cols].color);

      const availableColors = colors.filter(c => !forbiddenColors.has(c));
      const pool = availableColors.length > 0 ? availableColors : colors;
      const color = pool[Math.floor(Math.random() * pool.length)];

      // Constraint Logic: No Neighboring Icons
      const forbiddenIcons = new Set();
      if (i > 0) forbiddenIcons.add(generatedNotes[i - 1].Icon);
      if (i >= cols && generatedNotes[i - cols]) forbiddenIcons.add(generatedNotes[i - cols].Icon);

      const availableIcons = icons.filter(icon => !forbiddenIcons.has(icon));
      const poolIcons = availableIcons.length > 0 ? availableIcons : icons;
      const Icon = poolIcons[Math.floor(Math.random() * poolIcons.length)];

      const rotate = Math.random() * 40 - 20;
      const flipDir = Math.random() > 0.5 ? 1 : -1;
      const isTallon = i >= startTallon && i < startTallon + 6;
      const content = isTallon ? letters[i - startTallon] : null;

      generatedNotes.push({ color, rotate, isTallon, content, Icon, flipDir });
    }
    setNotes(generatedNotes);
  }, []);

  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory bg-background text-foreground scroll-smooth">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center h-screen snap-start px-4 text-center overflow-hidden">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6 max-w-4xl mx-auto z-10"
        >


          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight text-[#3b1e09] drop-shadow-sm">
            Absorb knowledge <br />
            <span className="text-primary decoration-wavy underline decoration-4 underline-offset-4">
              Effortlessly.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-[#857460] max-w-2xl mx-auto leading-relaxed font-serif italic font-medium">
            "Study with precision. Upload lecture notes and research papers, and we'll generate
            flashcards that actually work."
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link href="/generate">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 border-2 border-white/20 shadow-xl transition-all hover:scale-105 active:scale-95 text-primary-foreground font-serif">
                Start Generating <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </motion.div>

      </section>

      {/* Sticky Note Wall Section */}
      <section ref={stickyRef} className="h-screen snap-start flex items-center justify-center bg-[#261205] px-4 md:px-0 overflow-hidden relative">
        <div className="w-full relative z-20 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-8 md:gap-16 xl:gap-24 perspective-1000 items-center p-4">
          {/* 
              Grid of Sticky Notes: 
              6 Columns to fit TALLON.
          */}
          {notes.map((note, i) => (
            <StickyNote
              key={i}
              color={note.color}
              tapeColor="rgba(255,255,255,0.4)"
              rotate={note.rotate}
              flipDir={note.flipDir}
              isTriggered={isStickyInView}
              frontContent={
                <span className="font-handwriting text-6xl xl:text-8xl text-[#3b1e09]/40 font-bold select-none">?</span>
              }
              backContent={
                note.isTallon ? (
                  <span className="font-serif text-6xl xl:text-8xl text-[#3b1e09] font-black">{note.content}</span>
                ) : (
                  <note.Icon className="w-16 h-16 xl:w-20 xl:h-20 text-[#3b1e09]/60" strokeWidth={1.5} />
                )
              }
            />
          ))}

        </div>
      </section>

      {/* Redesigned Features SECTION - No More Grid */}
      <section className="px-4 bg-[#eaddcf]/30 border-t border-[#857460]/10 min-h-screen py-20 snap-start flex items-center justify-center">
        <div className="max-w-4xl mx-auto space-y-24">

          <div className="text-center mb-16">
            <span className="text-sm font-bold tracking-widest uppercase text-primary mb-2 block">Workflow</span>
            <h2 className="text-4xl md:text-5xl font-serif text-[#3b1e09]">The Analog Feel, <i className="text-primary">Digitized.</i></h2>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-12 group">
            <div className="w-full md:w-1/2 p-8 bg-white rounded-sm shadow-[8px_8px_0px_0px_rgba(59,30,9,1)] border-2 border-[#3b1e09] transition-transform group-hover:-translate-y-1">
              <Sparkles className="w-10 h-10 text-primary mb-6" />
              <h3 className="text-2xl font-bold text-[#3b1e09] mb-4">1. Instant Synthesis</h3>
              <p className="text-[#857460] leading-relaxed">
                Drop in your messy lecture notes or a 50-page PDF. Our AI acts like a dedicated research assistant, distilling chaos into clear, bite-sized concepts.
              </p>
            </div>
            <div className="w-full md:w-1/2 opacity-80">
              {/* Decorative abstract or icon */}
              <div className="text-9xl font-serif text-[#3b1e09]/10 font-black text-right">01</div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row-reverse items-center gap-12 group">
            <div className="w-full md:w-1/2 p-8 bg-[#3b1e09] rounded-sm shadow-[8px_8px_0px_0px_rgba(133,116,96,1)] border-2 border-[#3b1e09] transition-transform group-hover:-translate-y-1">
              <Brain className="w-10 h-10 text-[#eaddcf] mb-6" />
              <h3 className="text-2xl font-bold text-[#fcfbf9] mb-4">2. Active Recall</h3>
              <p className="text-[#eaddcf] leading-relaxed">
                We don't just show you answers. We force your brain to retrieve them. Our spaced repetition algorithm ensures you study exactly what you're about to forget.
              </p>
            </div>
            <div className="w-full md:w-1/2 opacity-80">
              <div className="text-9xl font-serif text-[#3b1e09]/10 font-black text-left pl-12">02</div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-12 group">
            <div className="w-full md:w-1/2 p-8 bg-white rounded-sm shadow-[8px_8px_0px_0px_rgba(59,30,9,1)] border-2 border-[#3b1e09] transition-transform group-hover:-translate-y-1">
              <Layers className="w-10 h-10 text-primary mb-6" />
              <h3 className="text-2xl font-bold text-[#3b1e09] mb-4">3. Organized Library</h3>
              <p className="text-[#857460] leading-relaxed">
                Your knowledge needs a home. Tag, categorize, and stack your decks. Export to Anki if you must, but you'll want to stay for the aesthetic.
                <br /><span className="text-xs font-bold text-primary mt-2 block uppercase tracking-wider">Now supporting Anki exports!</span>
              </p>
            </div>
            <div className="w-full md:w-1/2 opacity-80">
              <div className="text-9xl font-serif text-[#3b1e09]/10 font-black text-right">03</div>
            </div>
          </div>

        </div>
      </section>

      <section className="py-10 snap-start text-center text-[#857460] text-sm font-medium border-t border-[#3b1e09]/10 bg-[#f8f6e9] flex flex-col items-center justify-center gap-6">
        <div className="space-y-4">
          <h3 className="text-4xl font-serif font-bold text-[#3b1e09]">Tallon</h3>
          <p className="opacity-60 max-w-md mx-auto leading-relaxed">
            Minimalist tools for the modern scholar. <br />
            Built with focus in mind.
          </p>
        </div>
      </section>

      <footer className="h-[30px] min-h-[30px] border-t border-[#3b1e09]/10 bg-[#f8f6e9] flex items-center justify-center">
        <p className="opacity-40 text-xs text-[#857460]">&copy; {new Date().getFullYear()} Tallon. All rights reserved.</p>
      </footer>

    </div >
  )
}

// Removing BentoCard component as it is replaced by the new layout


const StickyNote = ({ color, tapeColor, rotate, scale = 1, zIndex = 0, frontContent, backContent, isTriggered = false, flipDir = 1 }: any) => {
  const [isFlipped, setIsFlipped] = useState(false)

  // Auto-flip when triggered
  useEffect(() => {
    if (isTriggered) {
      setIsFlipped(true)
    }
  }, [isTriggered])

  return (
    <div
      className="relative w-full aspect-square cursor-pointer group"
      style={{ zIndex }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: rotate + 5, rotateY: 0 }}
        whileInView={{ opacity: 1, scale: scale, rotate: rotate }}
        animate={{ rotateY: isFlipped ? 180 * flipDir : 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, type: 'spring', bounce: 0.2 }}
        className="w-full h-full relative preserve-3d shadow-lg"
        style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 backface-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
          style={{
            backgroundColor: color,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(0deg) translateZ(0.1px)' // Small Z offset to prevent fighting
          }}
        >
          {/* Tape */}
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 backdrop-blur-sm shadow-sm"
            style={{ backgroundColor: tapeColor, transform: `rotate(${Math.random() * 4 - 2}deg)` }}
          />

          <div className="w-full h-full flex flex-col items-center justify-center text-center">
            {frontContent}
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 backface-hidden shadow-sm"
          style={{
            backgroundColor: color,
            transform: `rotateY(${180 * flipDir}deg) translateZ(0.1px)`,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          {/* Tape */}
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 backdrop-blur-sm opacity-50 shadow-sm"
            style={{ backgroundColor: tapeColor, transform: `rotate(${Math.random() * 4 - 2}deg)` }}
          />

          <div className="w-full h-full flex flex-col items-center justify-center text-center">
            {backContent}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
