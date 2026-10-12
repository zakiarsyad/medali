import { may } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import { groupMemberAddress } from "./group-list-address";

/**
 * The addresses that open a member's detail over the page of a group, or
 * null for roles without the right to a student's detail: their member
 * rows are then no links.
 */
export function openMemberAddresses(
  roles: readonly RoleId[],
  groupId: string,
): ((studentId: string) => string) | null {
  if (!may(roles, "view_student_detail")) return null;
  return (studentId) => groupMemberAddress(groupId, studentId);
}
