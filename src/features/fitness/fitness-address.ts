import { isUuid } from "@/db/is-uuid";
import { CATEGORY_CHOICES } from "@/health-notes/filter-choices";
import type { ShownCategory } from "@/health-notes/fitness-category";
import { firstParam, type SearchParams } from "@/ui/search-params";
import { searchText } from "@/ui/search-text";

/*
 * The address of Penilaian jasmani and what it asks for. Read by the
 * screen parts in the browser, so nothing here may take from the
 * database code.
 */

export const FITNESS_ADDRESS = "/penilaian/jasmani";

/** How many students one page of "Hasil tes kebugaran" shows. */
export const FITNESS_LIST_PAGE_SIZE = 25;

/** What the list can be narrowed to: a category, Belum dites, or every student. */
export type FitnessFilter = ShownCategory | "all";

/** The filters in the order the choice offers them. */
export const FITNESS_FILTERS = [
  "all",
  "excellent",
  "good",
  "attention",
  "medical",
  "untested",
] as const satisfies readonly FitnessFilter[];

/** Each filter as the address names it. */
export const FILTER_CHOICES: Record<FitnessFilter, string> = {
  all: "",
  ...CATEGORY_CHOICES,
  untested: "belum",
};

export interface FitnessParams {
  /** The text to find in a name or a NIM. Empty when nothing is searched. */
  query: string;
  filter: FitnessFilter;
  /** The page of the list, counted from 1. */
  page: number;
  /** The student whose profile is open over the tab, or null for none. */
  profileId: string | null;
}

export const START_PARAMS: FitnessParams = {
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
export function filterNamed(sent: string): FitnessFilter {
  const named = FITNESS_FILTERS.find((each) => FILTER_CHOICES[each] === sent);
  return named ?? "all";
}

/**
 * What the address asks the tab for. Nothing in an address is trusted:
 * a part that is not understood counts as not chosen, and a text too
 * long to search for is left out.
 */
export function readFitnessParams(params: SearchParams): FitnessParams {
  return {
    query: searchText(firstParam(params.cari)) ?? "",
    filter: filterNamed(firstParam(params.saring)),
    page: pageNamed(firstParam(params.hal)),
    profileId: idNamed(firstParam(params.profil)),
  };
}

/**
 * The address of the tab with these choices. What is not chosen is left
 * out, and so is the first page.
 */
export function fitnessAddress(params: FitnessParams): string {
  const search = new URLSearchParams();
  if (params.query !== "") search.set("cari", params.query);
  if (params.filter !== "all") {
    search.set("saring", FILTER_CHOICES[params.filter]);
  }
  if (params.page > 1) search.set("hal", String(params.page));
  if (params.profileId !== null) search.set("profil", params.profileId);
  const text = search.toString();
  if (text === "") return FITNESS_ADDRESS;
  return `${FITNESS_ADDRESS}?${text}`;
}
