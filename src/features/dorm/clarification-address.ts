import { firstParam, type SearchParams } from "@/ui/search-params";
import { searchText } from "@/ui/search-text";
import type { DormClarificationStatus } from "./clarification-ids";
import { STATUS_WORDS } from "./clarification-words";

/*
 * The address of Klarifikasi kehadiran of Asrama and what it asks for.
 * Read by the screen parts in the browser, so nothing here may take from
 * the database code.
 */

export const CLARIFICATIONS_ADDRESS = "/asrama/klar";

/** How many clarification cards one page shows. */
export const CLARIFICATIONS_PAGE_SIZE = 20;

/** The statuses the list can be narrowed to, and every status. */
export type ClarificationChoice = DormClarificationStatus | "all";

/** The choices in the order the list offers them. */
export const CHOICE_ORDER: ClarificationChoice[] = [
  "all",
  "submitted",
  "verified",
  "accepted",
  "rejected",
  "closed",
];

/** Each choice as the address names it. */
export const CHOICES: Record<ClarificationChoice, string> = {
  all: "semua",
  submitted: "diajukan",
  verified: "diverifikasi",
  accepted: "diterima",
  rejected: "ditolak",
  closed: "ditutup",
};

export const CHOICE_WORDS: Record<ClarificationChoice, string> = {
  all: "Semua status",
  ...STATUS_WORDS,
};

/** What the list says when no card matches a choice. */
const EMPTY_WORDS: Record<ClarificationChoice, string> = {
  all: "Belum ada klarifikasi.",
  submitted: "Tidak ada klarifikasi yang menunggu verifikasi BAM.",
  verified: "Tidak ada klarifikasi yang menunggu validasi pengelola.",
  accepted: "Tidak ada klarifikasi yang diterima.",
  rejected: "Tidak ada klarifikasi yang ditolak.",
  closed: "Tidak ada klarifikasi yang ditutup.",
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
  const named = CHOICE_ORDER.find((choice) => CHOICES[choice] === sent);
  return named ?? "submitted";
}

/**
 * What the address asks the cards for. Nothing in an address is
 * trusted: a part that is not understood counts as not chosen, a text
 * too long to search for is left out, and the status starts at Diajukan,
 * where BAM starts.
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
    params.set("status", CHOICES[filters.status]);
  }
  if (page > 1) params.set("hal", String(page));
  const search = params.toString();
  if (search === "") return CLARIFICATIONS_ADDRESS;
  return `${CLARIFICATIONS_ADDRESS}?${search}`;
}

/**
 * What the list says when nothing matches the filters: of the status
 * chosen, or of the search when a name or NIM is searched.
 */
export function emptyWords(filters: ClarificationFilters): string {
  if (filters.query !== "") return "Tidak ada klarifikasi pada filter ini.";
  return EMPTY_WORDS[filters.status];
}

/**
 * Where the file of a dorm clarification is asked from the server: to be
 * shown inside the page, or to be downloaded.
 */
export function clarificationFileAddress(
  clarificationId: string,
  isShown: boolean,
): string {
  const address = `${CLARIFICATIONS_ADDRESS}/lampiran/${clarificationId}`;
  return isShown ? `${address}?lihat=1` : address;
}
