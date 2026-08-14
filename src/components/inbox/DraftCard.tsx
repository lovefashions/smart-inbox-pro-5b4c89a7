import { Sparkles, Send, Trash2, ChevronDown } from "lucide-react";

import { RichTextEditor } from "./RichTextEditor";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { EmailThread } from "@/data/mock";
import { useAppState } from "@/state/app-state";

const QUICK_ACTIONS: { label: string; transform: (html: string) => string }[] = [
  {
    label: "Make shorter",
    transform: (html) => {
      const paras = html.split("</p>").filter(Boolean);
      return paras.length > 2 ? `${paras[0]}</p>${paras[paras.length - 1]}</p>` : html;
    },
  },
  {
    label: "Make more professional",
    transform: (html) =>
      html.replace(/Hi /g, "Dear ").replace(/Best,/g, "Kind regards,").replace(/ — /g, ", "),
  },
  {
    label: "Make friendlier",
    transform: (html) => html.replace(/<p>(Hi|Dear)([^<]*)<\/p>/, "<p>Hey$2 👋</p>"),
  },
  {
    label: "Add apology",
    transform: (html) =>
      html.replace(
        /<\/p>/,
        "</p><p>Sorry again for the trouble here — I appreciate your patience.</p>",
      ),
  },
  {
    label: "Regenerate",
    transform: (html) => html,
  },
];

export function DraftCard({ thread }: { thread: EmailThread }) {
  const { updateDraft, approveAndSend, discardDraft } = useAppState();

  if (thread.status === "sent") {
    return (
      <div className="rounded-lg border border-success-strong/25 bg-success-soft/60 px-4 py-3 text-sm text-success-strong">
        Reply sent — thread resolved.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">AI Draft Response</h3>
        {thread.kind === "payment_reminder" ? (
          <span className="rounded-full border border-warning-strong/20 bg-warning-soft px-2 py-0.5 text-[11px] font-medium text-warning-strong">
            Payment reminder
          </span>
        ) : null}
      </div>

      <RichTextEditor
        value={thread.draftHtml}
        onChange={(html) => updateDraft(thread.id, html)}
        placeholder="No draft yet — write one, or regenerate."
      />

      {thread.sources.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="font-medium">Sources:</span>
          {thread.sources.map((s) => (
            <span key={s} className="rounded border border-border bg-muted px-1.5 py-0.5">
              {s}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => approveAndSend(thread.id)}>
          <Send className="size-3.5" /> Approve &amp; Send
        </Button>
        <Button size="sm" variant="outline" onClick={() => discardDraft(thread.id)}>
          <Trash2 className="size-3.5" /> Discard
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost">
              Quick actions <ChevronDown className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {QUICK_ACTIONS.map((a) => (
              <DropdownMenuItem
                key={a.label}
                onClick={() => updateDraft(thread.id, a.transform(thread.draftHtml))}
              >
                {a.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}