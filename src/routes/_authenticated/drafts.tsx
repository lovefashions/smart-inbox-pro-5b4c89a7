import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/inbox/AppShell";
import { DraftCard } from "@/components/inbox/DraftCard";
import { useAppState } from "@/state/app-state";

export const Route = createFileRoute("/_authenticated/drafts")({
  head: () => ({
    meta: [
      { title: "Pending AI Drafts — Shared Inbox" },
      {
        name: "description",
        content: "Review every AI-generated reply waiting on a human before it leaves the inbox.",
      },
      { property: "og:title", content: "Pending AI Drafts — Shared Inbox" },
      {
        property: "og:description",
        content: "Every AI reply waiting on human review, in one queue.",
      },
    ],
  }),
  component: DraftsPage,
});

function DraftsPage() {
  const { threads } = useAppState();
  const pending = threads.filter((t) => t.status !== "sent" && t.draftHtml);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-5 px-6 py-8">
        <header>
          <h1 className="text-xl font-semibold">Pending AI Drafts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pending.length} draft{pending.length === 1 ? "" : "s"} queued for review. Nothing sends
            automatically unless a tag rule says so.
          </p>
        </header>
        {pending.map((t) => (
          <div key={t.id} className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <Link to="/" className="text-sm font-medium hover:underline">
                {t.subject}
              </Link>
              <span className="text-xs text-muted-foreground">{t.sender}</span>
            </div>
            <DraftCard thread={t} />
          </div>
        ))}
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">Queue is clear.</p>
        ) : null}
      </div>
    </AppShell>
  );
}