import { may } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import { groupMemberAddress } from "./group-list-address";
import { mentorStudentAddress } from "./mentor-list-address";

type AddressOfStudent = (studentId: string) => string;

/**
 * The addresses that open a member's detail over the page of a group, or
 * null for roles without the right to a student's detail: their member
 * rows are then no links.
 */
export function openMemberAddresses(
  roles: readonly RoleId[],
  groupId: string,
): AddressOfStudent | null {
  if (!may(roles, "view_student_detail")) return null;
  return (studentId) => groupMemberAddress(groupId, studentId);
}

/** The same over the page of a mentor, for the students they look after. */
export function openMentorStudentAddresses(
  roles: readonly RoleId[],
  mentorId: string,
): AddressOfStudent | null {
  if (!may(roles, "view_student_detail")) return null;
  return (studentId) => mentorStudentAddress(mentorId, studentId);
}
