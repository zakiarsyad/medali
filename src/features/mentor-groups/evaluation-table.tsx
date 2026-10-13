import { periodTitle } from "@/academic-periods/period-labels";
import shared from "@/ui/data-screen.module.css";
import { DAY } from "@/ui/day";
import { groupCode } from "@/ui/group-code";
import { ASPECT_SHORT_TITLES, EVALUATION_ASPECTS } from "./evaluation-aspects";
import { EvaluationBadge } from "./evaluation-badge";
import type { ListedEvaluation } from "./evaluation-rows";

const BETWEEN = " · ";

function EvaluationRow({ evaluation }: { evaluation: ListedEvaluation }) {
  return (
    <tr>
      <td data-title="Periode">{periodTitle(evaluation.period)}</td>
      <td data-title="Pengasuh">{evaluation.mentorName}</td>
      <td data-title="Kelompok">{groupCode(evaluation.group)}</td>
      {EVALUATION_ASPECTS.map((aspect) => (
        <td key={aspect} data-title={ASPECT_SHORT_TITLES[aspect]}>
          {evaluation[aspect]}
        </td>
      ))}
      <td data-title="Hasil">
        <EvaluationBadge scores={evaluation} />
      </td>
      <td data-title="Dievaluasi">
        <small className={shared.detail}>
          {DAY.format(evaluation.evaluatedAt)}
          {BETWEEN}
          {evaluation.evaluatorName}
        </small>
        {evaluation.note}
      </td>
    </tr>
  );
}

/**
 * A list of evaluations: the period, the mentor, the group, the four
 * values, the result, and when, by whom and with which note.
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
