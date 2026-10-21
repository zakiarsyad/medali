-- Who read a student's shared counselling data is a record that must
-- always be trusted, so the database itself refuses to change or delete
-- a line of it. Row triggers do not see TRUNCATE, which would empty the
-- log in one statement, so that has a trigger of its own.
CREATE TRIGGER counselling_sharing_reads_cannot_change
BEFORE UPDATE OR DELETE ON counselling_sharing_reads
FOR EACH ROW EXECUTE FUNCTION refuse_counselling_sharing_log_edit();--> statement-breakpoint
CREATE TRIGGER counselling_sharing_reads_cannot_be_emptied
BEFORE TRUNCATE ON counselling_sharing_reads
FOR EACH STATEMENT EXECUTE FUNCTION refuse_counselling_sharing_log_edit();
