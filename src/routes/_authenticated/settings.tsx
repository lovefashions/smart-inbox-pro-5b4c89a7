import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, Eye, EyeOff, Loader2, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/inbox/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EXPORTED_TOOLS, MCP_TOOLS, type ConnectionMode, type McpSettings, type AppSettings } from "@/data/mock";
import { testMailboxConnection } from "@/lib/mailbox.functions";
import { getSettings, updateSettings } from "@/lib/settings.functions";
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

const defaultSettings: AppSettings = {
  mcp: {
    mode: "self_hosted",
    managed: {
      providerName: "Agently",
      endpointUrl: "",
      apiKey: "",
    },
    selfHosted: {
      serverUrl: "http://localhost:8931/mcp",
      authToken: "",
      imapHost: "imap.ionos.com",
      imapPort: "993",
      smtpHost: "smtp.ionos.com",
      smtpPort: "587",
      username: "sales@johnnygoodguytv.com",
      password: "",
    },
  },
  fromName: "Johnny Goodguy TV Sales",
  fromEmail: "sales@johnnygoodguytv.com",
  signature: "— Johnny Goodguy TV Sales Team\nwww.johnnygoodguytv.com",
  tagRules: [
    { tag: "#URGENT", mode: "review" },
    { tag: "[REFUND]", mode: "review" },
    { tag: "[PAYMENT]", mode: "auto" },
    { tag: "!ESCALATE", mode: "review" },
  ],
  paypalLink: "https://paypal.me/johnnygoodguytv",
  paymentRemindersEnabled: true,
  reminderAfterDays: 7,
  agentKeys: [],
};

function toAppSettings(db: Awaited<ReturnType<typeof getSettings>>): AppSettings {
  const base = defaultSettings;
  const app = db.appSettings;
  const mbx = db.mailbox;
  const env = db.envCredentials;

  const mcp: McpSettings = mbx
    ? {
        mode: (mbx.provider_mode as ConnectionMode) || "self_hosted",
        managed: {
          providerName: mbx.provider_name || mbx.provider_mode || "Managed",
          endpointUrl: mbx.provider_mode === "managed" ? mbx.endpoint_url || "" : "",
          apiKey: mbx.provider_mode === "managed" ? mbx.auth_token || "" : "",
        },
        selfHosted: {
          serverUrl: mbx.provider_mode === "self_hosted" ? mbx.endpoint_url || "" : "",
          authToken: mbx.provider_mode === "self_hosted" ? mbx.auth_token || "" : "",
          imapHost: mbx.imap_host || base.mcp.selfHosted.imapHost,
          imapPort: mbx.imap_port || base.mcp.selfHosted.imapPort,
          smtpHost: mbx.smtp_host || base.mcp.selfHosted.smtpHost,
          smtpPort: mbx.smtp_port || base.mcp.selfHosted.smtpPort,
          username: mbx.username || env?.username || base.mcp.selfHosted.username,
          password: mbx.password || env?.password || "",
        },
      }
    : {
        ...base.mcp,
        selfHosted: {
          ...base.mcp.selfHosted,
          username: env?.username || base.mcp.selfHosted.username,
          password: env?.password || "",
        },
      };

  return {
    mcp,
    fromName: app?.from_name || base.fromName,
    fromEmail: app?.from_email || base.fromEmail,
    signature: app?.signature || base.signature,
    tagRules: Array.isArray(app?.tag_rules) ? (app?.tag_rules as { tag: string; mode: "review" | "auto" }[]) : base.tagRules,
    paypalLink: app?.paypal_link || base.paypalLink,
    paymentRemindersEnabled: app?.payment_reminders_enabled ?? base.paymentRemindersEnabled,
    reminderAfterDays: app?.reminder_after_days ?? base.reminderAfterDays,
    agentKeys: [],
  };
}

type TestState = {
  status: "idle" | "running" | "ok" | "fail";
  tools: string[];
  message: string;
};

