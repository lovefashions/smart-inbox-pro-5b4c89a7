import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/inbox/AppShell";
import { DraftCard } from "@/components/inbox/DraftCard";
import { Input } from "@/components/ui/input";
import type { EmailThread } from "@/data/mock";
import { parseTags, TAG_STYLES } from "@/lib/tags";
import { cn } from "@/lib/utils";
import { useAppState } from "@/state/app-state";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shared Inbox — AI Email Reply Assistant" },
      {
        name: "description",
        content:
          "A shared team inbox that drafts replies in your voice over MCP, with human review before anything sends.",
      },
      { property: "og:title", content: "Shared Inbox — AI Email Reply Assistant" },
      {
        property: "og:description",
        content: "AI-drafted email replies over MCP, reviewed by your team before sending.",
      },
    ],
  }),
  component: InboxPage,
});

const STATUS_LABEL: Record<EmailThread["status"], string> = {
  draft_ready: "AI Draft Ready",
  needs_review: "Needs Review",
  sent: "Sent",
};

const STATUS_STYLE: Record<EmailThread["status"], string> = {
  draft_ready: "bg-accent-soft text-accent-strong",
  needs_review: "bg-warning-soft text-warning-strong",
  sent: "bg-success-soft text-success-strong",
};

function timeLabel(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function InboxPage() {
  const { threads, selectedId, selectThread } = useAppState();
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const t of threads) for (const tag of parseTags(t.subject, t.snippet)) set.add(tag.label);
    return [...set];
  }, [threads]);

  const visible = threads.filter((t) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      t.subject.toLowerCase().includes(q) ||
      t.sender.toLowerCase().includes(q) ||
      t.snippet.toLowerCase().includes(q);
    const matchesTag =
      !tagFilter || parseTags(t.subject, t.snippet).some((tag) => tag.label === tagFilter);
    return matchesQuery && matchesTag;
  });

  const selected = threads.find((t) => t.id === selectedId) ?? visible[0] ?? null;

  return (
    <AppShell>
      <div className="flex h-screen">
        <section className="flex w-full max-w-sm shrink-0 flex-col border-r border-border">
          <div className="space-y-2 border-b border-border px-3 py-3">
            <h1 className="sr-only">Inbox</h1>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search inbox"
                className="pl-8"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
                    tagFilter === tag
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted text-muted-foreground hover:bg-accent",
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {visible.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => selectThread(t.id)}
                className={cn(
                  "w-full border-b border-border px-3 py-3 text-left transition-colors hover:bg-muted/60",
                  selected?.id === t.id && "bg-accent/40",
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={cn("truncate text-sm", t.unread ? "font-semibold" : "font-medium")}
                  >
                    {t.sender}
                  </span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {timeLabel(t.receivedAt)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-foreground/90">{t.subject}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{t.snippet}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-medium",
                      STATUS_STYLE[t.status],
                    )}
                  >
                    {STATUS_LABEL[t.status]}
                  </span>
                  {parseTags(t.subject, t.snippet).map((tag) => (
                    <span
                      key={tag.label}
                      className={cn(
                        "rounded border px-1.5 py-0.5 text-[10px] font-medium",
                        TAG_STYLES[tag.kind],
                      )}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              </button>
            ))}
            {visible.length === 0 ? (
              <p className="px-3 py-6 text-sm text-muted-foreground">No matching mail.</p>
            ) : null}
          </div>
        </section>

        <section className="flex-1 overflow-y-auto">
          {selected ? (
            <div className="mx-auto max-w-3xl space-y-4 px-6 py-6">
              <header>
                <h2 className="text-lg font-semibold">{selected.subject}</h2>
                <p className="text-xs text-muted-foreground">
                  {selected.sender} &lt;{selected.senderEmail}&gt;
                </p>
              </header>
              {selected.messages.map((m) => (
                <article key={m.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">{m.from}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {timeLabel(m.sentAt)}
                    </span>
                  </div>
                  <p className="whitespace-pre-line text-sm leading-relaxed">{m.body}</p>
                </article>
              ))}
              <DraftCard thread={selected} />
            </div>
          ) : (
            <p className="px-6 py-6 text-sm text-muted-foreground">Select a message.</p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
