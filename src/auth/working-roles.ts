import type { students } from "@/db/schema";
import { isBamRole } from "./bam-roles";
import type { RoleId } from "./role-ids";

type Student = Pick<typeof students.$inferSelect, "status" | "deletedAt">;

/**
 * The roles of an account that work right now. A BAM role is held by a
 * student and works only while that student is Aktif: on Cuti, Non aktif
 * or removed, it stays saved but opens nothing. The other roles, and the
 * roles of an account that is not a student's, are not touched.
 */
export function workingRoles(
  roles: RoleId[],
  student: Student | null,
): RoleId[] {
  if (student === null) return roles;
  const isActive = student.status === "active" && student.deletedAt === null;
  if (isActive) return roles;
  return roles.filter((role) => !isBamRole(role));
}
