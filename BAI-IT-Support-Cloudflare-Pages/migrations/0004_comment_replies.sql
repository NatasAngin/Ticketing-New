-- Store discussion reply relationships centrally.
ALTER TABLE ticket_comments ADD COLUMN reply_to TEXT REFERENCES ticket_comments(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_ticket_comments_reply ON ticket_comments(reply_to);
