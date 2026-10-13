import { type AccountForAccess, mayOpenTab } from "@/auth/access";
import { evaluationAddress } from "./evaluation-address";
import { evaluatedRowsFor } from "./visible-evaluations";

/**
 * The address of the form that evaluates the mentor of a group, for an
 * account that may evaluate and may open the tab the form is on, or null
 * for any other: the page of a group shows its button only with this.
 */
export function openEvaluationAddress(
  account: AccountForAccess,
  groupId: string,
): string | null {
  if (evaluatedRowsFor(account) === null) return null;
  if (!mayOpenTab(account.roles, "mentors", "replacement")) return null;
  return evaluationAddress(groupId);
}