type SaveState = {
  status: "idle" | "saving" | "ok" | "fail";
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
  const { addAgentKey, revokeAgentKey, settings: appSettings } = useAppState();
  const [draft, setDraft] = useState<AppSettings>(defaultSettings);
  const [test, setTest] = useState<TestState>({ status: "idle", tools: [], message: "" });
  const [save, setSave] = useState<SaveState>({ status: "idle", message: "" });
  const runMailboxTest = useServerFn(testMailboxConnection);
  const fetchSettings = useServerFn(getSettings);
  const saveSettings = useServerFn(updateSettings);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const { data: dbSettings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetchSettings(),
  });

  useEffect(() => {
    if (dbSettings) setDraft(toAppSettings(dbSettings));
  }, [dbSettings]);

  const appMcpUrl =
    typeof window === "undefined" ? "/mcp" : new URL("/mcp", window.location.origin).toString();

  const setMode = (mode: ConnectionMode) => setDraft((s) => ({ ...s, mcp: { ...s.mcp, mode } }));
  const setManaged = (patch: Partial<AppSettings["mcp"]["managed"]>) =>
    setDraft((s) => ({ ...s, mcp: { ...s.mcp, managed: { ...s.mcp.managed, ...patch } } }));
  const setSelf = (patch: Partial<AppSettings["mcp"]["selfHosted"]>) =>
    setDraft((s) => ({ ...s, mcp: { ...s.mcp, selfHosted: { ...s.mcp.selfHosted, ...patch } } }));

  const runTest = async () => {
    const endpoint = draft.mcp.mode === "managed" ? draft.mcp.managed.endpointUrl : draft.mcp.selfHosted.serverUrl;
    const token = draft.mcp.mode === "managed" ? draft.mcp.managed.apiKey : draft.mcp.selfHosted.authToken;
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

  const handleSave = async () => {
    setSave({ status: "saving", message: "" });
    try {
      await saveSettings({ data: draft });
      setSave({ status: "ok", message: "Settings saved." });
    } catch (err) {
      setSave({ status: "fail", message: err instanceof Error ? err.message : "Save failed." });
    }
  };

  const copy = (value: string, id: string) => {
    void navigator.clipboard?.writeText(value);
    setCopied(id);
    window.setTimeout(() => setCopied(null), 1500);
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Server Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Mail moves through the Model Context Protocol. Pick a managed provider or point at your
              own open-source server.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => void handleSave()} disabled={save.status === "saving"}>
              {save.status === "saving" ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Save settings
            </Button>
          </div>
        </header>

        {save.status === "ok" ? (
          <p className="rounded bg-success-soft px-3 py-1.5 text-sm text-success-strong">{save.message}</p>
        ) : null}
        {save.status === "fail" ? (
          <p className="rounded bg-destructive/10 px-3 py-1.5 text-sm text-destructive">{save.message}</p>
        ) : null}

        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">MCP server connection</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            The scanner calls <code>read_emails()</code> and <code>draft_email()</code> on whichever
            endpoint is active here.
          </p>

          <Tabs value={draft.mcp.mode} onValueChange={(v) => setMode(v as ConnectionMode)} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="managed">Managed service</TabsTrigger>
              <TabsTrigger value="self_hosted">Self-hosted open-source</TabsTrigger>
            </TabsList>

            <TabsContent value="managed" className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="m-provider">Provider name</Label>
                <Input id="m-provider" value={draft.mcp.managed.providerName} placeholder="Agently" onChange={(e) => setManaged({ providerName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-endpoint">MCP endpoint URL</Label>
                <Input id="m-endpoint" value={draft.mcp.managed.endpointUrl} placeholder="https://mcp.provider.com/email/v1" onChange={(e) => setManaged({ endpointUrl: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-key">API / auth key</Label>
                <SecretInput id="m-key" value={draft.mcp.managed.apiKey} onChange={(v) => setManaged({ apiKey: v })} placeholder="sk_live_…" />
              </div>
            </TabsContent>

            <TabsContent value="self_hosted" className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="s-url">Custom MCP server URL</Label>
                <Input id="s-url" value={draft.mcp.selfHosted.serverUrl} placeholder="https://mail-mcp.internal/mcp" onChange={(e) => setSelf({ serverUrl: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-token">Auth token</Label>
                <SecretInput id="s-token" value={draft.mcp.selfHosted.authToken} onChange={(v) => setSelf({ authToken: v })} placeholder="bearer token" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="s-imap">IMAP host</Label>
                  <Input id="s-imap" value={draft.mcp.selfHosted.imapHost} onChange={(e) => setSelf({ imapHost: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-imap-port">IMAP port</Label>
                  <Input id="s-imap-port" value={draft.mcp.selfHosted.imapPort} onChange={(e) => setSelf({ imapPort: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-smtp">SMTP host</Label>
                  <Input id="s-smtp" value={draft.mcp.selfHosted.smtpHost} onChange={(e) => setSelf({ smtpHost: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-smtp-port">SMTP port</Label>
                  <Input id="s-smtp-port" value={draft.mcp.selfHosted.smtpPort} onChange={(e) => setSelf({ smtpPort: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-user">Mailbox username</Label>
                  <Input id="s-user" value={draft.mcp.selfHosted.username} onChange={(e) => setSelf({ username: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-pass">Mailbox password</Label>
                  <SecretInput id="s-pass" value={draft.mcp.selfHosted.password} onChange={(v) => setSelf({ password: v })} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Credentials are handed to your own MCP server — this app never opens an IMAP socket itself.
              </p>
            </TabsContent>
          </Tabs>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button size="sm" variant="outline" onClick={() => void runTest()} disabled={test.status === "running"}>
              {test.status === "running" ? <Loader2 className="size-3.5 animate-spin" /> : null}
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
              <div key={t.name} className="flex items-start gap-2 rounded border border-border bg-muted/50 px-2.5 py-1.5">
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
              <p className="text-xs text-muted-foreground">Scans for overdue notices and queues a reminder with your PayPal link.</p>
            </div>
            <Switch
              checked={draft.paymentRemindersEnabled}
              onCheckedChange={(v) => setDraft((s) => ({ ...s, paymentRemindersEnabled: v }))}
              aria-label="Enable payment reminders"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="paypal">PayPal payment link</Label>
              <Input id="paypal" value={draft.paypalLink} onChange={(e) => setDraft((s) => ({ ...s, paypalLink: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="days">Remind after (days overdue)</Label>
              <Input id="days" type="number" value={draft.reminderAfterDays} onChange={(e) => setDraft((s) => ({ ...s, reminderAfterDays: Number(e.target.value) || 0 }))} />
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Agent integration — export as MCP</h2>
          <p className="text-xs text-muted-foreground">
            Connect this inbox to Claude Desktop, ChatGPT or any MCP client. Paste the URL below and authenticate with a key.
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
                <span className={cn("mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium", t.readOnly ? "bg-success-soft text-success-strong" : "bg-warning-soft text-warning-strong")}>
                  {t.readOnly ? "read-only" : "writes"}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="key-label">New key label</Label>
              <Input id="key-label" value={newKeyLabel} placeholder="Claude Desktop — Priya" onChange={(e) => setNewKeyLabel(e.target.value)} />
            </div>
            <Button size="sm" onClick={() => { addAgentKey(newKeyLabel); setNewKeyLabel(""); }}>
              <Plus className="size-3.5" /> Generate key
            </Button>
          </div>

          <div className="space-y-2">
            {appSettings.agentKeys.map((k) => (
              <div key={k.id} className="flex items-center justify-between gap-3 rounded border border-border px-2.5 py-2">
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
                  <Button size="sm" variant="ghost" aria-label={`Revoke ${k.label}`} onClick={() => revokeAgentKey(k.id)}>
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
              <Input id="from-name" value={draft.fromName} onChange={(e) => setDraft((s) => ({ ...s, fromName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="from-email">From address</Label>
              <Input id="from-email" value={draft.fromEmail} onChange={(e) => setDraft((s) => ({ ...s, fromEmail: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sig">Signature</Label>
            <Textarea id="sig" rows={2} value={draft.signature} onChange={(e) => setDraft((s) => ({ ...s, signature: e.target.value }))} />
          </div>
        </section>

        <section className="space-y-2 rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Automation rules by tag</h2>
          {draft.tagRules.map((rule) => (
            <div key={rule.tag} className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0">
              <div>
                <p className="text-sm font-medium">{rule.tag}</p>
                <p className="text-xs text-muted-foreground">{rule.mode === "auto" ? "Auto-send without review" : "Draft for review"}</p>
              </div>
              <Switch
                checked={rule.mode === "auto"}
                aria-label={`Auto-send ${rule.tag}`}
                onCheckedChange={(v) =>
                  setDraft((s) => ({
                    ...s,
                    tagRules: s.tagRules.map((r) => (r.tag === rule.tag ? { ...r, mode: v ? "auto" : "review" } : r)),
                  }))
                }
              />
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
