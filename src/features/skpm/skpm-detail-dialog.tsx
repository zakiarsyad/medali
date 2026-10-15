import shared from "@/ui/data-screen.module.css";
import { ModalDialog } from "@/ui/modal-dialog";
import styles from "./skpm.module.css";
import { type SkpmParams, skpmAddress } from "./skpm-address";
import type { SkpmDetail } from "./skpm-board";
import { orDash, shownOneDecimal, shownPoints } from "./skpm-words";

/**
 * "Rincian": the activities in force of one student, in a box over the
 * tab, the latest upload first.
 */
export function SkpmDetailDialog({
  detail,
  params,
}: {
  detail: SkpmDetail;
  params: SkpmParams;
}) {
  const { totals } = detail;
  return (
    <ModalDialog
      label="Rincian data SKPM"
      closeAddress={skpmAddress({ ...params, detailId: null })}
    >
      <h2 className={`${shared.heading} ${shared.typed}`}>{detail.name}</h2>
      <p className={styles.sub}>
        {detail.nim} · {detail.program}
      </p>
      <p className={styles.sub}>
        Total poin {totals ? shownPoints(totals.total) : "-"} · Nilai SKPM{" "}
        <b>{shownOneDecimal(totals?.score ?? null)}</b>
      </p>
      {detail.activities.length === 0 ? (
        <p className={shared.empty}>Belum ada data SKPM.</p>
      ) : (
        <div className={shared.tableWrap}>
          <table className={`${shared.table} ${shared.stacked}`}>
            <thead>
              <tr>
                <th>Kegiatan</th>
                <th>Kategori</th>
                <th>Tingkat</th>
                <th>Peran</th>
                <th>Tanggal</th>
                <th>Poin</th>
              </tr>
            </thead>
            <tbody>
              {detail.activities.map((row) => (
                <tr key={row.id}>
                  <td className={shared.rowHeading} data-title="Kegiatan">
                    <span className={shared.typed}>{row.activity}</span>
                  </td>
                  <td data-title="Kategori">
                    <span className={shared.typed}>{row.category}</span>
                  </td>
                  <td data-title="Tingkat">
                    <span className={shared.typed}>{orDash(row.level)}</span>
                  </td>
                  <td data-title="Peran">
                    <span className={shared.typed}>
                      {orDash(row.activityRole)}
                    </span>
                  </td>
                  <td data-title="Tanggal">
                    <span className={shared.typed}>{orDash(row.day)}</span>
                  </td>
                  <td className={styles.strong} data-title="Poin">
                    {shownPoints(row.points)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ModalDialog>
  );
}
