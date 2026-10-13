import { campusDay } from "@/academic-periods/campus-day";
import { database } from "@/db/database";
import { readRunningSurveyCard } from "./survey-card";
import { readSurveyFormStart } from "./survey-form-reads";
import type { SurveyRights } from "./survey-rights";
import { SurveyPanelBody } from "./survey-tab";

/**
 * Reads what the panel of the survey period shows, all at the same time:
 * the period that runs with the students who can answer, and, for an
 * account that may manage the periods, what the form opens with.
 */
export async function SurveyPanel({ rights }: { rights: SurveyRights }) {
  const db = database();
  const today = campusDay();
  const [card, start] = await Promise.all([
    readRunningSurveyCard(db, rights.respondents, today),
    rights.mayManage ? readSurveyFormStart(db, today) : null,
  ]);
  return (
    <SurveyPanelBody card={card} start={start} mayManage={rights.mayManage} />
  );
}
