"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Loader2, Camera, Save, User } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [username, setUsername] = useState("")
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    useEffect(() => {
        getProfile()
    }, [])

    const getProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push("/")
                return
            }

            setUser(user)

            // Try to fetch from profiles table, but fallback to auth metadata
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', user.id)
                .single()

            if (profile) {
                setUsername(profile.username || user.user_metadata?.username || "")
                setAvatarUrl(profile.avatar_url || user.user_metadata?.avatar_url || null)
            } else {
                // If no profile row yet, use metadata
                setUsername(user.user_metadata?.username || "")
                setAvatarUrl(user.user_metadata?.avatar_url || null)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!event.target.files || event.target.files.length === 0) {
                return
            }

            const file = event.target.files[0]
            if (!user) return

            const fileExt = file.name.split('.').pop()
            const filePath = `${user.id}/avatar.${fileExt}`

            setSaving(true)
            toast.info("Uploading avatar...")

            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true })

            if (uploadError) throw uploadError

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            // Force a cache-bust query param to ensure image updates immediately
            const publicUrlWithCacheTimeout = `${publicUrl}?t=${new Date().getTime()}`

            setAvatarUrl(publicUrlWithCacheTimeout)
            toast.success("Avatar uploaded")

        } catch (error: any) {
            console.error(error)
            toast.error("Error uploading avatar: " + error.message)
        } finally {
            setSaving(false)
        }
    }

    const handleSave = async () => {
        try {
            if (!user) return
            setSaving(true)

            // 1. Update Auth Metadata (for Header/Session)
            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    username,
                    avatar_url: avatarUrl
                }
            })
            if (authError) throw authError

            // 2. Upsert to Profiles Table (for database reliability)
            const updates = {
                id: user.id,
                username,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
            }

            const { error: dbError } = await supabase
                .from('profiles')
                .upsert(updates)

            if (dbError) throw dbError

            toast.success("Profile updated!")
            router.refresh() // Refresh to update header

        } catch (error: any) {
            console.error(error)
            toast.error("Error updating profile: " + error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const handleRemoveAvatar = async () => {
        if (!user) return
        setSaving(true)
        try {
            // We just clear the URL in the profile. We could also delete from storage if we track the path.
            // For now, disassociating is enough.
            const { error: authError } = await supabase.auth.updateUser({
                data: { avatar_url: null }
            })
            if (authError) throw authError

            const { error: dbError } = await supabase
                .from('profiles')
                .update({ avatar_url: null, updated_at: new Date().toISOString() })
                .eq('id', user.id)

            if (dbError) throw dbError

            setAvatarUrl(null)
            toast.success("Avatar removed")
            router.refresh()
        } catch (error: any) {
            toast.error("Error removing avatar: " + error.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="container max-w-lg py-16 mx-auto px-4">
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
                    <p className="text-muted-foreground">Manage your public profile and settings.</p>
                </div>

                <div className="space-y-8 border rounded-xl p-8 bg-card shadow-sm">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <Avatar className="h-24 w-24 border-2 border-muted">
                                {avatarUrl ? <AvatarImage src={avatarUrl} className="object-cover" /> : null}
                                <AvatarFallback className="text-2xl bg-muted">
                                    {user?.email?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div
                                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Camera className="text-white w-6 h-6" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                Change Photo
                            </Button>
                            {avatarUrl && (
                                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-500 hover:bg-red-500/10" onClick={handleRemoveAvatar}>
                                    Remove
                                </Button>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                        />
                    </div>

                    {/* Form Section */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" value={user?.email || ""} disabled className="bg-muted/50" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Display Name"
                            />
                        </div>
                    </div>

                    <Button className="w-full" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    )
}
