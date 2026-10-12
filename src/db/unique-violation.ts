/** The code PostgreSQL gives a write that breaks a "one only" rule. */
const UNIQUE_VIOLATION = "23505";

function isRefusalBy(fault: Error, rule: string): boolean {
  if (!("code" in fault) || fault.code !== UNIQUE_VIOLATION) return false;
  return "constraint_name" in fault && fault.constraint_name === rule;
}

/**
 * Whether a write failed because the database's "one only" rule of that
 * name refused it. The database's own fault may be wrapped in another,
 * so each cause is looked at in turn.
 */
export function brokeUniqueRule(error: unknown, rule: string): boolean {
  let fault = error;
  while (fault instanceof Error) {
    if (isRefusalBy(fault, rule)) return true;
    fault = fault.cause;
  }
  return false;
}
