-- Add optional voided_at timestamp for audit trail (Phase 4.6).
ALTER TABLE payment_records
ADD COLUMN voided_at TEXT;

INSERT INTO schema_version (version, description)
VALUES (2, 'payment_record_voided_at');
