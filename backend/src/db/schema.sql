CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  scheduled_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entries_scheduled_date ON entries (scheduled_date);

-- Ordered milestones for an entry's progress: the first (lowest "order") is the
-- start stage, the last is the end stage, and any in between are user-defined.
-- "done" marks the segment leading into that stage as complete.
CREATE TABLE IF NOT EXISTS progress_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES entries (id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  date DATE,
  "order" INTEGER NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  -- true for the auto-created start/end stages, as long as their label hasn't
  -- been edited by the user. Lets the frontend translate the label by language
  -- instead of treating it as free-form user text.
  is_default BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_progress_stages_entry_id ON progress_stages (entry_id);

CREATE TABLE IF NOT EXISTS memo_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES entries (id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  "order" INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_memo_lines_entry_id ON memo_lines (entry_id);

CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES entries (id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_photos_entry_id ON photos (entry_id);

CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES entries (id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attachments_entry_id ON attachments (entry_id);
