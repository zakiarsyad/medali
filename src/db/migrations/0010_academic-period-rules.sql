-- Two academic periods never share a day, so one date always falls in one
-- period at most. Both the first and the last day belong to the period.
ALTER TABLE academic_periods
ADD CONSTRAINT academic_periods_days_do_not_overlap
EXCLUDE USING gist (daterange(starts_on, ends_on, '[]') WITH &&);--> statement-breakpoint
-- The log of period changes is a record that must always be trusted, so
-- the database itself refuses to change, delete or empty it.
CREATE FUNCTION refuse_academic_period_change_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The log of period changes cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER academic_period_changes_cannot_change
BEFORE UPDATE OR DELETE ON academic_period_changes
FOR EACH ROW EXECUTE FUNCTION refuse_academic_period_change_edit();--> statement-breakpoint
CREATE TRIGGER academic_period_changes_cannot_be_emptied
BEFORE TRUNCATE ON academic_period_changes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_academic_period_change_edit();
