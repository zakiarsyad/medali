import { firstParam, type SearchParams } from "@/ui/search-params";
import { searchText } from "@/ui/search-text";
import type { NoteCategory } from "./violation-note-ids";

/*
 * The address of Pembinaan > Catatan pelanggaran and what it asks the
 * list for. Read by the screen parts in the browser, so nothing here may
 * take from the database code.
 */

export const NOTES_ADDRESS = "/pembinaan/catatan";

export interface NotesParams {
  /** The text to find in a name or a NIM. Empty when nothing is searched. */
  query: string;
  category: NoteCategory | "all";
  /** "Tampilkan yang sudah tidak berlaku": the notes of past semesters too. */
  past: boolean;
  /** The page of the list, counted from 1. */
  page: number;
}

export const NOTES_START: NotesParams = {
  query: "",
  category: "all",
  past: false,
  page: 1,
};

/** How the address names each Kategori. */
export const CATEGORY_CHOICES: Record<NoteCategory, string> = {
  first: "pertama",
  further: "lanjutan",
};

/** How the address says the tick "Tampilkan yang sudah tidak berlaku" is on. */
export const PAST_CHOICE = "1";

const PAGE = /^[1-9]\d{0,5}$/;

function categoryNamed(sent: string): NotesParams["category"] {
  if (sent === CATEGORY_CHOICES.first) return "first";
  if (sent === CATEGORY_CHOICES.further) return "further";
  return "all";
}

/**
 * What the address asks the list for. Nothing in an address is trusted:
 * a part that is not understood counts as not chosen, and a text too
 * long to search for is left out.
 */
export function readNotesParams(params: SearchParams): NotesParams {
  const page = firstParam(params.hal);
  return {
    query: searchText(firstParam(params.cari)) ?? "",
    category: categoryNamed(firstParam(params.kategori)),
    past: firstParam(params.lama) === PAST_CHOICE,
    page: PAGE.test(page) ? Number(page) : 1,
  };
}

/**
 * The address of the tab with these choices. What is not chosen is left
 * out, and so is the first page.
 */
export function notesAddress(params: NotesParams): string {
  const search = new URLSearchParams();
  if (params.query !== "") search.set("cari", params.query);
  if (params.category !== "all") {
    search.set("kategori", CATEGORY_CHOICES[params.category]);
  }
  if (params.past) search.set("lama", PAST_CHOICE);
  if (params.page > 1) search.set("hal", String(params.page));
  const text = search.toString();
  if (text === "") return NOTES_ADDRESS;
  return `${NOTES_ADDRESS}?${text}`;
}
