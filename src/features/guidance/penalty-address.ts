import { firstParam, type SearchParams } from "@/ui/search-params";
import { searchText } from "@/ui/search-text";
import type { PenaltyCategory, PenaltyStatus } from "./penalty-ids";

/*
 * The address of Pembinaan > Pelanggaran disiplin and what it asks the
 * list for. Read by the screen parts in the browser, so nothing here may
 * take from the database code.
 */

export const PENALTIES_ADDRESS = "/pembinaan/disiplin";

export interface PenaltiesParams {
  /** The text to find in a name or a NIM. Empty when nothing is searched. */
  query: string;
  category: PenaltyCategory | "all";
  status: PenaltyStatus | "all";
  /** The page of the list, counted from 1. */
  page: number;
}

export const PENALTIES_START: PenaltiesParams = {
  query: "",
  category: "all",
  status: "all",
  page: 1,
};

/** How the address names each Kategori. */
export const CATEGORY_CHOICES: Record<PenaltyCategory, string> = {
  light: "ringan",
  medium: "sedang",
  heavy: "berat",
};

/** How the address names each status. */
export const STATUS_CHOICES: Record<PenaltyStatus, string> = {
  imposed: "dijatuhkan",
  set: "ditetapkan",
};

const PAGE = /^[1-9]\d{0,5}$/;

function choiceNamed<Choice extends string>(
  choices: Record<Choice, string>,
  sent: string,
): Choice | "all" {
  for (const [choice, name] of Object.entries(choices) as [Choice, string][]) {
    if (name === sent) return choice;
  }
  return "all";
}

/**
 * What the address asks the list for. Nothing in an address is trusted:
 * a part that is not understood counts as not chosen, and a text too
 * long to search for is left out.
 */
export function readPenaltiesParams(params: SearchParams): PenaltiesParams {
  const page = firstParam(params.hal);
  return {
    query: searchText(firstParam(params.cari)) ?? "",
    category: choiceNamed(CATEGORY_CHOICES, firstParam(params.kategori)),
    status: choiceNamed(STATUS_CHOICES, firstParam(params.status)),
    page: PAGE.test(page) ? Number(page) : 1,
  };
}

/**
 * The address of the tab with these choices. What is not chosen is left
 * out, and so is the first page.
 */
export function penaltiesAddress(params: PenaltiesParams): string {
  const search = new URLSearchParams();
  if (params.query !== "") search.set("cari", params.query);
  if (params.category !== "all") {
    search.set("kategori", CATEGORY_CHOICES[params.category]);
  }
  if (params.status !== "all") {
    search.set("status", STATUS_CHOICES[params.status]);
  }
  if (params.page > 1) search.set("hal", String(params.page));
  const text = search.toString();
  if (text === "") return PENALTIES_ADDRESS;
  return `${PENALTIES_ADDRESS}?${text}`;
}

/**
 * The address of the tab with the form opened on a student, as
 * "Hukuman ringan" on Catatan pelanggaran and "Catat hukuman disiplin"
 * on Pelanggaran asrama send it.
 */
export function penaltyFormAddress(studentId: string): string {
  return `${PENALTIES_ADDRESS}?mahasiswa=${encodeURIComponent(studentId)}`;
}

/** The student the address asks the form to open on; empty for none. */
export function pickedStudentOf(params: SearchParams): string {
  return firstParam(params.mahasiswa);
}
