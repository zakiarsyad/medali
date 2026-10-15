import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { FileSummary, MoreRows, SkippedRows } from "@/ui/file-preview-parts";
import type { SikuFilePreview } from "./siku-file-preview";
import { KIND_WORDS, REASON_WORDS, signedPoints } from "./siku-words";

/** The first ready rows, in a box that scrolls sideways on a phone. */
function ReadyRows({ preview }: { preview: SikuFilePreview }) {
  return (
    <>
      <div className={shared.tableWrap}>
        <table className={shared.table}>
          <thead>
            <tr>
              <th>nim</th>
              <th>nama</th>
              <th>jenis</th>
              <th>alasan</th>
              <th>poin</th>
              <th>keterangan</th>
            </tr>
          </thead>
          <tbody>
            {preview.firstRows.map((row) => (
              <tr key={row.row}>
                <td>{row.nim}</td>
                <td>
                  <span className={shared.typed}>{row.name}</span>
                </td>
                <td>{KIND_WORDS[row.kind]}</td>
                <td>{REASON_WORDS[row.reason]}</td>
                <td>{signedPoints(row.points, row.kind)}</td>
                <td>
                  <span className={shared.typed}>{row.keterangan}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <MoreRows more={preview.ready - preview.firstRows.length} />
    </>
  );
}

/**
 * What a picked SIKU file would do, before anything is saved. `children`
 * are the buttons, shown only when there is a row to save.
 */
export function SikuFilePreviewView({
  name,
  preview,
  children,
}: {
  name: string;
  preview: SikuFilePreview;
  children: ReactNode;
}) {
  return (
    <>
      <FileSummary
        name={name}
        ready={preview.ready}
        skipped={preview.skipped}
      />
      {preview.ready > 0 && <ReadyRows preview={preview} />}
      <SkippedRows skipped={preview.skipped} first={preview.firstSkipped} />
      {preview.ready > 0 && <div className={shared.actions}>{children}</div>}
    </>
  );
}
