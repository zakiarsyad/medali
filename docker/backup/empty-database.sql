-- Empties the database before a backup is put into it: every table,
-- with the bookkeeping of the table changes and the campus mark, which
-- the backup brings back. The restore command runs it together with the
-- backup, as one change that happens fully or not at all.

-- Otherwise each removal says how many things it removed with it.
SET client_min_messages = warning;

DO $$
DECLARE
  schema_name text;
BEGIN
  FOR schema_name IN
    SELECT nspname FROM pg_namespace
    WHERE nspname NOT LIKE 'pg\_%' AND nspname <> 'information_schema'
  LOOP
    EXECUTE format('DROP SCHEMA %I CASCADE', schema_name);
  END LOOP;
END
$$;

-- A backup does not make this one itself.
CREATE SCHEMA public;
