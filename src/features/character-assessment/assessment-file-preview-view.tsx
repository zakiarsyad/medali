import type { ReactNode } from "react";
import { rerataOf } from "@/character-scores/assessment-score";
import { PredicateBadge } from "@/character-scores/predicate-badge";
import { shownRerata } from "@/character-scores/shown-rerata";
import shared from "@/ui/data-screen.module.css";
import { FileSummary, MoreRows, SkippedRows } from "@/ui/file-preview-parts";
import { MEDALI_VALUES } from "@/ui/medali-values";
import type {
  AssessmentFilePreview,
  AssessmentPreviewRow,
} from "./assessment-file-preview";

function ReadyRow({ row }: { row: AssessmentPreviewRow }) {
  const rerata = rerataOf(row.scores);
  return (
    <tr>
      <td>{row.nim}</td>
      <td>
        <span className={shared.typed}>{row.name}</span>
      </td>
      {MEDALI_VALUES.map(({ key }) => (
        <td key={key}>{row.scores[key]}</td>
      ))}
      <td>{shownRerata(rerata)}</td>
      <td>
        <PredicateBadge rerata={rerata} />
      </td>
    </tr>
  );
}

/** The first ready rows, in a box that scrolls sideways on a phone. */
function ReadyRows({ preview }: { preview: AssessmentFilePreview }) {
  return (
    <>
      <div className={shared.tableWrap}>
        <table className={shared.table}>
          <thead>
            <tr>
              <th>nim</th>
              <th>nama</th>
              {MEDALI_VALUES.map(({ key, name }) => (
                <th key={key}>
                  <abbr title={name}>{key}</abbr>
                </th>
              ))}
              <th>Rerata</th>
              <th>Predikat</th>
            </tr>
          </thead>
          <tbody>
            {preview.firstRows.map((row) => (
              <ReadyRow key={row.row} row={row} />
            ))}
          </tbody>
        </table>
      </div>
      <MoreRows more={preview.ready - preview.firstRows.length} />
    </>
  );
}

/**
 * What a picked assessment file would do, before anything is saved.
 * `children` are the buttons, shown only when there is a row to save.
 */
export function AssessmentFilePreviewView({
  name,
  preview,
  children,
}: {
  name: string;
  preview: AssessmentFilePreview;
  children: ReactNode;
}) {
  return (
    <>
      <FileSummary
        name={name}
        ready={preview.ready}
        skipped={preview.skipped}
        duplicates={preview.duplicates}
      />
      {preview.ready > 0 && <ReadyRows preview={preview} />}
      <SkippedRows skipped={preview.skipped} first={preview.firstSkipped} />
      {preview.ready > 0 && <div className={shared.actions}>{children}</div>}
    </>
  );
}
