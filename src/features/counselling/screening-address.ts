import { firstParam, type SearchParams } from "@/ui/search-params";
import { searchText } from "@/ui/search-text";

/*
 * The address of Penilaian > Kesehatan mental and what it asks "Daftar
 * mahasiswa" for. Read by the screen parts in the browser, so nothing
 * here may take from the database code.
 */

export const SCREENING_ADDRESS = "/penilaian/mental";

/** The choices of the filter: every student, "Perlu konseling" or "Menunggu persetujuan". */
export const SCREENING_FILTERS = ["all", "counselling", "waiting"] as const;

export type ScreeningFilter = (typeof SCREENING_FILTERS)[number];

/** Each choice as the address names it; every student is left out. */
const FILTER_NAMES: Record<ScreeningFilter, string> = {
  all: "",
  counselling: "perlu-konseling",
  waiting: "menunggu-persetujuan",
};

export const SCREENING_FILTER_WORDS: Record<ScreeningFilter, string> = {
  all: "Semua",
  counselling: "Perlu konseling",
  waiting: "Menunggu persetujuan",
};

export interface ScreeningParams {
  query: string;
  filter: ScreeningFilter;
  /** The page of the list, counted from 1. */
  page: number;
}

const PAGE = /^[1-9]\d{0,5}$/;

export function filterName(filter: ScreeningFilter): string {
  return FILTER_NAMES[filter];
}

function filterNamed(sent: string): ScreeningFilter {
  const named = SCREENING_FILTERS.find((each) => FILTER_NAMES[each] === sent);
  return named ?? "all";
}

/**
 * What the address asks the list for. Nothing in an address is trusted:
 * a part that is not understood counts as not chosen, and a text too
 * long to search for is left out.
 */
export function readScreeningParams(params: SearchParams): ScreeningParams {
  const page = firstParam(params.hal);
  return {
    query: searchText(firstParam(params.cari)) ?? "",
    filter: filterNamed(firstParam(params.filter)),
    page: PAGE.test(page) ? Number(page) : 1,
  };
}

/** The address of the tab with these choices; what is not chosen is left out. */
export function screeningAddress(params: ScreeningParams): string {
  const search = new URLSearchParams();
  if (params.query !== "") search.set("cari", params.query);
  if (params.filter !== "all") search.set("filter", filterName(params.filter));
  if (params.page > 1) search.set("hal", String(params.page));
  const text = search.toString();
  if (text === "") return SCREENING_ADDRESS;
  return `${SCREENING_ADDRESS}?${text}`;
}
