# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2025-01-01

### Added

- Initial release of the remote MCP server
- HTTP SSE transport with session management
- Workspace tools: inspect, list, search, get/set metadata
- Peer tools: create, list, chat, peer cards, context, representation
- Session tools: create, list, delete, clone, messages, peers
- Conclusion tools: list, query, create, delete
- System tools: dream scheduling, queue status
- Docker multi-stage build with Bun runtime
- Per-request client header overrides (user name, assistant name, workspace ID)
- CORS support for cross-origin clients
