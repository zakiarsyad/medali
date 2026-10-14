import { firstParam, type SearchParams } from "@/ui/search-params";
import { searchText } from "@/ui/search-text";
import { CLARIFICATION_STATUS_WORDS } from "./clarification-card";
import type { ClarificationStatus } from "./clarification-reasons";

/*
 * Read by the filters in the browser, so nothing here may take from the
 * database code.
 */

export const CLARIFICATIONS_ADDRESS = "/kegiatan/klarifikasi";

/** How many clarification cards one page shows. */
export const CLARIFICATIONS_PAGE_SIZE = 20;

/** The statuses the list can be narrowed to, and every status. */
export type ClarificationChoice = ClarificationStatus | "all";

/** The choices in the order the list offers them. */
export const CLARIFICATION_CHOICE_ORDER: ClarificationChoice[] = [
  "all",
  "submitted",
  "accepted",
  "rejected",
];

/** Each choice as the address names it. */
export const CLARIFICATION_CHOICES: Record<ClarificationChoice, string> = {
  all: "semua",
  submitted: "diajukan",
  accepted: "diterima",
  rejected: "ditolak",
};

export const CLARIFICATION_CHOICE_WORDS: Record<ClarificationChoice, string> = {
  all: "Semua status",
  ...CLARIFICATION_STATUS_WORDS,
};

export interface ClarificationFilters {
  /** The text to find in a name or a NIM. Empty when nothing is searched. */
  query: string;
  status: ClarificationChoice;
}

export interface ClarificationListParams {
  filters: ClarificationFilters;
  /** The page of the cards, counted from 1. */
  page: number;
}

const PAGE = /^[1-9]\d{0,5}$/;

/** The choice a name of the address stands for, or Diajukan for any other. */
export function choiceNamed(sent: string): ClarificationChoice {
  const named = CLARIFICATION_CHOICE_ORDER.find(
    (choice) => CLARIFICATION_CHOICES[choice] === sent,
  );
  return named ?? "submitted";
}

/**
 * What the address asks the cards for. Nothing in an address is trusted:
 * a part that is not understood counts as not chosen, a text too long to
 * search for is left out, and the status starts at Diajukan.
 */
export function readClarificationListParams(
  params: SearchParams,
): ClarificationListParams {
  const page = firstParam(params.hal);
  return {
    filters: {
      query: searchText(firstParam(params.cari)) ?? "",
      status: choiceNamed(firstParam(params.status)),
    },
    page: PAGE.test(page) ? Number(page) : 1,
  };
}

/**
 * The address of a page of the cards with these filters. What is not
 * chosen is left out, and so are Diajukan and the first page.
 */
export function clarificationListAddress(
  filters: ClarificationFilters,
  page = 1,
): string {
  const params = new URLSearchParams();
  if (filters.query !== "") params.set("cari", filters.query);
  if (filters.status !== "submitted") {
    params.set("status", CLARIFICATION_CHOICES[filters.status]);
  }
  if (page > 1) params.set("hal", String(page));
  const search = params.toString();
  if (search === "") return CLARIFICATIONS_ADDRESS;
  return `${CLARIFICATIONS_ADDRESS}?${search}`;
}
