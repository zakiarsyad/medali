import { PAGES, type Page, type PageId, type TabDefinition } from "./pages";
import type { RoleId } from "./role-ids";
import { type Action, ROLES } from "./roles";

export interface AccountForAccess {
  id: string;
  roles: readonly RoleId[];
  studyProgramId: number | null;
  studentId: string | null;
}

export type RowLimit =
  | { kind: "all" }
  | {
      kind: "some";
      studyProgramIds: number[];
      /** Account ids of mentors whose mentees may be seen. */
      menteesOf: string[];
      studentIds: string[];
    };

export function may(roles: readonly RoleId[], action: Action): boolean {
  return roles.some((role) => ROLES[role].actions.includes(action));
}

export function mayOpenPage(roles: readonly RoleId[], page: PageId): boolean {
  return roles.some((role) => ROLES[role].pages.includes(page));
}

/** The pages an account may open, in menu order. */
export function pagesFor(roles: readonly RoleId[]): Page[] {
  return PAGES.filter((page) => mayOpenPage(roles, page.id));
}

/**
 * Whether a page is open to these roles only while the account's student
 * lives in the dorm: every role that opens it asks for a resident.
 */
export function needsDormResident(
  roles: readonly RoleId[],
  page: PageId,
): boolean {
  const openers = roles.filter((role) => ROLES[role].pages.includes(page));
  if (openers.length === 0) return false;
  return openers.every(
    (role) => ROLES[role].residentPages?.includes(page) ?? false,
  );
}

/** The pages for the menu of an account that lives in the dorm or not. */
export function pagesForAccount(
  roles: readonly RoleId[],
  livesInDorm: boolean,
): Page[] {
  if (livesInDorm) return pagesFor(roles);
  return pagesFor(roles).filter((page) => !needsDormResident(roles, page.id));
}

function roleHasTab(role: RoleId, page: PageId, tab: string): boolean {
  const tabs: Partial<Record<PageId, readonly string[]>> = ROLES[role].tabs;
  return tabs[page]?.includes(tab) ?? false;
}

/** The tabs of one page an account may open, in the page's order. */
export function tabsFor(
  roles: readonly RoleId[],
  pageId: PageId,
): TabDefinition[] {
  const page = PAGES.find((candidate) => candidate.id === pageId);
  if (!page || !("tabs" in page)) return [];
  return page.tabs.filter((tab) =>
    roles.some((role) => roleHasTab(role, pageId, tab.id)),
  );
}

export function mayOpenTab(
  roles: readonly RoleId[],
  page: PageId,
  tab: string,
): boolean {
  if (!mayOpenPage(roles, page)) return false;
  return roles.some((role) => roleHasTab(role, page, tab));
}

/** The limits of these roles of an account together. */
function rowLimitOf(
  account: AccountForAccess,
  roles: readonly RoleId[],
): RowLimit {
  const rules = roles.map((role) => ROLES[role].rows);
  if (rules.includes("all")) return { kind: "all" };

  const studyProgramIds: number[] = [];
  const menteesOf: string[] = [];
  const studentIds: string[] = [];
  if (rules.includes("own_program") && account.studyProgramId !== null) {
    studyProgramIds.push(account.studyProgramId);
  }
  if (rules.includes("own_mentees")) {
    menteesOf.push(account.id);
  }
  if (rules.includes("self") && account.studentId !== null) {
    studentIds.push(account.studentId);
  }
  return { kind: "some", studyProgramIds, menteesOf, studentIds };
}

/**
 * Which student rows an account may see through an action: the limits of
 * only those of its roles that allow the action. Another role of the
 * account adds no rows, however many it sees on its own screens.
 */
export function rowLimitForAction(
  account: AccountForAccess,
  action: Action,
): RowLimit {
  const allowing = account.roles.filter((role) =>
    ROLES[role].actions.includes(action),
  );
  return rowLimitOf(account, allowing);
}

/**
 * The same for a page that no action guards: the limits of only those
 * roles of the account that open the page.
 */
export function rowLimitForPage(
  account: AccountForAccess,
  page: PageId,
): RowLimit {
  const opening = account.roles.filter((role) =>
    ROLES[role].pages.includes(page),
  );
  return rowLimitOf(account, opening);
}
