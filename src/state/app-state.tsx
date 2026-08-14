import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import {
  defaultSettings,
  mockHistorical,
  mockKnowledge,
  mockThreads,
  mockVoice,
  type AgentKey,
  type AppSettings,
  type EmailThread,
  type HistoricalEmail,
  type KnowledgeEntry,
  type VoiceProfile,
} from "@/data/mock";

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
}

const AppStateContext = createContext<AppStateValue | null>(null);

function randomKey() {
  const chars = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < 20; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return `sk_mcp_${out}`;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [threads, setThreads] = useState<EmailThread[]>(mockThreads);
  const [sent, setSent] = useState<SentItem[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>(mockKnowledge);
  const [historical, setHistorical] = useState<HistoricalEmail[]>(mockHistorical);
  const [voice, setVoice] = useState<VoiceProfile>(mockVoice);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [selectedId, setSelectedId] = useState<string | null>(mockThreads[0]?.id ?? null);

  const selectThread = useCallback((id: string) => {
    setSelectedId(id);
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, unread: false } : t)));
  }, []);

  const updateDraft = useCallback((id: string, html: string) => {
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, draftHtml: html } : t)));
  }, []);

  const approveAndSend = useCallback((id: string) => {
    setThreads((prev) => {
      const thread = prev.find((t) => t.id === id);
      if (thread) {
        setSent((s) => [
          {
            id: `s_${id}_${Date.now()}`,
            subject: thread.subject,
            to: thread.senderEmail,
            html: thread.draftHtml,
            sentAt: new Date().toISOString(),
          },
          ...s,
        ]);
      }
      return prev.map((t) => (t.id === id ? { ...t, status: "sent", unread: false } : t));
    });
  }, []);

  const discardDraft = useCallback((id: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, draftHtml: "", status: "needs_review" } : t)),
    );
  }, []);

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
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}