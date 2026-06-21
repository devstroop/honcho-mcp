import { parseConfig, createClient } from "./config.js";
import { createServer } from "./server.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, mcp-session-id, X-Honcho-User-Name, X-Honcho-Workspace-ID, X-Honcho-Assistant-Name",
};

const config = parseConfig();
const honcho = createClient(config);
const sessions = new Map<string, any>();

async function createSessionTransport() {
  const { WebStandardStreamableHTTPServerTransport } = await import(
    "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
  );
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });
  const server = createServer({ honcho, config });
  await server.connect(transport);
  return transport;
}

function corsPreflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export default {
  port: parseInt(process.env.PORT || "3000", 10),
  hostname: process.env.HOST || "0.0.0.0",
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

      let requestBody: any = null;
      if (request.method === "POST") {
        try { requestBody = await request.clone().json(); }
        catch { }
      }

      const sessionId = request.headers.get("mcp-session-id");

      if (requestBody?.method === "initialize" && !sessionId) {
        const transport = await createSessionTransport();
        const resp = await transport.handleRequest(request);
        const newId = resp.headers.get("mcp-session-id");
        if (newId) sessions.set(newId, transport);
        return resp;
      }

      if (!sessionId) {
        return new Response(JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32000, message: "Bad Request: Mcp-Session-Id header is required" },
          id: null,
        }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
      }

      const transport = sessions.get(sessionId);
      if (!transport) {
        return new Response(JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32000, message: `Session ${sessionId} not found` },
          id: null,
        }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
      }

      if (request.method === "DELETE") {
        sessions.delete(sessionId);
      }

      return await transport.handleRequest(request);
    } catch (e) {
      return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }
  },
};
