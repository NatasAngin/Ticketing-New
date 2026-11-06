-- Preserve the additional workflow metadata used by the ticketing UI.
ALTER TABLE tickets ADD COLUMN rejected_at TEXT;
ALTER TABLE tickets ADD COLUMN assignment_mode TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE tickets ADD COLUMN assigned_by TEXT REFERENCES users(id);
ALTER TABLE tickets ADD COLUMN assigned_at TEXT;
