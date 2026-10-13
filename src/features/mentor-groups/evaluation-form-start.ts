import type { StoredEvaluation } from "./evaluated-group";
import type { TypedScores } from "./evaluation-input";

/** What the fields of the form hold. */
export interface TypedEvaluation {
  scores: TypedScores;
  note: string;
}

const EMPTY: TypedEvaluation = {
  scores: { activity: "", attendance: "", achievement: "", feedback: "" },
  note: "",
};

/**
 * What the form starts with for a period: what is saved for it, so that
 * saving again corrects it, or empty fields for a period without one.
 */
export function typedFor(
  stored: StoredEvaluation[],
  periodId: string,
): TypedEvaluation {
  const saved = stored.find((evaluation) => evaluation.periodId === periodId);
  if (!saved) return EMPTY;
  return {
    scores: {
      activity: String(saved.activity),
      attendance: String(saved.attendance),
      achievement: String(saved.achievement),
      feedback: String(saved.feedback),
    },
    note: saved.note ?? "",
  };
}
