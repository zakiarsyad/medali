import { isNull } from "drizzle-orm";
import { studentSurveyPeriods } from "@/db/schema";

/**
 * For a read of survey answers joined with their period: an answer that
 * is used, in Responden and in every recap. The answers of a cancelled
 * period are kept, and the cancel of their period marks them as not used.
 */
export const USED_SURVEY_ANSWER = isNull(studentSurveyPeriods.cancelledAt);
