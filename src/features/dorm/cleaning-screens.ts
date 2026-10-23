import { may } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";

/** Which parts of the tab Pembersihan asrama an account sees. */
export interface CleaningScreens {
  /** The staff screen: the places, the schedule and the ranking. */
  staff: boolean;
  /** The resident's own part: their room's score and duties. */
  own: boolean;
}

/**
 * What the roles of an account open on the tab. A person may do what any
 * of their roles allows, so a resident who is also a BAM member sees
 * their own part above the staff screen. Whether the student lives in a
 * dorm today is checked when their part is read.
 */
export function cleaningScreensOf(roles: readonly RoleId[]): CleaningScreens {
  return {
    staff: may(roles, "view_dorm_cleaning"),
    own: may(roles, "view_own_dorm_cleaning"),
  };
}
