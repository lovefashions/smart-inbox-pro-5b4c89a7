import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/inbox/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppState } from "@/state/app-state";

export const Route = createFileRoute("/knowledge")({
  head: () => ({
    meta: [
      { title: "Knowledge Base — Shared Inbox" },
      {
        name: "description",
        content:
          "Business rules, policies and canned answers the AI cites when drafting replies for your team.",
      },
      { property: "og:title", content: "Knowledge Base — Shared Inbox" },
      { property: "og:description", content: "Policies and rules the AI cites when drafting." },
    ],
  }),
  component: KnowledgePage,
});

function KnowledgePage() {
  const { knowledge, upsertKnowledge, removeKnowledge } = useAppState();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  const add = () => {
    if (!title.trim()) return;
    upsertKnowledge({
      id: `k_${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      tags: tags
        .split(",")
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean),
    });
    setTitle("");
    setContent("");
    setTags("");
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <header>
          <h1 className="text-xl font-semibold">Knowledge Base</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rules and policies the assistant cites. Tags scope an entry to matching mail.
          </p>
        </header>

        <section className="space-y-3 rounded-lg border border-border bg-card p-4">
          <div className="space-y-1.5">
            <Label htmlFor="kb-title">Title</Label>
            <Input id="kb-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kb-content">Content</Label>
            <Textarea
              id="kb-content"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kb-tags">Tags (comma separated)</Label>
            <Input
              id="kb-tags"
              value={tags}
              placeholder="REFUND, PAYMENT"
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={add}>
            <Plus className="size-3.5" /> Add entry
          </Button>
        </section>

        <section className="space-y-3">
          {knowledge.map((k) => (
            <article key={k.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-medium">{k.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{k.content}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {k.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Delete ${k.title}`}
                  onClick={() => removeKnowledge(k.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </AppShell>
  );
}