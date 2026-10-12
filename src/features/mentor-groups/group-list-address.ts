import { firstParam, type SearchParams } from "@/ui/search-params";

export const GROUP_LIST_ADDRESS = "/pengasuh/kelompok";

/** The filters above the list. Null means every choice. */
export interface GroupListFilters {
  /** Searched for in the group code and in the name of the mentor. */
  query: string;
  studyProgramId: number | null;
  cohortYear: number | null;
}

export interface GroupListParams {
  filters: GroupListFilters;
  /** The page of the list, counted from 1. */
  page: number;
  /**
   * What the address gives as the id of the group whose page is open
   * instead of the list, or null when it names none. It is not checked
   * here: the read of the group answers "not found" for what is no id.
   */
  groupId: string | null;
  /** The same for the student whose detail is open over the group's page. */
  detailId: string | null;
}

export const NO_FILTERS: GroupListFilters = {
  query: "",
  studyProgramId: null,
  cohortYear: null,
};

const SEARCH_MAX_LENGTH = 100;
const YEAR = /^\d{4}$/;
const PAGE = /^[1-9]\d{0,5}$/;
/** Short enough to fit the number the database keeps for a program studi. */
const PROGRAM_ID = /^[1-9]\d{0,8}$/;
/** As long as the id of a record is. */
const ID_LENGTH = 36;

function readId(value: SearchParams[string]): string | null {
  const id = firstParam(value).trim().slice(0, ID_LENGTH);
  return id === "" ? null : id;
}

/**
 * What the address asks the list for. Nothing in an address is trusted: a
 * part that is not understood counts as not chosen.
 */
export function readGroupListParams(params: SearchParams): GroupListParams {
  const program = firstParam(params.prodi);
  const year = firstParam(params.angkatan);
  const page = firstParam(params.hal);
  return {
    page: PAGE.test(page) ? Number(page) : 1,
    groupId: readId(params.kelompok),
    detailId: readId(params.profil),
    filters: {
      query: firstParam(params.q).trim().slice(0, SEARCH_MAX_LENGTH),
      studyProgramId: PROGRAM_ID.test(program) ? Number(program) : null,
      cohortYear: YEAR.test(year) ? Number(year) : null,
    },
  };
}

/**
 * The address of a page of the list with these filters. What is not chosen
 * is left out, and so is the first page.
 */
export function groupListAddress(filters: GroupListFilters, page = 1): string {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.studyProgramId !== null) {
    params.set("prodi", String(filters.studyProgramId));
  }
  if (filters.cohortYear !== null) {
    params.set("angkatan", String(filters.cohortYear));
  }
  if (page > 1) params.set("hal", String(page));
  const search = params.toString();
  return search === "" ? GROUP_LIST_ADDRESS : `${GROUP_LIST_ADDRESS}?${search}`;
}

/** The address of the page of one group. */
export function groupAddress(groupId: string): string {
  const params = new URLSearchParams({ kelompok: groupId });
  return `${GROUP_LIST_ADDRESS}?${params}`;
}

/** The address of a member's detail, open over the page of their group. */
export function groupMemberAddress(groupId: string, studentId: string): string {
  const params = new URLSearchParams({ kelompok: groupId, profil: studentId });
  return `${GROUP_LIST_ADDRESS}?${params}`;
}
