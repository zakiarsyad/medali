import { isUuid } from "@/db/is-uuid";
import { firstParam, type SearchParams } from "@/ui/search-params";
import { searchText } from "@/ui/search-text";

/*
 * The address of Data SKPM and what it asks for. Read by the screen
 * parts in the browser, so nothing here may take from the database code.
 */

export const SKPM_ADDRESS = "/penilaian/skpm";

/** How many students one page of "Nilai SKPM per mahasiswa" shows. */
export const SKPM_LIST_PAGE_SIZE = 25;

/** What the list can be narrowed to, and every student. */
export const SKPM_FILTERS = ["all", "with", "without"] as const;

export type SkpmFilter = (typeof SKPM_FILTERS)[number];

/** Each filter as the address names it. */
export const FILTER_CHOICES: Record<SkpmFilter, string> = {
  all: "",
  with: "ada",
  without: "kosong",
};

export const FILTER_WORDS: Record<SkpmFilter, string> = {
  all: "Semua",
  with: "Ada data SKPM",
  without: "Belum ada data",
};

export interface SkpmParams {
  /** The text to find in a name or a NIM. Empty when nothing is searched. */
  query: string;
  filter: SkpmFilter;
  /** The page of the list, counted from 1. */
  page: number;
  /** The student whose "Rincian" is open over the tab, or null for none. */
  detailId: string | null;
}

export const START_PARAMS: SkpmParams = {
  query: "",
  filter: "all",
  page: 1,
  detailId: null,
};

const PAGE = /^[1-9]\d{0,5}$/;

function pageNamed(sent: string): number {
  return PAGE.test(sent) ? Number(sent) : 1;
}

/** The filter an address names, or every student for any other. */
export function filterNamed(sent: string): SkpmFilter {
  const named = SKPM_FILTERS.find((each) => FILTER_CHOICES[each] === sent);
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
export function readSkpmParams(params: SearchParams): SkpmParams {
  return {
    query: searchText(firstParam(params.cari)) ?? "",
    filter: filterNamed(firstParam(params.saring)),
    page: pageNamed(firstParam(params.hal)),
    detailId: idNamed(firstParam(params.rincian)),
  };
}

/**
 * The address of the tab with these choices. What is not chosen is left
 * out, and so is the first page.
 */
export function skpmAddress(params: SkpmParams): string {
  const search = new URLSearchParams();
  if (params.query !== "") search.set("cari", params.query);
  if (params.filter !== "all") {
    search.set("saring", FILTER_CHOICES[params.filter]);
  }
  if (params.page > 1) search.set("hal", String(params.page));
  if (params.detailId !== null) search.set("rincian", params.detailId);
  const text = search.toString();
  if (text === "") return SKPM_ADDRESS;
  return `${SKPM_ADDRESS}?${text}`;
}
