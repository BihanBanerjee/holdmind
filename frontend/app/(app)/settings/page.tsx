"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckCircle, KeyRound } from "lucide-react"
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
  })

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-8">Settings</h1>

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
