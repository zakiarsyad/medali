import type { CoachingLevel } from "@/character-scores/coaching-need";
import type { CoachingStatus } from "@/character-scores/coaching-status";
import { isUuid } from "@/db/is-uuid";
import { firstParam, type SearchParams } from "@/ui/search-params";
import { searchText } from "@/ui/search-text";

/*
 * The address of Pembinaan > Pembinaan karakter and what it asks the
 * list for. Read by the screen parts in the browser, so nothing here may
 * take from the database code.
 */

export const COACHING_ADDRESS = "/pembinaan/karakter";

/** How many students a page of the list shows. */
export const COACHING_PAGE_SIZE = 25;

/** "Belum selesai": every status but Selesai; "Semua status"; or one status. */
export type CoachingStatusChoice = "open" | "all" | CoachingStatus;

export interface CoachingParams {
  /** The text to find in a name or a NIM. Empty when nothing is searched. */
  query: string;
  level: CoachingLevel | "all";
  status: CoachingStatusChoice;
  /** The page of the list, counted from 1. */
  page: number;
  /** The student whose profile is open over the tab, or null for none. */
  profileId: string | null;
}

export const COACHING_START: CoachingParams = {
  query: "",
  level: "all",
  status: "open",
  page: 1,
  profileId: null,
};

/** How the address names each level. */
export const LEVEL_CHOICES: Record<CoachingLevel, string> = {
  intensive: "intensif",
  moderate: "sedang",
  light: "ringan",
};

/** How the address names each status choice but "Belum selesai", which is left out. */
export const STATUS_CHOICES: Record<
  Exclude<CoachingStatusChoice, "open">,
  string
> = {
  all: "semua",
  identified: "teridentifikasi",
  counselling: "konseling",
  monitoring: "pemantauan",
  done: "selesai",
};

const PAGE = /^[1-9]\d{0,5}$/;

function choiceNamed<Choice extends string>(
  choices: Record<Choice, string>,
  sent: string,
): Choice | null {
  for (const [choice, name] of Object.entries(choices) as [Choice, string][]) {
    if (name === sent) return choice;
  }
  return null;
}

function idNamed(sent: string): string | null {
  return isUuid(sent) ? sent : null;
}

/**
 * What the address asks the list for. Nothing in an address is trusted:
 * a part that is not understood counts as not chosen, and a text too
 * long to search for is left out.
 */
export function readCoachingParams(params: SearchParams): CoachingParams {
  const page = firstParam(params.hal);
  return {
    query: searchText(firstParam(params.cari)) ?? "",
    level: choiceNamed(LEVEL_CHOICES, firstParam(params.tingkat)) ?? "all",
    status: choiceNamed(STATUS_CHOICES, firstParam(params.status)) ?? "open",
    page: PAGE.test(page) ? Number(page) : 1,
    profileId: idNamed(firstParam(params.profil)),
  };
}

/**
 * The address of the tab with these choices. What is not chosen is left
 * out, and so is the first page.
 */
export function coachingAddress(params: CoachingParams): string {
  const search = new URLSearchParams();
  if (params.query !== "") search.set("cari", params.query);
  if (params.level !== "all") {
    search.set("tingkat", LEVEL_CHOICES[params.level]);
  }
  if (params.status !== "open") {
    search.set("status", STATUS_CHOICES[params.status]);
  }
  if (params.page > 1) search.set("hal", String(params.page));
  if (params.profileId !== null) search.set("profil", params.profileId);
  const text = search.toString();
  if (text === "") return COACHING_ADDRESS;
  return `${COACHING_ADDRESS}?${text}`;
}
