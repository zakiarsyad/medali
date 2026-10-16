import { firstParam, type SearchParams } from "@/ui/search-params";
import { searchText } from "@/ui/search-text";
import {
  FILTER_CHOICES,
  FITNESS_ADDRESS,
  type FitnessParams,
  fitnessAddress,
} from "./fitness-address";
import { FITNESS_CATEGORIES, type FitnessCategory } from "./fitness-ids";
import { ILLNESSES, type Illness, type Residence } from "./health-ids";

/*
 * What the address asks "Rekap data kesehatan seluruh mahasiswa" for.
 * Its names start with r, so they stand beside those of "Hasil tes
 * kebugaran" on the one address of the tab. Read by the screen parts in
 * the browser, so nothing here may take from the database code.
 */

/** How many students one page of the recap shows. */
export const RECAP_PAGE_SIZE = 25;

/** The illnesses the filter "Riwayat penyakit" offers: every one but Lainnya. */
export const RECAP_ILLNESSES = ILLNESSES.filter(
  (illness) => illness !== "other",
);

export interface RecapParams {
  query: string;
  residence: Residence;
  category: FitnessCategory | "all";
  illness: Illness | "all";
  page: number;
}

export const RECAP_START: RecapParams = {
  query: "",
  residence: "all",
  category: "all",
  illness: "all",
  page: 1,
};

/** Each choice of "Tempat tinggal" as the address names it. */
export const RESIDENCE_CHOICES: Record<Residence, string> = {
  all: "",
  dorm: "asrama",
  non_dorm: "non",
};

/** Each illness of the filter as the address names it. */
export const ILLNESS_CHOICES: Record<Illness, string> = {
  asthma: "asma",
  hypertension: "hipertensi",
  diabetes: "diabetes",
  heart_disease: "jantung",
  gastric_disorder: "lambung",
  allergy: "alergi",
  epilepsy: "epilepsi",
  bone_joint_injury: "cedera",
  infectious_disease: "menular",
  other: "lainnya",
};

const PAGE = /^[1-9]\d{0,5}$/;

function residenceNamed(sent: string): Residence {
  const named = (["dorm", "non_dorm"] as const).find(
    (each) => RESIDENCE_CHOICES[each] === sent,
  );
  return named ?? "all";
}

function categoryNamed(sent: string): FitnessCategory | "all" {
  const named = FITNESS_CATEGORIES.find(
    (each) => FILTER_CHOICES[each] === sent,
  );
  return named ?? "all";
}

function illnessNamed(sent: string): Illness | "all" {
  const named = RECAP_ILLNESSES.find((each) => ILLNESS_CHOICES[each] === sent);
  return named ?? "all";
}

/**
 * What the address asks the recap for. Nothing in an address is trusted:
 * a part that is not understood counts as not chosen.
 */
export function readRecapParams(params: SearchParams): RecapParams {
  const page = firstParam(params.rhal);
  return {
    query: searchText(firstParam(params.rcari)) ?? "",
    residence: residenceNamed(firstParam(params.rtinggal)),
    category: categoryNamed(firstParam(params.rkategori)),
    illness: illnessNamed(firstParam(params.rriwayat)),
    page: PAGE.test(page) ? Number(page) : 1,
  };
}

function recapSearch(recap: RecapParams): URLSearchParams {
  const search = new URLSearchParams();
  if (recap.query !== "") search.set("rcari", recap.query);
  if (recap.residence !== "all") {
    search.set("rtinggal", RESIDENCE_CHOICES[recap.residence]);
  }
  if (recap.category !== "all") {
    search.set("rkategori", FILTER_CHOICES[recap.category]);
  }
  if (recap.illness !== "all") {
    search.set("rriwayat", ILLNESS_CHOICES[recap.illness]);
  }
  if (recap.page > 1) search.set("rhal", String(recap.page));
  return search;
}

/** The address of the tab with the list's choices and the recap's. */
export function recapAddress(list: FitnessParams, recap: RecapParams): string {
  const listPart = fitnessAddress(list).slice(FITNESS_ADDRESS.length + 1);
  const parts = [listPart, recapSearch(recap).toString()];
  const text = parts.filter((part) => part !== "").join("&");
  if (text === "") return FITNESS_ADDRESS;
  return `${FITNESS_ADDRESS}?${text}`;
}
