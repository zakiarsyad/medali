import { periodTitle } from "@/academic-periods/period-labels";
import shared from "@/ui/data-screen.module.css";
import { DAY } from "@/ui/day";
import { groupCode } from "@/ui/group-code";
import {
  ASPECT_SHORT_TITLES,
  EVALUATION_ASPECTS,
  type EvaluationAspect,
} from "./evaluation-aspects";
import { EvaluationBadge } from "./evaluation-badge";
import { shownAverage } from "./evaluation-result";
import type { ListedEvaluation } from "./evaluation-rows";

const BETWEEN = " · ";

/** The mark of a line that came from the students' survey. */
export const SURVEY_SOURCE = "Evaluasi oleh mahasiswa";

/**
 * A value as the list shows it: a whole number from the form of Kepala
 * Unit, one decimal from the survey, and a dash where the survey has none.
 */
function aspectWords(
  evaluation: ListedEvaluation,
  aspect: EvaluationAspect,
): string {
  const value = evaluation[aspect];
  if (value === null) return "-";
  if (evaluation.source === "student_survey") return shownAverage(value);
  return String(value);
}

/** How many members answered the survey of a line, as its note says. */
export function respondentsNote(answered: number, members: number): string {
  return `${answered.toLocaleString("id-ID")} dari ${members.toLocaleString("id-ID")} anggota mengisi survei.`;
}

function EvaluationRow({ evaluation }: { evaluation: ListedEvaluation }) {
  const { respondents } = evaluation;
  return (
    <tr>
      <td data-title="Periode">{periodTitle(evaluation.period)}</td>
      <td data-title="Pengasuh">{evaluation.mentorName}</td>
      <td data-title="Kelompok">{groupCode(evaluation.group)}</td>
      {EVALUATION_ASPECTS.map((aspect) => (
        <td key={aspect} data-title={ASPECT_SHORT_TITLES[aspect]}>
          {aspectWords(evaluation, aspect)}
        </td>
      ))}
      <td data-title="Hasil">
        <EvaluationBadge average={evaluation.average} />
      </td>
      <td data-title="Dievaluasi">
        <small className={shared.detail}>
          {DAY.format(evaluation.evaluatedAt)}
          {BETWEEN}
          {evaluation.evaluatorName}
        </small>
        {respondents !== null && (
          <>
            <span className={shared.badge}>{SURVEY_SOURCE}</span>{" "}
            {respondentsNote(respondents.answered, respondents.members)}
          </>
        )}
        {evaluation.note}
      </td>
    </tr>
  );
}

/**
 * A list of the evaluation history: the period, the mentor, the group,
 * the four values, the result, and when, by whom and with which note. A
 * line of the survey is marked "Evaluasi oleh mahasiswa", with how many
 * members answered.
 */
export function EvaluationTable({
  evaluations,
}: {
  evaluations: ListedEvaluation[];
}) {
  if (evaluations.length === 0) {
    return <p className={shared.empty}>Belum ada evaluasi.</p>;
  }
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Periode</th>
            <th>Pengasuh</th>
            <th>Kelompok</th>
            {EVALUATION_ASPECTS.map((aspect) => (
              <th key={aspect}>{ASPECT_SHORT_TITLES[aspect]}</th>
            ))}
            <th>Hasil</th>
            <th>Dievaluasi</th>
          </tr>
        </thead>
        <tbody>
          {evaluations.map((evaluation) => (
            <EvaluationRow key={evaluation.id} evaluation={evaluation} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
