"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/user-nav"

import { supabase } from "@/lib/supabase"
import { PlusCircle, Library, ChevronRight, LayoutGrid, MoreVertical, Trash2 } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Deck {
    id: string
    title: string
    created_at: string
    card_count?: number
}

export function LibrarySidebar() {
    const [decks, setDecks] = useState<Deck[]>([])
    const pathname = usePathname()

    useEffect(() => {
        fetchDecks()
    }, [])

    const fetchDecks = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('decks')
            .select('*, cards(count)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (data) {
            setDecks(data.map((d: any) => ({
                ...d,
                card_count: d.cards[0]?.count || 0
            })))
        }
    }

    return (
        <div
            className="w-64 border-r border-white/10 flex flex-col hidden md:flex relative h-screen sticky top-0"
            style={{ backgroundColor: 'var(--sidebar)', color: 'var(--sidebar-foreground)' }}
        >
            {/* Logo Area */}
            {/* User Profile Area (Top) */}
            <div className="p-6 pb-2 border-b border-white/5">
                <Link href="/profile" className="flex items-center gap-3 mb-6 p-2 rounded-lg hover:bg-white/20 transition-colors cursor-pointer group">
                    <UserNav />
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-white group-hover:text-primary transition-colors">My Profile</span>
                        <span className="text-[10px] text-white/50">Manage Account</span>
                    </div>
                </Link>

                <Link href="/generate">
                    <Button className="w-full justify-start gap-2 bg-[#f1eddd] text-[#3b1e09] hover:bg-white border-2 border-[#3b1e09]/10 font-bold shadow-sm">
                        <PlusCircle className="h-4 w-4" />
                        New Deck
                    </Button>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <div className="px-3 space-y-1">
                    <Link href="/library">
                        <div className={cn(
                            "flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-all mb-4",
                            pathname === "/library" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}>
                            <LayoutGrid className="mr-2 h-4 w-4" />
                            All Decks
                        </div>
                    </Link>

                    <h4 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Your Collection</h4>

                    {decks.map(deck => (
                        <Link key={deck.id} href={`/library/${deck.id}`}>
                            <div className={cn(
                                "flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-all group relative",
                                pathname === `/library/${deck.id}`
                                    ? "bg-white/10 text-white border border-white/20"
                                    : "text-[var(--sidebar-foreground)]/70 hover:text-white hover:bg-white/5 border border-transparent"
                            )}>
                                {/* 3 Dots Context Menu - Only visible on hover or active */}
                                <div className="absolute left-1 opacity-0 group-hover:opacity-100 transition-opacity z-20" onClick={(e) => e.preventDefault()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-4 px-0 hover:bg-white/10">
                                                <MoreVertical className="h-3 w-3 text-muted-foreground" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="bg-zinc-900 border-white/10 text-zinc-300 w-32">
                                            <DropdownMenuItem
                                                className="text-red-400 focus:text-red-300 focus:bg-red-900/20 cursor-pointer"
                                                onClick={() => {
                                                    // We need to pass the deletion handler down or confirm it here.
                                                    // Since this is a sidebar component, we might need a global state or a callback.
                                                    // For simplicity in this execution, I'll redirect to a delete route or trigger a custom event.
                                                    // Actually, let's keep it simple: just emit an event or used a passed prop if I was refactoring properly.
                                                    // Given I can't easily change the prop signature of the sidebar used in layout without touching layout...
                                                    // I will use `window.dispatchEvent` for a custom "delete-deck" event that the Page can listen to?
                                                    // Or better, just implement deletion logic here if I can import supabase. I can.
                                                    const confirm = window.confirm("Delete this deck?"); // Native verify for speed/simplicity or custom event?
                                                    if (confirm) {
                                                        supabase.from('decks').delete().eq('id', deck.id).then(() => {
                                                            window.location.reload(); // Simple reload to refresh list for now
                                                        });
                                                    }
                                                }}
                                            >
                                                <Trash2 className="mr-2 h-3 w-3" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="pl-6 flex items-center w-full truncate">
                                    <Library className="mr-2 h-3.5 w-3.5 opacity-70 shrink-0" />
                                    <span className="truncate">{deck.title}</span>
                                </div>
                                {pathname === `/library/${deck.id}` && (
                                    <ChevronRight className="ml-auto h-3 w-3 opacity-50" />
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="mt-auto bg-[var(--sidebar)] w-full">
                <Link href="/" className="block w-full">
                    <div className="relative w-full h-32 hover:opacity-90 transition-opacity cursor-pointer">
                        <Image
                            src="/tallon-logo-new.png?v=3"
                            alt="Tallon"
                            fill
                            className="object-contain"
                            priority
                            unoptimized
                        />
                    </div>
                </Link>
            </div>
        </div>
    )
}
