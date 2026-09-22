-- ============================================================
-- TwinERP Team Chat — Supabase SQL Migration
-- Run this ONCE in your Supabase project → SQL Editor
-- ============================================================

-- Teams
CREATE TABLE IF NOT EXISTS chat_teams (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        TEXT NOT NULL,
  created_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  restrict_history_to_membership_window BOOLEAN NOT NULL DEFAULT FALSE
);

-- Team memberships (never hard-delete — flip status to 'removed')
CREATE TABLE IF NOT EXISTS chat_team_memberships (
  id                        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  team_id                   TEXT NOT NULL REFERENCES chat_teams(id) ON DELETE CASCADE,
  user_id                   TEXT NOT NULL,
  role_in_team              TEXT NOT NULL DEFAULT 'Member',
  -- Chat privileges per membership
  can_post                  BOOLEAN NOT NULL DEFAULT TRUE,
  can_delete_others_messages BOOLEAN NOT NULL DEFAULT FALSE,
  can_remove_members        BOOLEAN NOT NULL DEFAULT FALSE,
  view_only                 BOOLEAN NOT NULL DEFAULT FALSE,
  -- Membership lifecycle
  status                    TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','removed')),
  joined_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removed_at                TIMESTAMPTZ,
  removed_by                TEXT
);

-- Messages (soft-delete only — never hard-delete)
CREATE TABLE IF NOT EXISTS chat_messages (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  team_id     TEXT NOT NULL REFERENCES chat_teams(id) ON DELETE CASCADE,
  sender_id   TEXT NOT NULL,
  content     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text','file','system')),
  reply_to_id TEXT REFERENCES chat_messages(id),  -- Phase 3: threaded replies
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at   TIMESTAMPTZ,
  deleted_at  TIMESTAMPTZ       -- NULL = not deleted; non-null = soft deleted
);

-- Attachments — Phase 2 (created now to avoid live migrations later)
CREATE TABLE IF NOT EXISTS chat_message_attachments (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  message_id  TEXT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  file_name   TEXT NOT NULL,
  mime_type   TEXT NOT NULL
);

-- Reactions — Phase 3 (created now to avoid live migrations later)
CREATE TABLE IF NOT EXISTS chat_message_reactions (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  message_id  TEXT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL,
  emoji       TEXT NOT NULL,
  UNIQUE(message_id, user_id, emoji)
);

-- Read state (last-read per user per team for unread badges)
CREATE TABLE IF NOT EXISTS chat_message_read_state (
  user_id             TEXT NOT NULL,
  team_id             TEXT NOT NULL REFERENCES chat_teams(id) ON DELETE CASCADE,
  last_read_message_id TEXT REFERENCES chat_messages(id),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, team_id)
);

-- ─── Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_chat_messages_team_created
  ON chat_messages(team_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_memberships_team_user_status
  ON chat_team_memberships(team_id, user_id, status);

CREATE INDEX IF NOT EXISTS idx_chat_memberships_user
  ON chat_team_memberships(user_id, status);

CREATE INDEX IF NOT EXISTS idx_chat_read_state_user
  ON chat_message_read_state(user_id);

-- ─── Enable Realtime (needed for Phase 3) ──────────────────
-- Run these in Supabase Dashboard → Database → Replication
-- or uncomment and run if using Supabase CLI:
-- ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE chat_team_memberships;
