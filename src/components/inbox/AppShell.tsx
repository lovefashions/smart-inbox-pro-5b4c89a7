import { Link, useRouterState } from "@tanstack/react-router";
import {
  Inbox,
  FileEdit,
  Send,
  BookOpen,
  Waves,
  Settings as SettingsIcon,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { useAppState } from "@/state/app-state";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  count?: number | undefined;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { threads, sent } = useAppState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const unread = threads.filter((t) => t.unread).length;
  const pending = threads.filter((t) => t.status === "draft_ready").length;

  const items: NavItem[] = [
    { to: "/", label: "Inbox", icon: Inbox, count: unread },
    { to: "/drafts", label: "Pending AI Drafts", icon: FileEdit, count: pending },
    { to: "/sent", label: "Sent", icon: Send, count: sent.length || undefined },
    { to: "/knowledge", label: "Knowledge Base", icon: BookOpen },
    { to: "/training", label: "Voice Training", icon: Waves },
    { to: "/settings", label: "Server Settings", icon: SettingsIcon },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="px-5 py-5">
          <p className="font-display text-base font-semibold text-sidebar-foreground">
            Shared Inbox
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">AI reply assistant</p>
        </div>
        <nav className="flex-1 space-y-0.5 px-2.5">
          {items.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.count ? (
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                    {item.count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 text-[11px] leading-relaxed text-muted-foreground">
          Email flows through MCP. No direct IMAP calls.
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}