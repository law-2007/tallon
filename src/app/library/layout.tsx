import { LibrarySidebar } from "@/components/library-sidebar"

export default function LibraryLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen bg-background text-foreground">
            <LibrarySidebar />
            <main className="flex-1 container mx-auto p-4 md:p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}
