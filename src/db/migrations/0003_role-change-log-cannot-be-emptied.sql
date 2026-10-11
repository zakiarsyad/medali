-- Row triggers do not see TRUNCATE, which would empty the role change log
-- in one statement. The database refuses that too.
CREATE TRIGGER role_changes_cannot_be_emptied
BEFORE TRUNCATE ON role_changes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_role_change_edit();
