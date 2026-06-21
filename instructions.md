# Honcho MCP — Tool Instructions

## Quick Start

### 1. Create a session

```
create_session
  session_id: "<unique-id>"
```

### 2. Add peers

```
create_peer
  peer_id: "<user-name>"

create_peer
  peer_id: "Assistant"

add_peers_to_session
  session_id: "<session_id>"
  peers:
    - peer_id: "<user-name>"
      observe_me: true
      observe_others: true
    - peer_id: "Assistant"
      observe_me: false
      observe_others: true
```

Store the `session_id` for the rest of this conversation.

### 3. Get personalization insights (before responding, when helpful)

```
chat
  peer_id: "Assistant"
  query: "What communication style does this user prefer?"
  target_peer_id: "<user-name>"
  session_id: "<session_id>"
```

**Good queries:**
- "What does this message reveal about the user's communication preferences?"
- "How formal or casual should I be?"
- "What is the user really asking for beyond their explicit question?"
- "What emotional state might the user be in right now?"

### 4. Record the turn (after every exchange)

```
add_messages_to_session
  session_id: "<session_id>"
  messages:
    - peer_id: "<user-name>"
      content: "<exact user message>"
    - peer_id: "Assistant"
      content: "<your exact response>"
```

---

## Tool Reference

### Workspace

| Tool | Use |
| --- | --- |
| `inspect_workspace` | Inspect workspace metadata, peers, and sessions at a glance |
| `list_workspaces` | Enumerate accessible workspaces |
| `search` | Semantic search across messages — scope with optional `peer_id` or `session_id` |
| `get_metadata` | Read metadata at workspace, peer, or session level |
| `set_metadata` | Store metadata at workspace, peer, or session level |

### Peers

| Tool | Use |
| --- | --- |
| `create_peer` | Register a peer (user or agent) |
| `list_peers` | List all peers in the workspace |
| `chat` | Query Honcho's reasoning about a peer. Accepts `reasoning_level` (`minimal`–`max`) |
| `get_peer_card` | Get biographical facts about a peer |
| `set_peer_card` | Manually set or correct peer facts |
| `get_peer_context` | Full context: representation + peer card |
| `get_representation` | Textual representation built from conclusions |

### Sessions

| Tool | Use |
| --- | --- |
| `create_session` | Get or create a session by ID |
| `list_sessions` | Discover existing sessions |
| `delete_session` | Permanently remove a session |
| `clone_session` | Fork a conversation, optionally up to a message |
| `add_peers_to_session` | Add peers with per-session config |
| `remove_peers_from_session` | Remove peers from a session |
| `get_session_peers` | See who is in a session |
| `inspect_session` | Detailed session structure and metadata |
| `add_messages_to_session` | Record conversation turns |
| `get_session_messages` | Read conversation history (paginated, filterable) |
| `get_session_message` | Get a single message by ID |
| `get_session_context` | LLM-ready context (messages + summary) |

### Conclusions

| Tool | Use |
| --- | --- |
| `list_conclusions` | See derived facts about a peer |
| `query_conclusions` | Semantic search across conclusions |
| `create_conclusions` | Manually inject facts |
| `delete_conclusion` | Remove incorrect or outdated facts |

### System

| Tool | Use |
| --- | --- |
| `schedule_dream` | Trigger memory consolidation for better insights |
| `get_queue_status` | Check if background processing is complete |

---

## Concepts

**Peer** — any participant (human or AI) in the workspace.

**Session** — a conversation context that tracks message history and peer participation.

**Conclusion** — a fact or observation Honcho derives from conversations, powering peer representations.

**Representation** — a formatted text summary built from a peer's conclusions.

**Peer Card** — a compact list of biographical facts about a peer, auto-maintained by Honcho.

**Reasoning Level** — controls depth vs. speed: `minimal`, `low`, `medium`, `high`, `max`. Default is `low`.

**Dream** — background memory-consolidation process that merges redundancies and generates higher-level insights.
