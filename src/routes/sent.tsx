import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/inbox/AppShell";
import { useAppState } from "@/state/app-state";

export const Route = createFileRoute("/sent")({
  head: () => ({
    meta: [
      { title: "Sent Replies — Shared Inbox" },
      {
        name: "description",
        content: "Every approved reply this inbox has sent, with the final text as it went out.",
      },
      { property: "og:title", content: "Sent Replies — Shared Inbox" },
      { property: "og:description", content: "Approved replies sent from the shared inbox." },
    ],
  }),
  component: SentPage,
});

function SentPage() {
  const { sent } = useAppState();

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-4 px-6 py-8">
        <header>
          <h1 className="text-xl font-semibold">Sent</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Approved replies, newest first.
          </p>
        </header>
        {sent.map((s) => (
          <article key={s.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-medium">{s.subject}</h2>
              <span className="text-[11px] text-muted-foreground">
                {new Date(s.sentAt).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">to {s.to}</p>
            <div
              className="prose-editor mt-3 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: s.html }}
            />
          </article>
        ))}
        {sent.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing sent yet.</p>
        ) : null}
      </div>
    </AppShell>
  );
}