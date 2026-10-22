import { may } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import { firstParam, type SearchParams } from "@/ui/search-params";
import { DASHBOARD_ADDRESS, DETAIL_PARAM } from "./dashboard-address";

/** Dashboard pembangunan karakter, or Dashboard anak asuh. */
export type DashboardKind = "character" | "mentees";

/** How each view is named in the address. */
const KIND_PARAM = "tampilan";
const KIND_WORDS: Record<DashboardKind, string> = {
  character: "karakter",
  mentees: "anak-asuh",
};

/** The title of each view, as the switch between them names it. */
export const KIND_TITLES: Record<DashboardKind, string> = {
  character: "Dashboard pembangunan karakter",
  mentees: "Dashboard anak asuh",
};

/** The address of each view, as the switch between them leads to it. */
export function kindAddress(kind: DashboardKind): string {
  return `${DASHBOARD_ADDRESS}?${KIND_PARAM}=${KIND_WORDS[kind]}`;
}

export const MENTEE_DASHBOARD_ADDRESS = kindAddress("mentees");

/** The address of a student's detail, open over Dashboard anak asuh. */
export function menteeDetailAddress(studentId: string): string {
  return `${MENTEE_DASHBOARD_ADDRESS}&${DETAIL_PARAM}=${encodeURIComponent(studentId)}`;
}

/**
 * The views of the Dashboard an account's roles give, Dashboard
 * pembangunan karakter first. A person who is both gets both.
 */
export function dashboardKindsOf(roles: readonly RoleId[]): DashboardKind[] {
  const kinds: DashboardKind[] = [];
  if (may(roles, "view_character_dashboard")) kinds.push("character");
  if (may(roles, "view_mentee_dashboard")) kinds.push("mentees");
  return kinds;
}

/** The view the address asks for, or null when it names none. */
export function readDashboardKind(params: SearchParams): DashboardKind | null {
  const asked = firstParam(params[KIND_PARAM]);
  if (asked === KIND_WORDS.character) return "character";
  if (asked === KIND_WORDS.mentees) return "mentees";
  return null;
}

/**
 * The view to show: the one asked for when the account has it, or else
 * its first. Null for an account with neither.
 */
export function kindToShow(
  kinds: readonly DashboardKind[],
  asked: DashboardKind | null,
): DashboardKind | null {
  if (asked !== null && kinds.includes(asked)) return asked;
  return kinds[0] ?? null;
}
