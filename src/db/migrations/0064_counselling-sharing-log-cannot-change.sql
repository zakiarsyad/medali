-- The log of sharing counselling data is a record that must always be
-- trusted, so the database itself refuses to change or delete a line of
-- it. Row triggers do not see TRUNCATE, which would empty a log in one
-- statement, so that has a trigger of its own. A sharing is held by its
-- log lines, so it cannot be deleted either. What a sharing gives to
-- whom was approved by the student as it is, so it cannot be changed:
-- other data needs a new request.
CREATE FUNCTION refuse_counselling_sharing_log_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The log of sharing counselling data cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER counselling_sharing_changes_cannot_change
BEFORE UPDATE OR DELETE ON counselling_sharing_changes
FOR EACH ROW EXECUTE FUNCTION refuse_counselling_sharing_log_edit();--> statement-breakpoint
CREATE TRIGGER counselling_sharing_changes_cannot_be_emptied
BEFORE TRUNCATE ON counselling_sharing_changes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_counselling_sharing_log_edit();--> statement-breakpoint
CREATE FUNCTION refuse_counselling_sharing_content_change() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'What a counselling sharing gives to whom cannot be changed; ask again instead.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER counselling_sharings_content_cannot_change
BEFORE UPDATE ON counselling_sharings
FOR EACH ROW
WHEN (
  OLD.student_id IS DISTINCT FROM NEW.student_id
  OR OLD.data IS DISTINCT FROM NEW.data
  OR OLD.recipients IS DISTINCT FROM NEW.recipients
  OR OLD.summary IS DISTINCT FROM NEW.summary
)
EXECUTE FUNCTION refuse_counselling_sharing_content_change();
