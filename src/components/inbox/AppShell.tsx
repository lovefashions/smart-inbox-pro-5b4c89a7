import { Link, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Inbox,
  FileEdit,
  Send,
  BookOpen,
  Waves,
  Settings as SettingsIcon,
  RefreshCw,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { useAppState } from "@/state/app-state";
import { supabase } from "@/integrations/supabase/client";
import { syncMailbox } from "@/lib/sync.functions";
import { Button } from "@/components/ui/button";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  count?: number | undefined;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { threads, sent } = useAppState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const queryClient = useQueryClient();
  const runSync = useServerFn(syncMailbox);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const unread = threads.filter((t) => t.unread).length;
  const pending = threads.filter((t) => t.status === "draft").length;

  const items: NavItem[] = [
    { to: "/", label: "Inbox", icon: Inbox, count: unread },
    { to: "/drafts", label: "Pending AI Drafts", icon: FileEdit, count: pending },
    { to: "/sent", label: "Sent", icon: Send, count: sent.length || undefined },
    { to: "/knowledge", label: "Knowledge Base", icon: BookOpen },
    { to: "/training", label: "Voice Training", icon: Waves },
    { to: "/settings", label: "Server Settings", icon: SettingsIcon },
  ];

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const result = await runSync();
      setSyncMessage(result.message);
      await queryClient.invalidateQueries({ queryKey: ["emails"] });
    } catch (err) {
      setSyncMessage(err instanceof Error ? err.message : "Sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

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

        <div className="mt-auto space-y-2 px-3 py-4">
          {syncMessage ? (
            <p className="rounded bg-sidebar-accent px-2.5 py-1.5 text-[11px] text-sidebar-accent-foreground">
              {syncMessage}
            </p>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => void handleSync()}
            disabled={syncing}
          >
            <RefreshCw className={cn("size-4", syncing && "animate-spin")} />
            Sync mailbox
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-start gap-2 text-sidebar-foreground/80 hover:text-sidebar-foreground"
            onClick={() => void handleSignOut()}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
          <div className="px-2 text-[11px] leading-relaxed text-muted-foreground">
            Email flows through MCP. No direct IMAP calls.
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}