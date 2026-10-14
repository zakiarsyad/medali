import { desc, eq, isNull, type SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  accounts,
  activityClarifications,
  activitySchedules,
  ppksActivities,
  students,
  studyPrograms,
} from "@/db/schema";
import { hourAndMinute } from "@/db/stored-time";
import { shownMoment } from "@/ui/day";
import {
  type ClarificationCard,
  type ClarificationSummary,
  type DecisionWords,
  decidedByWords,
  fileFacts,
  heldWords,
  isPdfType,
  resultWords,
} from "./clarification-card";
import { REASON_WORDS } from "./clarification-reasons";

export const OF_CLARIFICATION = eq(
  activitySchedules.id,
  activityClarifications.scheduleId,
);

/** The clarification of a removed schedule is not shown, counted or decided. */
export const OF_KEPT_SCHEDULE = isNull(activitySchedules.deletedAt);

/** The newest first; two sent at the same moment keep one order on every page. */
export const NEWEST_SENT_FIRST = [
  desc(activityClarifications.sentAt),
  desc(activityClarifications.id),
];

/** What every role that reads a clarification is shown of it. */
const SUMMARY = {
  id: activityClarifications.id,
  status: activityClarifications.status,
  acceptedAs: activityClarifications.acceptedAs,
  note: activityClarifications.note,
  reason: activityClarifications.reason,
  sentAt: activityClarifications.sentAt,
  decidedAt: activityClarifications.decidedAt,
  name: students.name,
  nim: students.nim,
  program: studyPrograms.name,
  activity: ppksActivities.name,
  startsOn: activitySchedules.startsOn,
  endsOn: activitySchedules.endsOn,
  startTime: activitySchedules.startTime,
  endTime: activitySchedules.endTime,
  decidedBy: accounts.name,
};

/** With it what only the account that decides reads. */
const DETAILS = {
  ...SUMMARY,
  explanation: activityClarifications.explanation,
  fileKey: activityClarifications.fileKey,
  fileName: activityClarifications.fileName,
  fileContentType: activityClarifications.fileContentType,
  fileSize: activityClarifications.fileSize,
};

const OF_ACTIVITY = eq(ppksActivities.id, activitySchedules.activityId);
const OF_STUDENT = eq(students.id, activityClarifications.studentId);
const OF_PROGRAM = eq(studyPrograms.id, students.studyProgramId);
const OF_DECIDER = eq(accounts.id, activityClarifications.decidedBy);

/**
 * The stored clarifications that match, without their explanation and
 * without anything of their file: neither is asked from the database, so
 * neither can reach a screen that must not show it.
 */
export function storedSummaries(db: Database, condition: SQL | undefined) {
  return db
    .select(SUMMARY)
    .from(activityClarifications)
    .innerJoin(activitySchedules, OF_CLARIFICATION)
    .innerJoin(ppksActivities, OF_ACTIVITY)
    .innerJoin(students, OF_STUDENT)
    .innerJoin(studyPrograms, OF_PROGRAM)
    .leftJoin(accounts, OF_DECIDER)
    .where(condition);
}

/** The stored clarifications that match, with everything a card shows. */
export function storedCards(db: Database, condition: SQL | undefined) {
  return db
    .select(DETAILS)
    .from(activityClarifications)
    .innerJoin(activitySchedules, OF_CLARIFICATION)
    .innerJoin(ppksActivities, OF_ACTIVITY)
    .innerJoin(students, OF_STUDENT)
    .innerJoin(studyPrograms, OF_PROGRAM)
    .leftJoin(accounts, OF_DECIDER)
    .where(condition);
}

type StoredSummary = Awaited<ReturnType<typeof storedSummaries>>[number];
type StoredCard = Awaited<ReturnType<typeof storedCards>>[number];

function decisionOf(stored: StoredSummary): DecisionWords | null {
  const { status, acceptedAs, note, decidedAt, decidedBy } = stored;
  if (status === "submitted" || decidedAt === null) return null;
  const isDispensation = acceptedAs === "dispensation";
  const accepted = isDispensation ? "dispensation" : "valid";
  const result = status === "rejected" ? "rejected" : accepted;
  return {
    result: resultWords(result, note),
    by: decidedByWords(decidedBy ?? "-", decidedAt),
  };
}

export function summaryOf(stored: StoredSummary): ClarificationSummary {
  return {
    id: stored.id,
    sentAt: stored.sentAt.toISOString(),
    name: stored.name,
    nim: stored.nim,
    program: stored.program,
    activity: stored.activity,
    held: heldWords({
      startsOn: stored.startsOn,
      endsOn: stored.endsOn,
      startTime: hourAndMinute(stored.startTime),
      endTime: hourAndMinute(stored.endTime),
    }),
    reason: REASON_WORDS[stored.reason],
    status: stored.status,
    sent: shownMoment(stored.sentAt),
    decision: decisionOf(stored),
  };
}

/**
 * A stored clarification as its card. `keepsFiles` is whether this place
 * has a file storage: without one, and for a sample clarification whose
 * file was never kept, there is no file to open.
 */
export function cardOf(
  stored: StoredCard,
  keepsFiles: boolean,
): ClarificationCard {
  const hasFile = keepsFiles && stored.fileKey !== null;
  const isPdf = isPdfType(stored.fileContentType);
  return {
    ...summaryOf(stored),
    explanation: stored.explanation,
    file: hasFile
      ? {
          name: stored.fileName,
          isPdf,
          facts: fileFacts(isPdf, stored.fileSize),
        }
      : null,
  };
}
