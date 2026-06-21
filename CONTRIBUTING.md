# Contributing to Honcho MCP Server

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
# Install dependencies
bun install

# Start the dev server
bun start

# Type-check
bun run build
```

## Project Structure

```
src/
├── index.ts          # Bun HTTP server entrypoint
├── config.ts         # Honcho client configuration
├── server.ts         # MCP server setup
├── types.ts          # Shared types and formatters
└── tools/            # MCP tool implementations
    ├── workspace.ts
    ├── peers.ts
    ├── sessions.ts
    ├── conclusions.ts
    └── system.ts
```

## Code Style

- TypeScript strict mode, ES2022 target
- No semicolons in source (prettier-configured)
- Use `const` over `let` where possible
- Keep functions focused and small
- Import types with `import type` when only using the type

## Pull Request Process

1. Fork the repo and create a branch from `main`
2. Run `bun run build` and fix any type errors
3. Keep PRs focused — one feature/fix per PR
4. Write a clear PR description explaining what and why
5. Ensure the PR title follows conventional commits (`feat:`, `fix:`, `docs:`, etc.)

## Commit Messages

Use conventional commit format:

```
feat: add session cloning support
fix: handle missing session-id header gracefully
docs: update client configuration examples
```

## Running Tests

This project currently has no automated test suite. Manual verification steps:

- Start the server with `bun start`
- Connect an MCP client (Claude Desktop, VS Code)
- Verify tools listed in README are functional

## Questions?

Open a [GitHub Discussion](https://github.com/devstroop/honcho-mcp/issues) or refer to the [README](./README.md).
