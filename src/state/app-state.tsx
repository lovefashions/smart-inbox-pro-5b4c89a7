import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  defaultSettings,
  mockHistorical,
  mockKnowledge,
  mockVoice,
  type AgentKey,
  type AppSettings,
  type EmailThread,
  type HistoricalEmail,
  type KnowledgeEntry,
  type VoiceProfile,
} from "@/data/mock";
import { listEmails, updateDraft, sendEmail, discardEmail } from "@/lib/emails.functions";

export interface SentItem {
  id: string;
  subject: string;
  to: string;
  html: string;
  sentAt: string;
}

interface AppStateValue {
  threads: EmailThread[];
  sent: SentItem[];
  knowledge: KnowledgeEntry[];
  historical: HistoricalEmail[];
  voice: VoiceProfile;
  settings: AppSettings;
  selectedId: string | null;
  selectThread: (id: string) => void;
  updateDraft: (id: string, html: string) => void;
  approveAndSend: (id: string) => void;
  discardDraft: (id: string) => void;
  upsertKnowledge: (entry: KnowledgeEntry) => void;
  removeKnowledge: (id: string) => void;
  toggleHistorical: (id: string) => void;
  setVoice: (voice: VoiceProfile) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  addAgentKey: (label: string) => AgentKey;
  revokeAgentKey: (id: string) => void;
  isLoadingThreads: boolean;
}

const AppStateContext = createContext<AppStateValue | null>(null);

function randomKey() {
  const chars = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < 20; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return `sk_mcp_${out}`;
}

function toThread(row: Awaited<ReturnType<typeof listEmails>>[number]): EmailThread {
  return {
    id: row.id,
    sender: row.sender,
    senderEmail: row.sender_email,
    subject: row.subject,
    snippet: row.snippet,
    receivedAt: row.received_at,
    status: row.status,
    unread: row.unread,
    messages: row.messages.map((m) => ({
      id: m.id,
      from: m.from,
      fromEmail: m.fromEmail,
      body: m.body,
      sentAt: m.sentAt,
      direction: m.direction,
    })),
    draftHtml: row.draft_html,
    sources: row.sources,
    kind: row.kind === "payment_reminder" ? "payment_reminder" : undefined,
  };
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const fetchEmails = useServerFn(listEmails);
  const { data: emailRows, isLoading: isLoadingThreads } = useQuery({
    queryKey: ["emails"],
    queryFn: () => fetchEmails(),
  });

  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>(mockKnowledge);
  const [historical, setHistorical] = useState<HistoricalEmail[]>(mockHistorical);
  const [voice, setVoice] = useState<VoiceProfile>(mockVoice);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const threads = useMemo(() => {
    const rows = emailRows ?? [];
    return rows.filter((r) => r.status !== "sent" && r.status !== "archived").map(toThread);
  }, [emailRows]);

  const sent = useMemo(() => {
    const rows = emailRows ?? [];
    return rows
      .filter((r) => r.status === "sent")
      .map((r) => ({
        id: r.id,
        subject: r.subject,
        to: r.sender_email,
        html: r.draft_html,
        sentAt: r.received_at,
      }));
  }, [emailRows]);

  const doUpdateDraft = useServerFn(updateDraft);
  const doSendEmail = useServerFn(sendEmail);
  const doDiscardEmail = useServerFn(discardEmail);

  const updateDraftMutation = useMutation({
    mutationFn: (args: { id: string; html: string }) => doUpdateDraft({ data: args }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emails"] }),
  });

  const sendEmailMutation = useMutation({
    mutationFn: (id: string) => doSendEmail({ data: { emailId: id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emails"] }),
  });

  const discardEmailMutation = useMutation({
    mutationFn: (id: string) => doDiscardEmail({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emails"] }),
  });

  const selectThread = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const updateDraft = useCallback(
    (id: string, html: string) => {
      updateDraftMutation.mutate({ id, html });
    },
    [updateDraftMutation],
  );

  const approveAndSend = useCallback(
    (id: string) => {
      sendEmailMutation.mutate(id);
    },
    [sendEmailMutation],
  );

  const discardDraft = useCallback(
    (id: string) => {
      discardEmailMutation.mutate(id);
    },
    [discardEmailMutation],
  );

  const upsertKnowledge = useCallback((entry: KnowledgeEntry) => {
    setKnowledge((prev) =>
      prev.some((k) => k.id === entry.id)
        ? prev.map((k) => (k.id === entry.id ? entry : k))
        : [entry, ...prev],
    );
  }, []);

  const removeKnowledge = useCallback((id: string) => {
    setKnowledge((prev) => prev.filter((k) => k.id !== id));
  }, []);

  const toggleHistorical = useCallback((id: string) => {
    setHistorical((prev) =>
      prev.map((h) => (h.id === id ? { ...h, included: !h.included } : h)),
    );
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const addAgentKey = useCallback((label: string) => {
    const key: AgentKey = {
      id: `ak_${Date.now()}`,
      label: label || "Untitled client",
      key: randomKey(),
      createdAt: new Date().toISOString(),
      lastUsed: null,
    };
    setSettings((prev) => ({ ...prev, agentKeys: [key, ...prev.agentKeys] }));
    return key;
  }, []);

  const revokeAgentKey = useCallback((id: string) => {
    setSettings((prev) => ({ ...prev, agentKeys: prev.agentKeys.filter((k) => k.id !== id) }));
  }, []);

  const value = useMemo<AppStateValue>(
    () => ({
      threads,
      sent,
      knowledge,
      historical,
      voice,
      settings,
      selectedId,
      selectThread,
      updateDraft,
      approveAndSend,
      discardDraft,
      upsertKnowledge,
      removeKnowledge,
      toggleHistorical,
      setVoice,
      updateSettings,
      addAgentKey,
      revokeAgentKey,
      isLoadingThreads,
    }),
    [
      threads,
      sent,
      knowledge,
      historical,
      voice,
      settings,
      selectedId,
      selectThread,
      updateDraft,
      approveAndSend,
      discardDraft,
      upsertKnowledge,
      removeKnowledge,
      toggleHistorical,
      updateSettings,
      addAgentKey,
      revokeAgentKey,
      isLoadingThreads,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
