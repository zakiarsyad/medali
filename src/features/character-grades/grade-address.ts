import { GRADE_CHOICE_WORDS } from "@/character-grades/grade-choice";
import { isUuid } from "@/db/is-uuid";
import { firstParam, idParam, type SearchParams } from "@/ui/search-params";
import { searchText } from "@/ui/search-text";

/*
 * The address of Penilaian karakter and what it asks for. Read by the
 * screen parts in the browser, so nothing here may take from the
 * database code.
 */

export const GRADE_ADDRESS = "/penilaian/karakter";

/** How many students one page of "Daftar nilai karakter" shows. */
export const GRADE_LIST_PAGE_SIZE = 25;

/** What the list can be narrowed to, and every student. */
export const GRADE_FILTERS = ["all", "failing", "incomplete"] as const;

export type GradeFilter = (typeof GRADE_FILTERS)[number];

/** Each filter as the address names it. */
export const FILTER_CHOICES: Record<GradeFilter, string> = {
  all: "",
  failing: "belum-lulus",
  incomplete: "belum-lengkap",
};

export const FILTER_WORDS: Record<GradeFilter, string> = {
  all: "Semua",
  failing: GRADE_CHOICE_WORDS.failing,
  incomplete: "Belum lengkap",
};

export interface GradeParams {
  /**
   * The period of a closed semester whose fixed grades are shown, or null
   * for the running semester, "Berjalan".
   */
  semester: string | null;
  /** The text to find in a name or a NIM. Empty when nothing is searched. */
  query: string;
  filter: GradeFilter;
  /** The page of the list, counted from 1. */
  page: number;
  /** The student whose profile is open over the tab, or null for none. */
  profileId: string | null;
}

export const START_PARAMS: GradeParams = {
  semester: null,
  query: "",
  filter: "all",
  page: 1,
  profileId: null,
};

const PAGE = /^[1-9]\d{0,5}$/;

function pageNamed(sent: string): number {
  return PAGE.test(sent) ? Number(sent) : 1;
}

function idNamed(sent: string): string | null {
  return isUuid(sent) ? sent : null;
}

/** The filter an address names, or every student for any other. */
export function filterNamed(sent: string): GradeFilter {
  const named = GRADE_FILTERS.find((each) => FILTER_CHOICES[each] === sent);
  return named ?? "all";
}

/**
 * What the address asks the tab for. Nothing in an address is trusted:
 * a part that is not understood counts as not chosen, and a text too
 * long to search for is left out.
 */
export function readGradeParams(params: SearchParams): GradeParams {
  return {
    semester: idNamed(firstParam(params.semester)),
    query: searchText(firstParam(params.cari)) ?? "",
    filter: filterNamed(firstParam(params.saring)),
    page: pageNamed(firstParam(params.hal)),
    profileId: idParam(params.profil),
  };
}

/**
 * The address of the tab with these choices. What is not chosen is left
 * out, and so is the first page.
 */
export function gradeAddress(params: GradeParams): string {
  const search = new URLSearchParams();
  if (params.semester !== null) search.set("semester", params.semester);
  if (params.query !== "") search.set("cari", params.query);
  if (params.filter !== "all") {
    search.set("saring", FILTER_CHOICES[params.filter]);
  }
  if (params.page > 1) search.set("hal", String(params.page));
  if (params.profileId !== null) search.set("profil", params.profileId);
  const text = search.toString();
  if (text === "") return GRADE_ADDRESS;
  return `${GRADE_ADDRESS}?${text}`;
}
