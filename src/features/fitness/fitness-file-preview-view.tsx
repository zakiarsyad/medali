import type { ReactNode } from "react";
import { CategoryBadge } from "@/health-notes/category-badge";
import shared from "@/ui/data-screen.module.css";
import { FileSummary, MoreRows, SkippedRows } from "@/ui/file-preview-parts";
import type {
  FitnessFilePreview,
  FitnessPreviewRow,
} from "./fitness-file-preview";

function ReadyRow({ row }: { row: FitnessPreviewRow }) {
  return (
    <tr>
      <td>{row.nim}</td>
      <td>
        <span className={shared.typed}>{row.name}</span>
      </td>
      <td>{row.score}</td>
      <td>
        <CategoryBadge category={row.category} />
      </td>
    </tr>
  );
}

/** The first ready rows, in a box that scrolls sideways on a phone. */
function ReadyRows({ preview }: { preview: FitnessFilePreview }) {
  return (
    <>
      <div className={shared.tableWrap}>
        <table className={shared.table}>
          <thead>
            <tr>
              <th>nim</th>
              <th>nama</th>
              <th>skor</th>
              <th>Kategori</th>
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
 * What a picked fitness file would do, before anything is saved.
 * `children` are the buttons, shown only when there is a row to save.
 */
export function FitnessFilePreviewView({
  name,
  preview,
  children,
}: {
  name: string;
  preview: FitnessFilePreview;
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
