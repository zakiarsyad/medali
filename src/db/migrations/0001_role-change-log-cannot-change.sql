-- The role change log is a record that must always be trusted, so the
-- database itself refuses to change or delete a line of it.
CREATE FUNCTION refuse_role_change_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The role change log cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER role_changes_cannot_change
BEFORE UPDATE OR DELETE ON role_changes
FOR EACH ROW EXECUTE FUNCTION refuse_role_change_edit();
