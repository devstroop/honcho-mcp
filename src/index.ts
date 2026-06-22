import { parseConfig, createClient } from "./config.js";
import { createServer } from "./server.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, mcp-session-id, X-Honcho-User-Name, X-Honcho-Workspace-ID, X-Honcho-Assistant-Name",
};

const config = parseConfig();
const honcho = createClient(config);
const server = createServer({ honcho, config });
const sessions = new Map<string, any>();

async function createSessionTransport() {
  const { WebStandardStreamableHTTPServerTransport } = await import(
    "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
  );
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });
  await server.connect(transport);
  return transport;
}

function withSid(resp: Response, sid: string): Response {
  if (!sid || resp.headers.has("mcp-session-id")) return resp;
  const h = new Headers(resp.headers);
  h.set("mcp-session-id", sid);
  return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: h });
}

function corsPreflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export default {
  port: parseInt(process.env.PORT || "3000", 10),
  hostname: process.env.HOST || "0.0.0.0",
  idleTimeout: 0,
  async fetch(request: Request): Promise<Response> {
    if (request.method === "OPTIONS") return corsPreflight();
    try {
      if (request.method === "GET" && !request.headers.has("mcp-session-id")) {
        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        });
      }

      let requestBody: any = null;
      if (request.method === "POST") {
        try { requestBody = await request.clone().json(); } catch {}
      }

      const sessionId = request.headers.get("mcp-session-id");

      if (requestBody?.method === "initialize" && !sessionId) {
        const transport = await createSessionTransport();
        const resp = await transport.handleRequest(request);
        const newId = resp.headers.get("mcp-session-id");
        if (newId) sessions.set(newId, transport);
        return withSid(resp, newId || "");
      }

      if (!sessionId) {
        return new Response(JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32000, message: "Mcp-Session-Id header is required" },
          id: null,
        }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
      }

      if (!sessions.has(sessionId)) {
        const transport = await createSessionTransport();
        sessions.set(sessionId, transport);
      }

      const transport = sessions.get(sessionId);
      if (request.method === "DELETE") {
        sessions.delete(sessionId);
      }

      const resp = await transport.handleRequest(request);
      return withSid(resp, sessionId);
    } catch (e) {
      return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }
  },
};
