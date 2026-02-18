-- 002_legacy_compat.sql
-- Safe upgrades for databases created before full schema

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'activities'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'user_id'
    ) THEN
      ALTER TABLE activities ADD COLUMN user_id BIGINT;
      ALTER TABLE activities ADD CONSTRAINT activities_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
  END IF;
END$$;
