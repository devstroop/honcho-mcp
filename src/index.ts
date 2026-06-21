import { parseConfig, createClient } from "./config.js";
import { createServer } from "./server.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
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
      if (request.method === "GET" && !request.headers.has("mcp-session-id")) {
        let interval: ReturnType<typeof setInterval> | undefined;
        const body = new ReadableStream({
          start(controller) {
            interval = setInterval(() => {
              try { controller.enqueue(new TextEncoder().encode(": keepalive\n\n")); }
              catch { clearInterval(interval); }
            }, 30_000);
            request.signal.addEventListener("abort", () => clearInterval(interval));
          },
          cancel() { if (interval) clearInterval(interval); },
        });
        return new Response(body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            ...CORS_HEADERS,
          },
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
