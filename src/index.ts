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
    onsessioninitialized: (id: string) => {
      sessions.set(id, transport);
    },
  });
  const server = createServer({ honcho, config });
  await server.connect(transport);
  return transport;
}

export default {
  port: parseInt(process.env.PORT || "3000", 10),
  hostname: process.env.HOST || "0.0.0.0",
  idleTimeout: 0,
  async fetch(request: Request): Promise<Response> {
    if (request.method === "OPTIONS") return corsPreflight();

    // Some MCP clients (Kilo, etc.) don't send Accept:
    // text/event-stream, application/json. The SDK transport
    // requires it and returns 406 without it. Inject it so any
    // MCP client works transparently.
    const accept = request.headers.get("Accept") || "";
    if (!accept.includes("text/event-stream")) {
      const newHeaders = new Headers(request.headers);
      newHeaders.set("Accept", "text/event-stream, application/json");
      request = new Request(request, { headers: newHeaders });
    }

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

      // Initialize: new transport for new session
      if (requestBody?.method === "initialize" && !sessionId) {
        const transport = await createSessionTransport();
        const resp = await transport.handleRequest(request);
        return resp;
      }

      if (!sessionId) {
        return new Response(JSON.stringify({
          jsonrpc: "2.0", error: { code: -32000, message: "Mcp-Session-Id header is required" }, id: null,
        }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
      }

      // Not initialized yet — wait for onsessioninitialized
      const transport = sessions.get(sessionId);
      if (!transport) {
        return new Response(JSON.stringify({
          jsonrpc: "2.0", error: { code: -32001, message: `Session ${sessionId} not found` }, id: null,
        }), { status: 404, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
      }

      if (request.method === "DELETE") { sessions.delete(sessionId); }
      return await transport.handleRequest(request);
    } catch (e) {
      return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error" }), {
        status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }
  },
};
