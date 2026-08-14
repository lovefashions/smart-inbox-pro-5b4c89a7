import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "@/components/inbox/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAppState } from "@/state/app-state";

export const Route = createFileRoute("/training")({
  head: () => ({
    meta: [
      { title: "Voice Training — Shared Inbox" },
      {
        name: "description",
        content:
          "Scan a second mailbox over MCP so the assistant learns your greetings, tone and sign-offs.",
      },
      { property: "og:title", content: "Voice Training — Shared Inbox" },
      {
        property: "og:description",
        content: "Teach the assistant your writing voice from past sent mail.",
      },
    ],
  }),
  component: TrainingPage,
});

function TrainingPage() {
  const { historical, toggleHistorical, voice, setVoice } = useAppState();
  const [address, setAddress] = useState("sam@sharedinbox.co");
  const [provider, setProvider] = useState("mcp");
  const [range, setRange] = useState("12");
  const [progress, setProgress] = useState(0);
  const [scanning, setScanning] = useState(false);

  const startScan = () => {
    setScanning(true);
    setProgress(0);
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          setScanning(false);
          return 100;
        }
        return p + 10;
      });
    }, 180);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <header>
          <h1 className="text-xl font-semibold">Voice Training</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Point the assistant at a mailbox — it reads past sent mail through the same MCP
            connection and learns how you write.
          </p>
        </header>

        <section className="space-y-3 rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Mailbox to learn from</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcp">Connected MCP server</SelectItem>
                  <SelectItem value="gmail">Gmail (via MCP bridge)</SelectItem>
                  <SelectItem value="outlook">Outlook (via MCP bridge)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vt-address">Address</Label>
              <Input
                id="vt-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Scan back</Label>
              <Select value={range} onValueChange={setRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                  <SelectItem value="24">24 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button size="sm" onClick={startScan} disabled={scanning}>
            {scanning ? "Scanning…" : "Start scan"}
          </Button>
          {progress > 0 ? (
            <div className="space-y-1.5">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">
                {Math.round(progress * 14.2)} messages scanned · {Math.round(progress * 2.1)}{" "}
                threads indexed · {Math.round(progress * 4.6)} snippets extracted
              </p>
            </div>
          ) : null}
        </section>

        <section className="space-y-3 rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Learned voice profile</h2>
          <div className="space-y-1.5">
            <Label htmlFor="vp-tone">Tone</Label>
            <Textarea
              id="vp-tone"
              rows={2}
              value={voice.tone}
              onChange={(e) => setVoice({ ...voice, tone: e.target.value })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="vp-len">Average length</Label>
              <Input
                id="vp-len"
                value={voice.avgLength}
                onChange={(e) => setVoice({ ...voice, avgLength: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vp-greet">Greeting</Label>
              <Input
                id="vp-greet"
                value={voice.greeting}
                onChange={(e) => setVoice({ ...voice, greeting: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vp-sign">Sign-off</Label>
              <Input
                id="vp-sign"
                value={voice.signoff}
                onChange={(e) => setVoice({ ...voice, signoff: e.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {voice.phrases.map((p) => (
              <span
                key={p}
                className="rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
              >
                “{p}”
              </span>
            ))}
          </div>
        </section>

        <section className="space-y-2 rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Indexed past threads</h2>
          {historical.map((h) => (
            <div
              key={h.id}
              className="flex items-start justify-between gap-3 border-b border-border py-2 last:border-0"
            >
              <div>
                <p className="text-sm font-medium">{h.threadSubject}</p>
                <p className="text-xs text-muted-foreground">{h.bodyChunk}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {h.sourceAccount} · {new Date(h.sentAt).toLocaleDateString()}
                </p>
              </div>
              <Switch
                checked={h.included}
                onCheckedChange={() => toggleHistorical(h.id)}
                aria-label={`Include ${h.threadSubject} in training`}
              />
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  );
}