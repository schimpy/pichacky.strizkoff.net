import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TOOLS = [
  {
    name: "get_summary",
    description: "Vrátí souhrn odpracovaného času za dnešek, tento týden nebo měsíc.",
    inputSchema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: ["today", "week", "month"],
          description: "Časové období: today, week, nebo month",
        },
      },
      required: ["period"],
    },
  },
  {
    name: "list_recent_entries",
    description: "Vrátí posledních N záznamů odpracovaného času.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Počet záznamů (výchozí: 10, max: 50)" },
      },
    },
  },
  {
    name: "get_stats_by_project",
    description: "Vrátí celkový odpracovaný čas seskupený podle projektu za dané období.",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "number", description: "Počet posledních dnů (výchozí: 30)" },
      },
    },
  },
];

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Chybí SUPABASE_SERVICE_ROLE_KEY env proměnná.");
  return createClient(url, key);
}

function fmtDuration(s: number) {
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

function periodStart(period: string) {
  const now = new Date();
  if (period === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  if (period === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

async function callTool(name: string, args: Record<string, unknown>): Promise<string> {
  const db = serviceClient();

  if (name === "get_summary") {
    const period = (args.period as string) ?? "today";
    const since = periodStart(period);
    const { data } = await db
      .from("time_entries")
      .select("duration_seconds, task:tasks(name, project:projects(name))")
      .gte("started_at", since)
      .not("ended_at", "is", null);

    const rows = (data ?? []) as unknown as {
      duration_seconds: number | null;
      task: { name: string; project: { name: string } | null } | null;
    }[];
    const total = rows.reduce((s, e) => s + (e.duration_seconds ?? 0), 0);
    const labels: Record<string, string> = { today: "dnes", week: "tento týden", month: "tento měsíc" };
    return `Odpracováno ${labels[period] ?? period}: **${fmtDuration(total)}** (${rows.length} záznamů)`;
  }

  if (name === "list_recent_entries") {
    const limit = Math.min(Number(args.limit ?? 10), 50);
    const { data } = await db
      .from("time_entries")
      .select("started_at, ended_at, duration_seconds, note, task:tasks(name, project:projects(name))")
      .not("ended_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(limit);

    const rows = (data ?? []) as unknown as {
      started_at: string;
      duration_seconds: number | null;
      note: string | null;
      task: { name: string; project: { name: string } | null } | null;
    }[];

    if (rows.length === 0) return "Žádné záznamy.";

    return rows
      .map((e) => {
        const date = new Date(e.started_at).toLocaleDateString("cs-CZ");
        const proj = e.task?.project?.name ? `${e.task.project.name} / ` : "";
        const note = e.note ? ` — ${e.note}` : "";
        return `• ${date} | ${proj}${e.task?.name ?? "?"} | ${fmtDuration(e.duration_seconds ?? 0)}${note}`;
      })
      .join("\n");
  }

  if (name === "get_stats_by_project") {
    const days = Number(args.days ?? 30);
    const since = new Date(Date.now() - days * 86400_000).toISOString();
    const { data } = await db
      .from("time_entries")
      .select("duration_seconds, task:tasks(project:projects(name))")
      .gte("started_at", since)
      .not("ended_at", "is", null);

    const rows = (data ?? []) as unknown as {
      duration_seconds: number | null;
      task: { project: { name: string } | null } | null;
    }[];

    const map = new Map<string, number>();
    for (const e of rows) {
      const k = e.task?.project?.name ?? "Bez projektu";
      map.set(k, (map.get(k) ?? 0) + (e.duration_seconds ?? 0));
    }
    const sorted = [...map.entries()].sort(([, a], [, b]) => b - a);
    if (sorted.length === 0) return "Žádná data.";
    return sorted.map(([name, s]) => `• ${name}: ${fmtDuration(s)}`).join("\n");
  }

  throw new Error(`Neznámý nástroj: ${name}`);
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (!process.env.MCP_API_KEY || apiKey !== process.env.MCP_API_KEY) {
    return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32001, message: "Unauthorized" } }, { status: 401 });
  }

  let body: { jsonrpc: string; id: unknown; method: string; params?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
  }

  const { id, method, params } = body;

  try {
    if (method === "initialize") {
      return Response.json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "pichacky", version: "1.0" },
        },
      });
    }

    if (method === "notifications/initialized" || method === "notifications/cancelled") {
      return new Response(null, { status: 204 });
    }

    if (method === "tools/list") {
      return Response.json({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
    }

    if (method === "tools/call") {
      const { name, arguments: toolArgs = {} } = params as { name: string; arguments?: Record<string, unknown> };
      const text = await callTool(name, toolArgs);
      return Response.json({
        jsonrpc: "2.0",
        id,
        result: { content: [{ type: "text", text }] },
      });
    }

    return Response.json({ jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ jsonrpc: "2.0", id, error: { code: -32000, message: msg } });
  }
}
