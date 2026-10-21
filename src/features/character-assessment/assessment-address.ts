import { isUuid } from "@/db/is-uuid";
import { firstParam, type SearchParams } from "@/ui/search-params";
import { searchText } from "@/ui/search-text";

/*
 * The address of Asesmen karakter and what it asks for. Read by the
 * screen parts in the browser, so nothing here may take from the
 * database code.
 */

export const ASSESSMENT_ADDRESS = "/penilaian/asesmen";

/** How many students one page of "Hasil asesmen karakter" shows. */
export const ASSESSMENT_LIST_PAGE_SIZE = 25;

/** What the list can be narrowed to, and every student. */
export const ASSESSMENT_FILTERS = ["all", "none"] as const;

export type AssessmentFilter = (typeof ASSESSMENT_FILTERS)[number];

/** Each filter as the address names it. */
export const FILTER_CHOICES: Record<AssessmentFilter, string> = {
  all: "",
  none: "belum",
};

export const FILTER_WORDS: Record<AssessmentFilter, string> = {
  all: "Semua mahasiswa",
  none: "Belum diasesmen",
};

export interface AssessmentParams {
  /** The text to find in a name or a NIM. Empty when nothing is searched. */
  query: string;
  filter: AssessmentFilter;
  /** The page of the list, counted from 1. */
  page: number;
  /** The student whose earlier assessments are open over the tab, or null. */
  historyId: string | null;
  /**
   * Whether "Teridentifikasi perlu pembinaan" shows every student, a page
   * at a time, or only the first few.
   */
  coachingAll: boolean;
  /** The page of that full list, counted from 1. */
  coachingPage: number;
  /**
   * The student the form opens with, picked, or null. Not checked here:
   * the server picks only a student the account may assess.
   */
  pickId: string | null;
}

export const START_PARAMS: AssessmentParams = {
  query: "",
  filter: "all",
  page: 1,
  historyId: null,
  coachingAll: false,
  coachingPage: 1,
  pickId: null,
};

/** How many students "Teridentifikasi perlu pembinaan" shows before "Tampilkan semua". */
export const COACHING_FIRST_ROWS = 10;

/** How many students one page of the full list shows. */
export const COACHING_PAGE_SIZE = 25;

const PAGE = /^[1-9]\d{0,5}$/;
const ALL = "semua";

function pageNamed(sent: string): number {
  return PAGE.test(sent) ? Number(sent) : 1;
}

/** The filter an address names, or every student for any other. */
export function filterNamed(sent: string): AssessmentFilter {
  const named = ASSESSMENT_FILTERS.find(
    (each) => FILTER_CHOICES[each] === sent,
  );
  return named ?? "all";
}

function idNamed(sent: string): string | null {
  return isUuid(sent) ? sent : null;
}

/**
 * What the address asks the tab for. Nothing in an address is trusted:
 * a part that is not understood counts as not chosen, and a text too
 * long to search for is left out.
 */
export function readAssessmentParams(params: SearchParams): AssessmentParams {
  return {
    query: searchText(firstParam(params.cari)) ?? "",
    filter: filterNamed(firstParam(params.saring)),
    page: pageNamed(firstParam(params.hal)),
    historyId: idNamed(firstParam(params.riwayat)),
    coachingAll: firstParam(params.pembinaan) === ALL,
    coachingPage: pageNamed(firstParam(params.pembinaanhal)),
    pickId: idNamed(firstParam(params.mahasiswa)),
  };
}

/**
 * The address of the tab with these choices. What is not chosen is left
 * out, and so is the first page.
 */
export function assessmentAddress(params: AssessmentParams): string {
  const search = new URLSearchParams();
  if (params.query !== "") search.set("cari", params.query);
  if (params.filter !== "all") {
    search.set("saring", FILTER_CHOICES[params.filter]);
  }
  if (params.page > 1) search.set("hal", String(params.page));
  if (params.historyId !== null) search.set("riwayat", params.historyId);
  if (params.coachingAll) search.set("pembinaan", ALL);
  if (params.coachingAll && params.coachingPage > 1) {
    search.set("pembinaanhal", String(params.coachingPage));
  }
  if (params.pickId !== null) search.set("mahasiswa", params.pickId);
  const text = search.toString();
  if (text === "") return ASSESSMENT_ADDRESS;
  return `${ASSESSMENT_ADDRESS}?${text}`;
}

/** The tab with a student picked in the form, as "Input asesmen" opens it. */
export function pickAddress(studentId: string): string {
  return assessmentAddress({ ...START_PARAMS, pickId: studentId });
}
