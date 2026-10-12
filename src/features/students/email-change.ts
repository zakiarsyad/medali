import type { emailChanges } from "@/db/schema";

/** What a line of the address change log says about the address itself. */
export type EmailChange = Required<
  Pick<
    typeof emailChanges.$inferInsert,
    "action" | "emailBefore" | "emailAfter"
  >
>;

/**
 * What goes to the address change log when the address of a student's
 * account goes from `before` to `after`, or null when it did not change:
 * then no line is written.
 */
export function emailChangeOf(
  before: string | null,
  after: string | null,
): EmailChange | null {
  if (before === after) return null;
  if (before === null) {
    return { action: "added", emailBefore: null, emailAfter: after };
  }
  if (after === null) {
    return { action: "cleared", emailBefore: before, emailAfter: null };
  }
  return { action: "changed", emailBefore: before, emailAfter: after };
}
