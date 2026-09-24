# Coach Chat Architecture

## Overview

The BodyOS Coach Chat provides AI-powered fitness coaching through a dual-mode system:
- **Demo mode** — local pattern-matched responses (offline, no API calls)
- **Real mode** — GPT-4o responses via Supabase Edge Function with DB persistence

```
Mobile App  →  Supabase Edge Function (chat-coach)  →  OpenAI GPT-4o
    ↕                        ↕
  Supabase JS            Supabase DB
  (client)             (ai_conversations,
                        ai_messages)
```

## Edge Function: `chat-coach`

**Location:** `supabase/functions/chat-coach/index.ts`

### Request

```json
POST /functions/v1/chat-coach
Content-Type: application/json
Authorization: Bearer <anon_key>

{
  "conversation_id": "uuid",
  "message": "How can I fix my forward head posture?",
  "user_context": "Name: Neo. Goals: improve_posture. Latest posture score: 72/100. Issues: forward head, rounded shoulders."
}
```

### Response

```json
{
  "id": "uuid",
  "role": "assistant",
  "content": "Based on your posture score of 72...",
  "createdAt": "2026-01-30T12:00:00.000Z"
}
```

### Flow

1. Validate request (`conversation_id` and `message` required)
2. Insert user message into `ai_messages`
3. Fetch last 20 messages for conversation context
4. Build system prompt + inject `user_context`
5. Call OpenAI GPT-4o (max 500 tokens, temperature 0.7)
6. Insert assistant response into `ai_messages`
7. Update `ai_conversations.updated_at`
8. Return assistant message

### Secrets Required

| Secret | Description |
|--------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-provided by Supabase |
| `SUPABASE_URL` | Auto-provided by Supabase |

Set the OpenAI key:
```bash
supabase secrets set OPENAI_API_KEY=sk-...
```

## System Prompt

The coach persona is defined inline in the edge function. Key traits:
- Encouraging but honest
- Data-driven (references user's posture scores, streak, goals)
- Concise (2-4 paragraphs max)
- Safety-first (refers pain/injury to professionals)
- Plain text output (no markdown — mobile chat UI)

## Database Tables

### `ai_conversations`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `user_id` | uuid (FK) | References auth.users |
| `title` | text | Conversation title |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `ai_messages`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `conversation_id` | uuid (FK) | References ai_conversations |
| `role` | text | 'user' or 'assistant' |
| `content` | text | Message content |
| `feedback` | text | 'positive', 'negative', or null |
| `created_at` | timestamptz | |

Both tables have RLS policies enabled.

## Client Architecture

### `aiService.ts`
Dual-mode service layer. A `chatMode` flag (`'demo' | 'real'`) controls routing:
- **Demo:** AsyncStorage-backed local conversations with pattern-matched responses
- **Real:** Supabase DB queries + Edge Function calls

### `useAI` Hook
Exposes:
- `isDemo` — current mode
- `exitDemo()` — switches to real mode, creates fresh DB conversation
- `enterDemo()` — switches back to demo mode
- `sendMessage(text)` — optimistic UI update, then API call
- `newConversation()` — create new thread
- `selectConversation(id)` — switch between threads
- `submitFeedback(messageId, feedback)` — thumbs up/down

### `AssistantScreen`
- Demo banner with "Go Live" button when in demo mode
- Green "Live" dot indicator when in real mode
- New conversation (+) and history (clock) icons in header
- Conversation history modal (bottom sheet)
- Error banner with dismiss

### `ChatBubble`
- Thumbs up/down feedback buttons on assistant messages (real mode only)
- Toggle feedback on/off by tapping again

## Deployment

```bash
# Deploy the edge function
supabase functions deploy chat-coach

# Set the OpenAI secret
supabase secrets set OPENAI_API_KEY=sk-...
```

## Future Roadmap

### Short-term Memory
Conversation context within a session is handled by sending the last 20 messages to OpenAI. No additional work needed.

### Long-term Memory
- Create a `user_memory` table for key facts extracted by AI
- After each conversation, run an extraction step to pull out: goals mentioned, injuries, preferences, progress milestones
- Inject memory summaries into the system prompt

### User Data Access
- Coach reads posture scores, workout history, streak, and goals via `user_context`
- Future: pass full workout session data, progress photo analysis results

### Proactive Coaching
- Scheduled Supabase cron job checks user activity
- Sends push notifications for check-ins: "You haven't trained in 3 days — want a quick mobility routine?"
- Uses Edge Function to generate personalized nudge messages

### Voice Input
- Whisper API transcription for voice messages
- Edge function receives audio → transcribes → processes as text → returns text response
- Future: TTS for coach voice responses

### RAG (Retrieval-Augmented Generation)
- Exercise knowledge base with proper form cues, progressions, alternatives
- Embed exercise descriptions in a vector store
- Query relevant exercises when user asks about specific movements
- Ensures accurate coaching cues rather than relying on LLM training data

### WhatsApp Channel
- Same `chat-coach` edge function, different transport layer
- WhatsApp Business API webhook → Edge Function → same DB persistence
- User can chat with coach via WhatsApp or the app interchangeably
