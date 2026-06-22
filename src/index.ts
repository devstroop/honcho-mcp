import { parseConfig, createClient } from "./config.js";
import { createServer } from "./server.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, mcp-session-id, X-Honcho-User-Name, X-Honcho-Workspace-ID, X-Honcho-Assistant-Name",
};

const config = parseConfig();
const honcho = createClient(config);

// WebStandardStreamableHTTPServerTransport is a SERVER-SIDE SINGLETON.
// It handles ALL sessions internally via handleRequest() — no need
// for a sessions Map or per-connect transport instances.
// McpServer.connect(transport) can only be called ONCE per server.
let transportSingleton: any = null;

async function ensureTransport() {
  if (transportSingleton) return;
  const { WebStandardStreamableHTTPServerTransport } = await import(
    "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
  );
  transportSingleton = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });
  const server = createServer({ honcho, config });
  await server.connect(transportSingleton);
}

function corsPreflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function withSessionHeader(resp: Response, sessionId: string): Response {
  if (resp.headers.has("mcp-session-id")) return resp;
  if (!sessionId) return resp;
  const h = new Headers(resp.headers);
  h.set("mcp-session-id", sessionId);
  return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: h });
}

export default {
  port: parseInt(process.env.PORT || "3000", 10),
  hostname: process.env.HOST || "0.0.0.0",
  idleTimeout: 0,
  async fetch(request: Request): Promise<Response> {
    if (request.method === "OPTIONS") return corsPreflight();

    try {
      // Health check — GET / without a session
      if (request.method === "GET" && !request.headers.has("mcp-session-id")) {
        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        });
      }

      // Ensure transport is initialized on first request
      if (!transportSingleton) {
        await ensureTransport();
      }

      // Forward ALL requests (initialize, tools/list, tools/call, etc.)
      // to the transport. It handles sessions internally via mcp-session-id header.
      const resp = await transportSingleton.handleRequest(request);
      const newId = resp.headers.get("mcp-session-id");

      if (request.method === "DELETE") {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
      }

      // Ensure mcp-session-id is always in response for VS Code compatibility
      return withSessionHeader(resp, newId || request.headers.get("mcp-session-id") || "");
    } catch (e) {
      return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }
  },
};
