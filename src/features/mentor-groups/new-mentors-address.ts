import { may } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";

/**
 * Where new mentors are added, for roles that may add them: a mentor is a
 * staff account, so it is the address of Pengguna dan peran. Null for
 * roles that would be refused there, which then get no line about it.
 */
export function newMentorsAddress(
  roles: readonly RoleId[],
  usersAddress: string,
): string | null {
  if (!may(roles, "manage_users")) return null;
  return usersAddress;
}
