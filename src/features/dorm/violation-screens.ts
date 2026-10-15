import { may } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";

/** Which parts of the tab Pelanggaran an account sees. */
export interface ViolationScreens {
  /** The staff screen: the numbers, the rekap and the announcement of every resident. */
  staff: boolean;
  /** The resident's own record, with "Ajukan advokasi" while it may be appealed. */
  own: boolean;
}

/**
 * What the roles of an account open on the tab. A person may do what any
 * of their roles allows, so a resident who is also a BAM member sees the
 * staff screen and their own record under it. Whether the student lives
 * in a dorm today is checked when the record is read.
 */
export function violationScreensOf(roles: readonly RoleId[]): ViolationScreens {
  return {
    staff: may(roles, "view_dorm_violations"),
    own: may(roles, "view_own_dorm_violations"),
  };
}
