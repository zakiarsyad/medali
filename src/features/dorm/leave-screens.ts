import { may } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";

/** Which parts of the tab Perizinan asrama an account sees. */
export interface LeaveScreens {
  /** The staff screen: the numbers and the request cards. */
  staff: boolean;
  /** The resident's own part: "Ajukan izin", Ketentuan and "Riwayat izin saya". */
  own: boolean;
}

/**
 * What the roles of an account open on the tab. A person may do what any
 * of their roles allows, so a resident who is also BAM - BPHK sees their
 * own part above the staff screen. Whether the student lives in a dorm
 * today is checked when their part is read.
 */
export function leaveScreensOf(roles: readonly RoleId[]): LeaveScreens {
  return {
    staff: may(roles, "view_dorm_leave"),
    own: may(roles, "ask_dorm_leave"),
  };
}
