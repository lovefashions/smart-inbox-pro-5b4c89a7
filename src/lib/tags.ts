export type TagKind = "urgent" | "refund" | "payment" | "escalate" | "generic";

export interface ParsedTag {
  label: string;
  kind: TagKind;
}

const TAG_PATTERN = /(?:#([A-Z][A-Z0-9_-]{1,20})|\[([A-Z][A-Z0-9_ -]{1,20})\]|!([A-Z][A-Z0-9_-]{1,20}))/g;

function kindFor(label: string): TagKind {
  const upper = label.toUpperCase();
  if (upper.includes("URGENT")) return "urgent";
  if (upper.includes("REFUND")) return "refund";
  if (upper.includes("PAYMENT") || upper.includes("INVOICE")) return "payment";
  if (upper.includes("ESCALATE")) return "escalate";
  return "generic";
}

/** Extract routing tags such as #URGENT, [REFUND] or !ESCALATE from a subject + body. */
export function parseTags(...sources: string[]): ParsedTag[] {
  const found = new Map<string, ParsedTag>();
  for (const source of sources) {
    if (!source) continue;
    for (const match of source.matchAll(TAG_PATTERN)) {
      const raw = (match[1] ?? match[2] ?? match[3] ?? "").trim().toUpperCase();
      if (!raw) continue;
      if (!found.has(raw)) found.set(raw, { label: raw, kind: kindFor(raw) });
    }
  }
  return [...found.values()];
}

export const TAG_STYLES: Record<TagKind, string> = {
  urgent: "bg-destructive/10 text-destructive border-destructive/20",
  refund: "bg-accent-soft text-accent-strong border-accent-strong/20",
  payment: "bg-warning-soft text-warning-strong border-warning-strong/20",
  escalate: "bg-destructive/10 text-destructive border-destructive/20",
  generic: "bg-muted text-muted-foreground border-border",
};