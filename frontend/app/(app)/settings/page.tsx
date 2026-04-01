"use client"
import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckCircle, KeyRound, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ApiKeyStatus {
  has_key: boolean
}

export default function SettingsPage() {
  const qc = useQueryClient()
  const [apiKey, setApiKey] = useState("")
  const [saveError, setSaveError] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [profileError, setProfileError] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const { data: status } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiFetch<ApiKeyStatus>("/api/settings"),
  })

  const { mutate: saveKey, isPending: saving } = useMutation({
    mutationFn: (key: string) =>
      apiFetch<void>("/api/settings/api-key", {
        method: "POST",
        body: JSON.stringify({ api_key: key }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] })
      setApiKey("")
      setSaveError("")
    },
    onError: (err: Error) => setSaveError(err.message),
  })

  const { mutate: deleteKey } = useMutation({
    mutationFn: () => apiFetch<void>("/api/settings/api-key", { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
    onError: (err: Error) => toast.error(err.message),
  })

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<{ id: string; email: string; display_name: string | null }>("/api/auth/me"),
  })

  const { mutate: saveProfile, isPending: savingProfile } = useMutation({
    mutationFn: (name: string) =>
      apiFetch<void>("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ display_name: name || null }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] })
      setProfileError("")
      toast.success("Display name updated")
    },
    onError: (err: Error) => setProfileError(err.message),
  })

  const { mutate: changePassword, isPending: changingPassword } = useMutation({
    mutationFn: ({ current, next }: { current: string; next: string }) =>
      apiFetch<void>("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ current_password: current, new_password: next }),
      }),
    onSuccess: () => {
      setCurrentPassword("")
      setNewPassword("")
      setPasswordError("")
      setPasswordSuccess(true)
      setTimeout(() => setPasswordSuccess(false), 3000)
    },
    onError: (err: Error) => setPasswordError(err.message),
  })

  useEffect(() => {
    if (me?.display_name != null && displayName === "") {
      setDisplayName(me.display_name)
    }
  }, [me])

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-8">Settings</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>
            Your display name is shown in the app. Your email cannot be changed.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="space-y-1">
            <Label>Email</Label>
            <p className="text-sm text-muted-foreground">{me?.email ?? "—"}</p>
          </div>
          <form
            onSubmit={e => {
              e.preventDefault()
              saveProfile(displayName.trim())
            }}
            className="flex flex-col gap-3"
          >
            <div className="space-y-1">
              <Label htmlFor="displayname">Display name</Label>
              <Input
                id="displayname"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder={me?.display_name ?? "Enter a display name…"}
              />
            </div>
            {profileError && <p className="text-sm text-destructive">{profileError}</p>}
            <Button
              type="submit"
              disabled={savingProfile}
              className="self-start"
            >
              {savingProfile ? "Saving…" : "Save name"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Enter your current password and a new password (min. 8 characters).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={e => {
              e.preventDefault()
              if (currentPassword && newPassword)
                changePassword({ current: currentPassword, next: newPassword })
            }}
            className="flex flex-col gap-3"
          >
            <div className="space-y-1">
              <Label htmlFor="currentpw">Current password</Label>
              <Input
                id="currentpw"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="newpw">New password</Label>
              <Input
                id="newpw"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>
            {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            {passwordSuccess && <p className="text-sm text-green-600">Password changed successfully.</p>}
            <Button
              type="submit"
              disabled={changingPassword || !currentPassword || !newPassword}
              className="self-start"
            >
              {changingPassword ? "Updating…" : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            OpenRouter API Key
          </CardTitle>
          <CardDescription>
            Your key is encrypted and stored securely. It is used for all LLM
            calls and memory extraction.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {status?.has_key ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>API key saved</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Remove
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove API key?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You won&apos;t be able to chat until you add a new key.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteKey()}>
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No API key saved.</p>
          )}

          <form
            onSubmit={e => {
              e.preventDefault()
              if (apiKey.trim()) saveKey(apiKey.trim())
            }}
            className="flex flex-col gap-3"
          >
            <div className="space-y-1">
              <Label htmlFor="apikey">
                {status?.has_key ? "Replace key" : "Add key"}
              </Label>
              <Input
                id="apikey"
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-or-…"
              />
            </div>
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
            <Button
              type="submit"
              disabled={saving || !apiKey.trim()}
              className="self-start"
            >
              {saving ? "Saving…" : "Save key"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
