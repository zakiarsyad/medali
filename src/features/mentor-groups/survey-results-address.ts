import { firstParam, type SearchParams } from "@/ui/search-params";
import { searchText } from "@/ui/search-text";
import { SURVEY_ADDRESS } from "./survey-address";

/** "Nilai kurang" and "Belum ada responden". Null is "Semua kelompok". */
export type ResultFilter = "poor" | "no_answers" | null;

const FILTER_WORDS: Record<NonNullable<ResultFilter>, string> = {
  poor: "kurang",
  no_answers: "belum",
};

/** What "Hasil evaluasi per kelompok" is asked to show. */
export interface SurveyResultChoices {
  /**
   * The survey period chosen, or null for the one that runs, else the
   * latest. It is not checked here: the read of the periods passes over
   * what names none.
   */
  surveyPeriodId: string | null;
  /** Searched for in the group code and in the name of the mentor. */
  query: string;
  filter: ResultFilter;
  /** The page of the list, counted from 1. */
  page: number;
}

export const NO_RESULT_CHOICES: SurveyResultChoices = {
  surveyPeriodId: null,
  query: "",
  filter: null,
  page: 1,
};

const PAGE = /^[1-9]\d{0,5}$/;
/** As long as the id of a record is. */
const ID_LENGTH = 36;

function readId(value: SearchParams[string]): string | null {
  const id = firstParam(value).trim().slice(0, ID_LENGTH);
  return id === "" ? null : id;
}

function readFilter(value: SearchParams[string]): ResultFilter {
  const words = firstParam(value);
  if (words === FILTER_WORDS.poor) return "poor";
  if (words === FILTER_WORDS.no_answers) return "no_answers";
  return null;
}

/**
 * What the address asks the results for. Nothing in an address is
 * trusted: a part that is not understood counts as not chosen.
 */
export function readSurveyResultParams(
  params: SearchParams,
): SurveyResultChoices {
  const page = firstParam(params.hal);
  return {
    surveyPeriodId: readId(params.periode),
    query: searchText(firstParam(params.q)) ?? "",
    filter: readFilter(params.saring),
    page: PAGE.test(page) ? Number(page) : 1,
  };
}

/** The address of a page of the results with these choices. */
export function surveyResultsAddress(
  choices: SurveyResultChoices,
  page = 1,
): string {
  const params = new URLSearchParams();
  if (choices.surveyPeriodId !== null) {
    params.set("periode", choices.surveyPeriodId);
  }
  if (choices.query) params.set("q", choices.query);
  if (choices.filter !== null) {
    params.set("saring", FILTER_WORDS[choices.filter]);
  }
  if (page > 1) params.set("hal", String(page));
  const search = params.toString();
  return search === "" ? SURVEY_ADDRESS : `${SURVEY_ADDRESS}?${search}`;
}
