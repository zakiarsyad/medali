import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { FileSummary, MoreRows, SkippedRows } from "@/ui/file-preview-parts";
import type { SkpmFilePreview } from "./skpm-file-preview";
import { orDash, shownPoints } from "./skpm-words";

/** The first ready rows. On a phone each row is a block of its own. */
function ReadyRows({ preview }: { preview: SkpmFilePreview }) {
  return (
    <>
      <div className={shared.tableWrap}>
        <table className={`${shared.table} ${shared.stacked}`}>
          <thead>
            <tr>
              <th>nim</th>
              <th>kegiatan</th>
              <th>kategori</th>
              <th>tingkat</th>
              <th>peran</th>
              <th>tanggal</th>
              <th>poin</th>
            </tr>
          </thead>
          <tbody>
            {preview.firstRows.map((row) => (
              <tr key={row.row}>
                <td className={shared.rowHeading} data-title="nim">
                  {row.nim}
                  <small className={`${shared.detail} ${shared.typed}`}>
                    {row.name}
                  </small>
                </td>
                <td data-title="kegiatan">
                  <span className={shared.typed}>{row.activity}</span>
                </td>
                <td data-title="kategori">
                  <span className={shared.typed}>{row.category}</span>
                </td>
                <td data-title="tingkat">
                  <span className={shared.typed}>{orDash(row.level)}</span>
                </td>
                <td data-title="peran">
                  <span className={shared.typed}>
                    {orDash(row.activityRole)}
                  </span>
                </td>
                <td data-title="tanggal">
                  <span className={shared.typed}>{orDash(row.day)}</span>
                </td>
                <td data-title="poin">{shownPoints(row.points)}</td>
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
 * What a picked SKPM file would do, before anything is saved. `children`
 * are the buttons, shown only when there is a row to save.
 */
export function SkpmFilePreviewView({
  name,
  preview,
  children,
}: {
  name: string;
  preview: SkpmFilePreview;
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
