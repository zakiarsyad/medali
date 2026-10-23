import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import {
  type ClarificationListParams,
  rejectedPanelAddress,
} from "./clarification-address";
import type { RejectedPanel, RejectedRow } from "./rejected-panel";
import { VIOLATIONS_ADDRESS } from "./violation-address";
import styles from "./violations.module.css";
import { LetterMark } from "./warning-calls-panel";
import { WARNINGS_PAGE_SIZE } from "./warning-ids";
import { causeWords } from "./warning-words";

function Status({ row }: { row: RejectedRow }) {
  if (row.level === null && row.mark === null) return "-";
  return (
    <>
      {row.level !== null && (
        <span className={`${shared.badge} ${styles.warn}`}>
          Penetapan SP {row.level}
        </span>
      )}{" "}
      <LetterMark level={row.mark} />
      {row.level !== null && (
        <p className={styles.sub}>{causeWords(row.causes)}</p>
      )}
    </>
  );
}

/**
 * "Klarifikasi ditolak dan penetapan SP" on Klarifikasi kehadiran, for
 * the roles that see Pelanggaran: each resident with a rejected
 * clarification that still counts, 20 a page, with the last one and
 * their SP status. Nothing shows while there is none.
 */
export function RejectedWarningPanel({
  panel,
  params,
}: {
  panel: RejectedPanel;
  params: ClarificationListParams;
}) {
  if (panel.matching === 0) return null;
  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <div>
          <h2 className={shared.heading}>
            Klarifikasi ditolak dan penetapan SP
          </h2>
          <p className={styles.sub}>
            Klarifikasi kehadiran yang ditolak langsung masuk penetapan SP 1.
            Bila ditolak lagi setelah SP 1, masuk SP 2 dan pengajuan hukuman
            disiplin. Penetapan dilakukan Pengelola Asrama di tab Pelanggaran
            asrama.
          </p>
        </div>
        <Link href={VIOLATIONS_ADDRESS} className={shared.quiet}>
          Buka tab Pelanggaran asrama
        </Link>
      </div>
      <div className={shared.tableWrap}>
        <table className={`${shared.table} ${shared.stacked}`}>
          <thead>
            <tr>
              <th>Mahasiswa</th>
              <th>Klarifikasi ditolak</th>
              <th>Terakhir ditolak</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {panel.rows.map((row) => (
              <tr key={row.studentId}>
                <td className={shared.rowHeading} data-title="Mahasiswa">
                  <b>{row.name}</b>
                  <small className={shared.detail}>
                    {row.nim} · {row.room}
                  </small>
                </td>
                <td data-title="Klarifikasi ditolak">
                  <b>{row.rejected.toLocaleString("id-ID")}</b>
                </td>
                <td data-title="Terakhir ditolak">
                  {row.lastDay} · {row.lastActivity}
                </td>
                <td data-title="Status">
                  <Status row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ListPager
        page={panel.page}
        matching={panel.matching}
        pageSize={WARNINGS_PAGE_SIZE}
        noun="mahasiswa"
        keepsPlace
        stepsOnOnePage={false}
        addressOf={(page) => rejectedPanelAddress(params, page)}
      />
    </section>
  );
}
