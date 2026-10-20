import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { JenjangBadge, StatusBadge } from "./penalty-badges";
import type { PenaltyRow } from "./penalty-board";
import { ruleOf } from "./penalty-rules";
import { lengthWords } from "./penalty-words";

/** Kerja sosial of a row: its length and its last day, or a dash. */
function SocialWorkCell({ row }: { row: PenaltyRow }) {
  const length = ruleOf(row.category, row.level).socialWork;
  if (length === null || row.socialWorkEndsOn === null) return <>-</>;
  return (
    <>
      {lengthWords(length)}
      <small className={shared.detail}>
        s.d. {shownDay(row.socialWorkEndsOn)}
      </small>
    </>
  );
}

/** One penalty of "Daftar pelanggaran". */
function PenaltyLine({ row }: { row: PenaltyRow }) {
  return (
    <tr>
      <td className={shared.rowHeading} data-title="Mahasiswa">
        <b className={shared.typed}>{row.name}</b>
        <small className={shared.detail}>
          {row.nim} · {row.program}
        </small>
      </td>
      <td data-title="Tanggal">{shownDay(row.day)}</td>
      <td data-title="Hukuman">
        <JenjangBadge category={row.category} level={row.level} />
        <small className={shared.detail}>
          {ruleOf(row.category, row.level).penalty}
        </small>
      </td>
      <td data-title="Kerja sosial">
        <SocialWorkCell row={row} />
      </td>
      <td data-title="Status">
        <StatusBadge status={row.status} />
      </td>
    </tr>
  );
}

/** The penalties of one page. On a phone each is a card. */
export function PenaltyTable({ rows }: { rows: PenaltyRow[] }) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Tanggal</th>
            <th>Hukuman</th>
            <th>Kerja sosial</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <PenaltyLine key={row.id} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
