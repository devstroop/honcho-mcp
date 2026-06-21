# Honcho Remote MCP Server

A remote [MCP](https://modelcontextprotocol.io/) server for [Honcho](https://honcho.dev), providing AI memory and personalization tools to LLM clients like Claude Desktop.

Clients connect over HTTP SSE — no local process spawning, no stdio bridge needed.

## Deploy

### Docker (recommended)

```bash
docker build -t honcho-mcp .
docker run -d -p 3000:3000 \
  -e HONCHO_API_URL=http://your-honcho-backend:8000 \
  -e HONCHO_API_KEY=your-key \
  -e HONCHO_USER_NAME=your-name \
  honcho-mcp
```

### Manual

```bash
bun install
HONCHO_API_URL=http://your-honcho-backend:8000 HONCHO_API_KEY=your-key HONCHO_USER_NAME=your-name bun start
```

## Connect

Add the server URL to your MCP client config:

> **Note**: The server reads these headers on every request and
> they **override** the server-side environment variable defaults.
> This lets you switch users/workspaces without restarting the server.
> The server handles both SSE (GET) and JSON-RPC (POST) at the root `/` path.

**VS Code** — add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "honcho": {
      "type": "http",
      "url": "http://your-host:3000",
      "headers": {
        "Authorization": "Bearer your-honcho-api-key",
        "X-Honcho-User-Name": "your-user-name",
        "X-Honcho-Workspace-ID": "default",
        "X-Honcho-Assistant-Name": "Assistant"
      }
    }
  }
}
```

**Claude Desktop** — edit `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "honcho": {
      "type": "http",
      "url": "http://your-host:3000",
      "headers": {
        "Authorization": "Bearer your-honcho-api-key",
        "X-Honcho-User-Name": "your-user-name",
        "X-Honcho-Workspace-ID": "default",
        "X-Honcho-Assistant-Name": "Assistant"
      }
    }
  }
}
```

## Configuration

All settings are server-side environment variables. None are passed by the client.

| Variable | Default | Description |
| --- | --- | --- |
| `HONCHO_API_KEY` | — | Honcho API key (required) |
| `HONCHO_USER_NAME` | `user` | Default user name |
| `HONCHO_ASSISTANT_NAME` | `Assistant` | Default assistant name |
| `HONCHO_API_URL` | `http://localhost:8000` | Self-hosted Honcho backend URL |
| `HONCHO_WORKSPACE_ID` | `default` | Workspace to operate in |
| `PORT` | `3000` | MCP server listen port |
| `HOST` | `0.0.0.0` | MCP server listen host |

## Available Tools

**Workspace:** `inspect_workspace`, `list_workspaces`, `search`, `get_metadata`, `set_metadata`

**Peers:** `create_peer`, `list_peers`, `chat`, `get_peer_card`, `set_peer_card`, `get_peer_context`, `get_representation`

**Sessions:** `create_session`, `list_sessions`, `delete_session`, `clone_session`, `add_peers_to_session`, `remove_peers_from_session`, `get_session_peers`, `inspect_session`, `add_messages_to_session`, `get_session_messages`, `get_session_message`, `get_session_context`

**Conclusions:** `list_conclusions`, `query_conclusions`, `create_conclusions`, `delete_conclusion`

**System:** `schedule_dream`, `get_queue_status`

## Development

```bash
bun install
bun start        # http://localhost:3000
bun run build    # type-check
```
