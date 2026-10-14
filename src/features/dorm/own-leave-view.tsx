import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { CancelLeaveButton } from "./cancel-leave-button";
import styles from "./leave.module.css";
import { ownLeaveAddress } from "./leave-address";
import { StatusBadge } from "./leave-badges";
import { coveredCountWords, type LeaveRow } from "./leave-row";
import { KIND_WORDS } from "./leave-words";
import type { OwnLeave } from "./own-leave";

function OwnLeaveRow({ row }: { row: LeaveRow }) {
  return (
    <tr>
      <td data-title="Jenis">
        {KIND_WORDS[row.kind]}
        {row.kind === "skip_activities" && (
          <p className={styles.quietLine}>{coveredCountWords(row)}</p>
        )}
      </td>
      <td data-title="Berangkat">{row.start}</td>
      <td data-title="Kembali">{row.end}</td>
      <td data-title="Keperluan">{row.purpose}</td>
      <td data-title="Status">
        <StatusBadge status={row.status} />
        {row.decisionNote !== "" && (
          <p className={styles.quietLine}>{row.decisionNote}</p>
        )}
      </td>
      <td>
        {row.status === "submitted" && (
          <CancelLeaveButton
            id={row.id}
            question={`Batalkan ${KIND_WORDS[row.kind].toLowerCase()} ${row.start}?`}
          />
        )}
      </td>
    </tr>
  );
}

/** "Riwayat izin saya": the resident's requests, the latest start first, paged. */
export function OwnLeaveView({ leave }: { leave: OwnLeave }) {
  if (leave.rows.length === 0) {
    return <p className={shared.empty}>Belum pernah mengajukan izin.</p>;
  }
  return (
    <>
      <div className={shared.tableWrap}>
        <table className={`${shared.table} ${shared.stacked}`}>
          <thead>
            <tr>
              <th>Jenis</th>
              <th>Berangkat</th>
              <th>Kembali</th>
              <th>Keperluan</th>
              <th>Status</th>
              <th>
                <span className={shared.hidden}>Tindakan</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {leave.rows.map((row) => (
              <OwnLeaveRow key={row.id} row={row} />
            ))}
          </tbody>
        </table>
      </div>
      <ListPager
        page={leave.page}
        matching={leave.matching}
        noun="izin"
        stepsOnOnePage={false}
        keepsPlace
        addressOf={ownLeaveAddress}
      />
    </>
  );
}
