import { isUuid } from "@/db/is-uuid";
import { firstParam, type SearchParams } from "@/ui/search-params";
import { searchText } from "@/ui/search-text";

/*
 * The address of Penilaian SIKU and what it asks for. Read by the screen
 * parts in the browser, so nothing here may take from the database code.
 */

export const SIKU_ADDRESS = "/penilaian/siku";

/** How many students one page of "Daftar nilai SIKU" shows. */
export const SIKU_LIST_PAGE_SIZE = 25;

/** How many falls and rises the ranking shows before "Tampilkan semua". */
export const RANKING_SIZE = 10;

/** What "Daftar nilai SIKU" can be narrowed to, and every student. */
export const SIKU_FILTERS = ["all", "gained", "lost", "base"] as const;

export type SikuFilter = (typeof SIKU_FILTERS)[number];

/** Each filter as the address names it. */
export const FILTER_CHOICES: Record<SikuFilter, string> = {
  all: "",
  gained: "penambahan",
  lost: "pengurangan",
  base: "dasar",
};

export const FILTER_WORDS: Record<SikuFilter, string> = {
  all: "Semua",
  gained: "Mendapat penambahan",
  lost: "Mendapat pengurangan",
  base: "Tetap di nilai dasar",
};

export interface SikuParams {
  /** The text to find in a name or a NIM. Empty when nothing is searched. */
  query: string;
  filter: SikuFilter;
  /** The page of "Daftar nilai SIKU", counted from 1. */
  page: number;
  /** Whether the ranking shows every fall, or only the largest ones. */
  allFalls: boolean;
  allRises: boolean;
  /** The page of "Riwayat penambahan dan pengurangan SIKU". */
  historyPage: number;
  /** The entry whose students "Lihat mahasiswa" shows, or null for none. */
  seenEntry: string | null;
  /** The page of those students. */
  seenPage: number;
}

export const START_PARAMS: SikuParams = {
  query: "",
  filter: "all",
  page: 1,
  allFalls: false,
  allRises: false,
  historyPage: 1,
  seenEntry: null,
  seenPage: 1,
};

/** How many entries one page of the history shows. */
export const HISTORY_PAGE_SIZE = 20;

/** How many students one page of "Lihat mahasiswa" shows. */
export const SEEN_PAGE_SIZE = 25;

const PAGE = /^[1-9]\d{0,5}$/;
const ALL = "semua";

function pageNamed(sent: string): number {
  return PAGE.test(sent) ? Number(sent) : 1;
}

/** The filter an address names, or every student for any other. */
export function filterNamed(sent: string): SikuFilter {
  const named = SIKU_FILTERS.find((each) => FILTER_CHOICES[each] === sent);
  return named ?? "all";
}

/**
 * What the address asks the tab for. Nothing in an address is trusted:
 * a part that is not understood counts as not chosen, and a text too
 * long to search for is left out.
 */
export function readSikuParams(params: SearchParams): SikuParams {
  return {
    query: searchText(firstParam(params.cari)) ?? "",
    filter: filterNamed(firstParam(params.saring)),
    page: pageNamed(firstParam(params.hal)),
    allFalls: firstParam(params.turun) === ALL,
    allRises: firstParam(params.naik) === ALL,
    historyPage: pageNamed(firstParam(params.riwayat)),
    seenEntry: entryNamed(firstParam(params.lihat)),
    seenPage: pageNamed(firstParam(params.lihathal)),
  };
}

function entryNamed(sent: string): string | null {
  return isUuid(sent) ? sent : null;
}

/**
 * The address of the tab with these choices. What is not chosen is left
 * out, and so is every first page.
 */
export function sikuAddress(params: SikuParams): string {
  const search = new URLSearchParams();
  if (params.query !== "") search.set("cari", params.query);
  if (params.filter !== "all")
    search.set("saring", FILTER_CHOICES[params.filter]);
  if (params.page > 1) search.set("hal", String(params.page));
  if (params.allFalls) search.set("turun", ALL);
  if (params.allRises) search.set("naik", ALL);
  if (params.historyPage > 1) {
    search.set("riwayat", String(params.historyPage));
  }
  if (params.seenEntry !== null) search.set("lihat", params.seenEntry);
  if (params.seenEntry !== null && params.seenPage > 1) {
    search.set("lihathal", String(params.seenPage));
  }
  const text = search.toString();
  if (text === "") return SIKU_ADDRESS;
  return `${SIKU_ADDRESS}?${text}`;
}
