import { firstParam, type SearchParams } from "@/ui/search-params";
import { searchText } from "@/ui/search-text";
import { COUNSELLING_ADDRESS } from "./schedule-address";

/*
 * The address of "Daftar mahasiswa" on Konseling and what it asks the
 * list for. Read by the screen parts in the browser, so nothing here may
 * take from the database code.
 */

/** How many students one page of "Daftar mahasiswa" shows. */
export const COUNSELLING_LIST_PAGE_SIZE = 20;

/** The choices of the filter, as the prototype has them. */
export const COUNSELLING_LIST_FILTERS = [
  "all",
  "waiting",
  "approved",
  "next_session",
] as const;

export type CounsellingListFilter = (typeof COUNSELLING_LIST_FILTERS)[number];

/** Each choice as the address names it; every student is left out. */
const FILTER_NAMES: Record<CounsellingListFilter, string> = {
  all: "",
  waiting: "menunggu-persetujuan",
  approved: "disetujui",
  next_session: "ada-sesi-berikutnya",
};

export const COUNSELLING_LIST_FILTER_WORDS: Record<
  CounsellingListFilter,
  string
> = {
  all: "Semua",
  waiting: "Menunggu persetujuan",
  approved: "Disetujui",
  next_session: "Ada sesi berikutnya",
};

export interface CounsellingListParams {
  query: string;
  filter: CounsellingListFilter;
  /** The page of "Daftar mahasiswa", counted from 1. */
  page: number;
}

const PAGE = /^[1-9]\d{0,5}$/;

export function listFilterName(filter: CounsellingListFilter): string {
  return FILTER_NAMES[filter];
}

function filterNamed(sent: string): CounsellingListFilter {
  const named = COUNSELLING_LIST_FILTERS.find(
    (each) => FILTER_NAMES[each] === sent,
  );
  return named ?? "all";
}

/**
 * What the address asks the list for. Nothing in an address is trusted:
 * a part that is not understood counts as not chosen, and a text too
 * long to search for is left out. Its page has a name of its own, as
 * "Jadwal konseling" on the same page has another.
 */
export function readCounsellingListParams(
  params: SearchParams,
): CounsellingListParams {
  const page = firstParam(params["hal-mahasiswa"]);
  return {
    query: searchText(firstParam(params.cari)) ?? "",
    filter: filterNamed(firstParam(params.filter)),
    page: PAGE.test(page) ? Number(page) : 1,
  };
}

/** The address of the list with these choices; what is not chosen is left out. */
export function counsellingListAddress(params: CounsellingListParams): string {
  const search = new URLSearchParams();
  if (params.query !== "") search.set("cari", params.query);
  if (params.filter !== "all") {
    search.set("filter", listFilterName(params.filter));
  }
  if (params.page > 1) search.set("hal-mahasiswa", String(params.page));
  const text = search.toString();
  if (text === "") return COUNSELLING_ADDRESS;
  return `${COUNSELLING_ADDRESS}?${text}`;
}
