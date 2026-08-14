import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, Eye, EyeOff, Loader2, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/inbox/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EXPORTED_TOOLS, MCP_TOOLS, type ConnectionMode } from "@/data/mock";
import { testMailboxConnection } from "@/lib/mailbox.functions";
import { cn } from "@/lib/utils";
import { useAppState } from "@/state/app-state";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Server Settings — Shared Inbox" },
      {
        name: "description",
        content:
          "Connect a managed or self-hosted email MCP server, tune payment reminders, and export this inbox as an MCP server for Claude Desktop.",
      },
      { property: "og:title", content: "Server Settings — Shared Inbox" },
      {
        property: "og:description",
        content: "Managed or self-hosted MCP email connections, plus agent integration keys.",
      },
    ],
  }),
  component: SettingsPage,
});

type TestState = {
  status: "idle" | "running" | "ok" | "fail";
  tools: string[];
  message: string;
};

function SecretInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        placeholder={placeholder ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="pr-9"
      />
      <button
        type="button"
        aria-label={show ? "Hide value" : "Show value"}
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function SettingsPage() {
  const { settings, updateSettings, addAgentKey, revokeAgentKey } = useAppState();
  const { mcp } = settings;
  const [test, setTest] = useState<TestState>({ status: "idle", tools: [], message: "" });
  const runMailboxTest = useServerFn(testMailboxConnection);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const appMcpUrl =
    typeof window === "undefined" ? "/mcp" : new URL("/mcp", window.location.origin).toString();

  const setMode = (mode: ConnectionMode) =>
    updateSettings({ mcp: { ...mcp, mode } });
  const setManaged = (patch: Partial<typeof mcp.managed>) =>
    updateSettings({ mcp: { ...mcp, managed: { ...mcp.managed, ...patch } } });
  const setSelf = (patch: Partial<typeof mcp.selfHosted>) =>
    updateSettings({ mcp: { ...mcp, selfHosted: { ...mcp.selfHosted, ...patch } } });

  const runTest = async () => {
    const endpoint =
      mcp.mode === "managed" ? mcp.managed.endpointUrl : mcp.selfHosted.serverUrl;
    const token = mcp.mode === "managed" ? mcp.managed.apiKey : mcp.selfHosted.authToken;
    if (!endpoint.trim()) {
      setTest({ status: "fail", tools: [], message: "No endpoint URL set for this connection type." });
      return;
    }
    setTest({ status: "running", tools: [], message: "" });
    try {
      const result = await runMailboxTest({ data: { url: endpoint.trim(), token: token.trim() } });
      setTest({
        status: result.ok ? "ok" : "fail",
        tools: result.tools,
        message: result.message,
      });
    } catch (err) {
      setTest({
        status: "fail",
        tools: [],
        message: err instanceof Error ? err.message : "Connection test failed.",
      });
    }
  };

  const copy = (value: string, id: string) => {
    void navigator.clipboard?.writeText(value);
    setCopied(id);
    window.setTimeout(() => setCopied(null), 1500);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <header>
          <h1 className="text-xl font-semibold">Server Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mail moves through the Model Context Protocol. Pick a managed provider or point at your
            own open-source server.
          </p>
        </header>

        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">MCP server connection</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            The scanner calls <code>read_emails()</code> and <code>draft_email()</code> on whichever
            endpoint is active here.
          </p>

          <Tabs
            value={mcp.mode}
            onValueChange={(v) => setMode(v as ConnectionMode)}
            className="mt-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="managed">Managed service</TabsTrigger>
              <TabsTrigger value="self_hosted">Self-hosted open-source</TabsTrigger>
            </TabsList>

            <TabsContent value="managed" className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="m-provider">Provider name</Label>
                <Input
                  id="m-provider"
                  value={mcp.managed.providerName}
                  placeholder="Agently"
                  onChange={(e) => setManaged({ providerName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-endpoint">MCP endpoint URL</Label>
                <Input
                  id="m-endpoint"
                  value={mcp.managed.endpointUrl}
                  placeholder="https://mcp.provider.com/email/v1"
                  onChange={(e) => setManaged({ endpointUrl: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-key">API / auth key</Label>
                <SecretInput
                  id="m-key"
                  value={mcp.managed.apiKey}
                  onChange={(v) => setManaged({ apiKey: v })}
                  placeholder="sk_live_…"
                />
              </div>
            </TabsContent>

            <TabsContent value="self_hosted" className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="s-url">Custom MCP server URL</Label>
                <Input
                  id="s-url"
                  value={mcp.selfHosted.serverUrl}
                  placeholder="https://mail-mcp.internal/mcp"
                  onChange={(e) => setSelf({ serverUrl: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-token">Auth token</Label>
                <SecretInput
                  id="s-token"
                  value={mcp.selfHosted.authToken}
                  onChange={(v) => setSelf({ authToken: v })}
                  placeholder="bearer token"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="s-imap">IMAP host</Label>
                  <Input
                    id="s-imap"
                    value={mcp.selfHosted.imapHost}
                    onChange={(e) => setSelf({ imapHost: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-imap-port">IMAP port</Label>
                  <Input
                    id="s-imap-port"
                    value={mcp.selfHosted.imapPort}
                    onChange={(e) => setSelf({ imapPort: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-smtp">SMTP host</Label>
                  <Input
                    id="s-smtp"
                    value={mcp.selfHosted.smtpHost}
                    onChange={(e) => setSelf({ smtpHost: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-smtp-port">SMTP port</Label>
                  <Input
                    id="s-smtp-port"
                    value={mcp.selfHosted.smtpPort}
                    onChange={(e) => setSelf({ smtpPort: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-user">Mailbox username</Label>
                  <Input
                    id="s-user"
                    value={mcp.selfHosted.username}
                    onChange={(e) => setSelf({ username: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-pass">Mailbox password</Label>
                  <SecretInput
                    id="s-pass"
                    value={mcp.selfHosted.password}
                    onChange={(v) => setSelf({ password: v })}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Credentials are handed to your own MCP server — this app never opens an IMAP socket
                itself.
              </p>
            </TabsContent>
          </Tabs>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => void runTest()}
              disabled={test.status === "running"}
            >
              {test.status === "running" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : null}
              Test connection
            </Button>
            {test.status === "ok" ? (
              <span className="text-xs text-success-strong">
                {test.message}
                {test.tools.length ? ` — ${test.tools.join(", ")}` : ""}
              </span>
            ) : null}
            {test.status === "fail" ? (
              <span className="text-xs text-destructive">{test.message}</span>
            ) : null}
          </div>

          <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {MCP_TOOLS.map((t) => (
              <div
                key={t.name}
                className="flex items-start gap-2 rounded border border-border bg-muted/50 px-2.5 py-1.5"
              >
                {test.status === "ok" ? (
                  <Check className="mt-0.5 size-3.5 shrink-0 text-success-strong" />
                ) : (
                  <X className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                )}
                <div>
                  <code className="text-[11px] font-medium">{t.name}</code>
                  <p className="text-[11px] text-muted-foreground">{t.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Payment reminders</h2>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm">Draft reminders for unpaid invoices</p>
              <p className="text-xs text-muted-foreground">
                Scans for overdue notices and queues a reminder with your PayPal link.
              </p>
            </div>
            <Switch
              checked={settings.paymentRemindersEnabled}
              onCheckedChange={(v) => updateSettings({ paymentRemindersEnabled: v })}
              aria-label="Enable payment reminders"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="paypal">PayPal payment link</Label>
              <Input
                id="paypal"
                value={settings.paypalLink}
                onChange={(e) => updateSettings({ paypalLink: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="days">Remind after (days overdue)</Label>
              <Input
                id="days"
                type="number"
                value={settings.reminderAfterDays}
                onChange={(e) =>
                  updateSettings({ reminderAfterDays: Number(e.target.value) || 0 })
                }
              />
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Agent integration — export as MCP</h2>
          <p className="text-xs text-muted-foreground">
            Connect this inbox to Claude Desktop, ChatGPT or any MCP client. Paste the URL below and
            authenticate with a key.
          </p>
          <div className="flex items-center gap-2">
            <Input readOnly value={appMcpUrl} className="font-mono text-xs" />
            <Button size="sm" variant="outline" onClick={() => copy(appMcpUrl, "url")}>
              {copied === "url" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </Button>
          </div>

          <div className="grid gap-1.5 sm:grid-cols-3">
            {EXPORTED_TOOLS.map((t) => (
              <div key={t.name} className="rounded border border-border bg-muted/50 px-2.5 py-2">
                <code className="text-[11px] font-medium">{t.name}</code>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{t.description}</p>
                <span
                  className={cn(
                    "mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium",
                    t.readOnly
                      ? "bg-success-soft text-success-strong"
                      : "bg-warning-soft text-warning-strong",
                  )}
                >
                  {t.readOnly ? "read-only" : "writes"}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="key-label">New key label</Label>
              <Input
                id="key-label"
                value={newKeyLabel}
                placeholder="Claude Desktop — Priya"
                onChange={(e) => setNewKeyLabel(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              onClick={() => {
                addAgentKey(newKeyLabel);
                setNewKeyLabel("");
              }}
            >
              <Plus className="size-3.5" /> Generate key
            </Button>
          </div>

          <div className="space-y-2">
            {settings.agentKeys.map((k) => (
              <div
                key={k.id}
                className="flex items-center justify-between gap-3 rounded border border-border px-2.5 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{k.label}</p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">{k.key}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Created {new Date(k.createdAt).toLocaleDateString()} ·{" "}
                    {k.lastUsed ? `last used ${new Date(k.lastUsed).toLocaleDateString()}` : "never used"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => copy(k.key, k.id)}>
                    {copied === k.id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Revoke ${k.label}`}
                    onClick={() => revokeAgentKey(k.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Sending identity</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="from-name">From name</Label>
              <Input
                id="from-name"
                value={settings.fromName}
                onChange={(e) => updateSettings({ fromName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="from-email">From address</Label>
              <Input
                id="from-email"
                value={settings.fromEmail}
                onChange={(e) => updateSettings({ fromEmail: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sig">Signature</Label>
            <Textarea
              id="sig"
              rows={2}
              value={settings.signature}
              onChange={(e) => updateSettings({ signature: e.target.value })}
            />
          </div>
        </section>

        <section className="space-y-2 rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Automation rules by tag</h2>
          {settings.tagRules.map((rule) => (
            <div
              key={rule.tag}
              className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0"
            >
              <div>
                <p className="text-sm font-medium">{rule.tag}</p>
                <p className="text-xs text-muted-foreground">
                  {rule.mode === "auto" ? "Auto-send without review" : "Draft for review"}
                </p>
              </div>
              <Switch
                checked={rule.mode === "auto"}
                aria-label={`Auto-send ${rule.tag}`}
                onCheckedChange={(v) =>
                  updateSettings({
                    tagRules: settings.tagRules.map((r) =>
                      r.tag === rule.tag ? { ...r, mode: v ? "auto" : "review" } : r,
                    ),
                  })
                }
              />
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  );
}