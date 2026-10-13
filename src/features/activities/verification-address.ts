import { isUuid } from "@/db/is-uuid";
import { firstParam, type SearchParams } from "@/ui/search-params";

export const VERIFICATION_ADDRESS = "/kegiatan/verifikasi";

/** How many photo cards one page shows. */
export const CARDS_PAGE_SIZE = 24;

/** The statuses the list can be narrowed to, and every status. */
export type StatusChoice = "waiting" | "valid" | "rejected" | "all";

/** The choices in the order the list offers them. */
export const STATUS_ORDER: StatusChoice[] = [
  "waiting",
  "valid",
  "rejected",
  "all",
];

/** Each choice as the address names it. */
export const STATUS_CHOICES: Record<StatusChoice, string> = {
  waiting: "menunggu",
  valid: "divalidasi",
  rejected: "ditolak",
  all: "semua",
};

export const STATUS_CHOICE_WORDS: Record<StatusChoice, string> = {
  waiting: "Menunggu verifikasi",
  valid: "Divalidasi",
  rejected: "Ditolak",
  all: "Semua",
};

export interface VerificationFilters {
  /** The schedule chosen, or null for every activity. */
  scheduleId: string | null;
  status: StatusChoice;
}

export interface VerificationParams {
  filters: VerificationFilters;
  /** The page of the cards, counted from 1. */
  page: number;
}

const PAGE = /^[1-9]\d{0,5}$/;

function readStatus(sent: string): StatusChoice {
  const named = STATUS_ORDER.find((status) => STATUS_CHOICES[status] === sent);
  return named ?? "waiting";
}

/**
 * What the address asks the cards for. Nothing in an address is trusted:
 * a part that is not understood counts as not chosen, and the status
 * starts at Menunggu verifikasi.
 */
export function readVerificationParams(
  params: SearchParams,
): VerificationParams {
  const scheduleId = firstParam(params.kegiatan);
  const page = firstParam(params.hal);
  return {
    filters: {
      scheduleId: isUuid(scheduleId) ? scheduleId : null,
      status: readStatus(firstParam(params.status)),
    },
    page: PAGE.test(page) ? Number(page) : 1,
  };
}

/**
 * The address of a page of the cards with these filters. What is not
 * chosen is left out, and so are Menunggu verifikasi and the first page.
 */
export function verificationAddress(
  filters: VerificationFilters,
  page = 1,
): string {
  const params = new URLSearchParams();
  if (filters.scheduleId !== null) params.set("kegiatan", filters.scheduleId);
  if (filters.status !== "waiting") {
    params.set("status", STATUS_CHOICES[filters.status]);
  }
  if (page > 1) params.set("hal", String(page));
  const search = params.toString();
  if (search === "") return VERIFICATION_ADDRESS;
  return `${VERIFICATION_ADDRESS}?${search}`;
}
