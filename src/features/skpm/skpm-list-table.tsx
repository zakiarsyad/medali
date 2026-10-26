import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import { ProfileNameLink } from "@/ui/profile-name-link";
import styles from "./skpm.module.css";
import { type SkpmParams, skpmAddress } from "./skpm-address";
import type { SkpmListRow } from "./skpm-board";
import { shownOneDecimal, shownPoints } from "./skpm-words";

export const NO_SKPM_MATCHES = "Tidak ada mahasiswa pada filter ini.";

export const NO_DATA = "Belum ada data";

/**
 * "Nilai SKPM per mahasiswa": each student with Kegiatan, Total poin and
 * Nilai SKPM, and "Rincian" for the activities, or "Belum ada data". On a
 * phone each student is a block of its own.
 */
export function SkpmListTable({
  rows,
  params,
}: {
  rows: readonly SkpmListRow[];
  params: SkpmParams;
}) {
  if (rows.length === 0) {
    return <p className={shared.empty}>{NO_SKPM_MATCHES}</p>;
  }
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Kegiatan</th>
            <th>Total poin</th>
            <th>Nilai SKPM</th>
            <th>
              <span className={shared.hidden}>Rincian</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ id, name, nim, program, totals }) => (
            <tr key={id}>
              <td className={shared.rowHeading} data-title="Mahasiswa">
                <ProfileNameLink
                  name={name}
                  href={skpmAddress({ ...params, profileId: id })}
                />
                <small className={shared.detail}>
                  {nim} · {program}
                </small>
              </td>
              <td data-title="Kegiatan">{totals ? totals.activities : "-"}</td>
              <td data-title="Total poin">
                {totals ? shownPoints(totals.total) : "-"}
              </td>
              <td className={styles.strong} data-title="Nilai SKPM">
                {shownOneDecimal(totals?.score ?? null)}
              </td>
              <td className={shared.rowActions}>
                {totals ? (
                  <Link
                    href={skpmAddress({ ...params, detailId: id })}
                    scroll={false}
                    className={shared.link}
                  >
                    Rincian
                  </Link>
                ) : (
                  <span className={shared.emptyCell}>{NO_DATA}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
