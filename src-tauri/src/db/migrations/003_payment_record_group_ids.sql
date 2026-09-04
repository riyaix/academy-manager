-- Backfill group_ids_json for databases created before it was part of the schema.
ALTER TABLE payment_records
ADD COLUMN group_ids_json TEXT NOT NULL DEFAULT '[]';

INSERT INTO schema_version (version, description)
VALUES (3, 'payment_record_group_ids');
