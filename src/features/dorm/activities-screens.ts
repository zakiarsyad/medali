import { may } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";

/** Which parts of the tab Kegiatan asrama an account sees. */
export interface ActivitiesScreens {
  /** The staff screen: Jadwal harian, and Penghitungan kehadiran for those who count. */
  staff: boolean;
  /** The resident's own part: their numbers, "Hari ini", "Akan datang" and Riwayat. */
  own: boolean;
}

/**
 * What the roles of an account open on the tab. A person may do what any
 * of their roles allows, so a resident who is also a BAM member sees
 * their own part above the staff screen. Whether the student lives in a
 * dorm today is checked when their part is read.
 */
export function activitiesScreensOf(
  roles: readonly RoleId[],
): ActivitiesScreens {
  return {
    staff: may(roles, "view_dorm_activities"),
    own: may(roles, "view_own_dorm_activities"),
  };
}
