import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  url: z.string().trim().url("Enter a full https:// MCP endpoint URL"),
  token: z.string().trim().optional(),
});

export interface MailboxTestResult {
  ok: boolean;
  tools: string[];
  message: string;
}

/**
 * Calls the configured email MCP server (JSON-RPC `tools/list`) from the server
 * runtime so the auth token never leaves the backend and CORS never applies.
 */
export const testMailboxConnection = createServerFn({ method: "POST" })
  .validator((data: unknown) => schema.parse(data))
  .handler(async ({ data }): Promise<MailboxTestResult> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    };
    if (data.token) headers["Authorization"] = `Bearer ${data.token}`;

    try {
      const res = await fetch(data.url, {
        method: "POST",
        headers,
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
      });

      const text = await res.text();
      if (!res.ok) {
        return { ok: false, tools: [], message: `Server replied ${res.status}: ${text.slice(0, 200)}` };
      }

      // Streamable HTTP servers may answer with SSE framing.
      const jsonText = text.includes("data:")
        ? (text.split("\n").find((l) => l.startsWith("data:")) ?? "").slice(5).trim()
        : text;

      const parsed = JSON.parse(jsonText) as {
        result?: { tools?: Array<{ name?: string }> };
        error?: { message?: string };
      };

      if (parsed.error) {
        return { ok: false, tools: [], message: parsed.error.message ?? "MCP server returned an error" };
      }

      const tools = (parsed.result?.tools ?? [])
        .map((t) => t.name)
        .filter((n): n is string => Boolean(n));

      return { ok: true, tools, message: `Connected — ${tools.length} tool(s) available` };
    } catch (err) {
      return {
        ok: false,
        tools: [],
        message: err instanceof Error ? err.message : "Could not reach the MCP endpoint",
      };
    }
  });
