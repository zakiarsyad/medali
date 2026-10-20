import { DORM_IDS, type DormId } from "@/dorms/dorms";
import {
  CATEGORY_CHOICES,
  FILTER_ILLNESSES,
  ILLNESS_CHOICES,
} from "@/health-notes/filter-choices";
import { FITNESS_CATEGORIES } from "@/health-notes/fitness-ids";
import type { SickFilters } from "@/health-notes/sick-list";
import { firstParam, type SearchParams } from "@/ui/search-params";
import { searchText } from "@/ui/search-text";

/*
 * The address of Asrama > Kesehatan and what it asks the list "Mahasiswa
 * asrama yang sakit" for. Read by the screen parts in the browser, so
 * nothing here may take from the database code.
 */

export const DORM_HEALTH_ADDRESS = "/asrama/sehat";

export interface DormHealthParams extends SickFilters {
  dorm: DormId | "all";
}

export const DORM_HEALTH_START: DormHealthParams = {
  query: "",
  dorm: "all",
  category: "all",
  illness: "all",
  page: 1,
};

const PAGE = /^[1-9]\d{0,5}$/;

function dormNamed(sent: string): DormId | "all" {
  return DORM_IDS.find((dorm) => dorm === sent) ?? "all";
}

function categoryNamed(sent: string): DormHealthParams["category"] {
  const named = FITNESS_CATEGORIES.find(
    (each) => CATEGORY_CHOICES[each] === sent,
  );
  return named ?? "all";
}

function illnessNamed(sent: string): DormHealthParams["illness"] {
  const named = FILTER_ILLNESSES.find((each) => ILLNESS_CHOICES[each] === sent);
  return named ?? "all";
}

/**
 * What the address asks the list for. Nothing in an address is trusted:
 * a part that is not understood counts as not chosen, and a text too
 * long to search for is left out.
 */
export function readDormHealthParams(params: SearchParams): DormHealthParams {
  const page = firstParam(params.hal);
  return {
    query: searchText(firstParam(params.cari)) ?? "",
    dorm: dormNamed(firstParam(params.asrama)),
    category: categoryNamed(firstParam(params.kategori)),
    illness: illnessNamed(firstParam(params.riwayat)),
    page: PAGE.test(page) ? Number(page) : 1,
  };
}

/**
 * The address of the tab with these choices. What is not chosen is left
 * out, and so is the first page.
 */
export function dormHealthAddress(params: DormHealthParams): string {
  const search = new URLSearchParams();
  if (params.query !== "") search.set("cari", params.query);
  if (params.dorm !== "all") search.set("asrama", params.dorm);
  if (params.category !== "all") {
    search.set("kategori", CATEGORY_CHOICES[params.category]);
  }
  if (params.illness !== "all") {
    search.set("riwayat", ILLNESS_CHOICES[params.illness]);
  }
  if (params.page > 1) search.set("hal", String(params.page));
  const text = search.toString();
  if (text === "") return DORM_HEALTH_ADDRESS;
  return `${DORM_HEALTH_ADDRESS}?${text}`;
}
