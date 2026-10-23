import { may } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import { groupMemberAddress } from "./group-list-address";
import { mentorStudentAddress } from "./mentor-list-address";

type AddressOfStudent = (studentId: string) => string;

/**
 * The addresses that open a member's detail over the page of a group, at
 * the page of members shown, or null for roles without the right to a
 * student's detail: their member rows are then no links.
 */
export function openMemberAddresses(
  roles: readonly RoleId[],
  groupId: string,
  memberPage = 1,
): AddressOfStudent | null {
  if (!may(roles, "view_student_detail")) return null;
  return (studentId) => groupMemberAddress(groupId, studentId, memberPage);
}

/** The same over the page of a mentor, for the students they look after. */
export function openMentorStudentAddresses(
  roles: readonly RoleId[],
  mentorId: string,
  studentPage = 1,
): AddressOfStudent | null {
  if (!may(roles, "view_student_detail")) return null;
  return (studentId) => mentorStudentAddress(mentorId, studentId, studentPage);
}
