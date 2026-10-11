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

/** Which student rows an account may see: the limits of its roles together. */
export function rowLimitFor(account: AccountForAccess): RowLimit {
  const rules = account.roles.map((role) => ROLES[role].rows);
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
