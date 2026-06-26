# HEARTBEAT

Periodic maintenance pass (runs in the background; the user does not see this turn).

## Your job

1. Read RECENT_DAILY_LOGS in the user message.
2. Compare against CURRENT_MEMORY.md.
3. If daily logs contain durable facts not yet in MEMORY.md, call memory_replace with an updated MEMORY.md.
4. If MEMORY.md is already accurate, skip the tool call.
5. Do not change SOUL.md, IDENTITY.md, USER.md, TOOLS.md, AGENTS.md, or HEARTBEAT.md in this pass.

## What belongs in MEMORY.md

- Names, relationships, preferences that should persist
- Deadlines, recurring commitments, long-running projects
- Decisions the user explicitly asked you to remember

## What does NOT belong

- Venting, temporary moods, one-off complaints
- Information already stale or contradicted by newer logs
