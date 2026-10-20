/*
 * A half-filled survey is kept in the storage of the device, so a
 * refresh does not lose it. On a device that others use too, it must
 * not stay after the student is done: it is forgotten at sign-out, and
 * whenever the survey card opens, all but the one still being filled in.
 */

const SURVEY_DRAFT_PREFIX = "medali:survei:";

/** Where a draft is kept: one per student and survey period. */
export function surveyDraftKey(
  studentId: string,
  surveyPeriodId: string,
): string {
  return `${SURVEY_DRAFT_PREFIX}${studentId}:${surveyPeriodId}`;
}

/** The storage of the device, or null where the browser refuses it. */
export function deviceStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function surveyDraftKeys(storage: Storage): string[] {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (key?.startsWith(SURVEY_DRAFT_PREFIX)) keys.push(key);
  }
  return keys;
}

/**
 * Forgets every survey draft on the device but `kept`, or all of them
 * when `kept` is null. A device that refuses keeps what it has, and the
 * page goes on.
 */
export function forgetSurveyDrafts(
  storage: Storage | null,
  kept: string | null,
): void {
  if (storage === null) return;
  try {
    for (const key of surveyDraftKeys(storage)) {
      if (key !== kept) storage.removeItem(key);
    }
  } catch {
    // A refused storage holds nothing that can be forgotten.
  }
}
