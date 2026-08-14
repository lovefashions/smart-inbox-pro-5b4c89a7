import { Bold, Italic, Underline, List, ListOrdered, Link2 } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value;
  }, [value]);

  const run = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const tools = [
    { icon: Bold, label: "Bold", action: () => run("bold") },
    { icon: Italic, label: "Italic", action: () => run("italic") },
    { icon: Underline, label: "Underline", action: () => run("underline") },
    { icon: List, label: "Bullet list", action: () => run("insertUnorderedList") },
    { icon: ListOrdered, label: "Numbered list", action: () => run("insertOrderedList") },
    {
      icon: Link2,
      label: "Link",
      action: () => {
        const url = window.prompt("Link URL");
        if (url) run("createLink", url);
      },
    },
  ];

  return (
    <div className="rounded-md border border-border bg-card">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-1.5 py-1">
        {tools.map((t) => (
          <Button
            key={t.label}
            type="button"
            variant="ghost"
            size="sm"
            aria-label={t.label}
            className="size-7 p-0"
            onMouseDown={(e) => e.preventDefault()}
            onClick={t.action}
          >
            <t.icon className="size-3.5" />
          </Button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Draft reply"
        data-placeholder={placeholder ?? "Write a reply…"}
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        className="prose-editor min-h-40 px-3 py-3 text-sm leading-relaxed outline-none"
      />
    </div>
  );
}