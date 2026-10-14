import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { ModalDialog } from "@/ui/modal-dialog";
import { HistoryTable } from "./history-table";
import styles from "./siku.module.css";
import {
  HISTORY_PAGE_SIZE,
  SEEN_PAGE_SIZE,
  type SikuParams,
  sikuAddress,
} from "./siku-address";
import type { SeenStudents, SikuHistory } from "./siku-history";
import { KIND_WORDS, REASON_WORDS } from "./siku-words";

/**
 * "Riwayat penambahan dan pengurangan SIKU": the entries in force of the
 * students the account sees, 20 a page.
 */
export function HistoryPanel({
  history,
  params,
  mayCancel,
}: {
  history: SikuHistory;
  params: SikuParams;
  mayCancel: boolean;
}) {
  const rows = history.entries.map((entry) => ({
    ...entry,
    seeAddress: sikuAddress({ ...params, seenEntry: entry.id, seenPage: 1 }),
  }));
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>
        Riwayat penambahan dan pengurangan SIKU
      </h2>
      <p className={styles.sub}>
        Setiap penyesuaian beserta alasan dan mahasiswanya
      </p>
      <HistoryTable rows={rows} mayCancel={mayCancel} />
      {history.matching > 0 && (
        <ListPager
          page={history.page}
          matching={history.matching}
          pageSize={HISTORY_PAGE_SIZE}
          noun="penyesuaian"
          keepsPlace
          addressOf={(page) =>
            sikuAddress({ ...params, historyPage: page, seenEntry: null })
          }
        />
      )}
    </section>
  );
}

/**
 * "Lihat mahasiswa": the students of one entry the account sees, 25 a
 * page, in a box over the tab.
 */
export function SeenStudentsDialog({
  seen,
  params,
}: {
  seen: SeenStudents;
  params: SikuParams;
}) {
  const { entry } = seen;
  return (
    <ModalDialog
      label="Mahasiswa penyesuaian SIKU"
      closeAddress={sikuAddress({ ...params, seenEntry: null })}
    >
      <h2 className={shared.heading}>
        {KIND_WORDS[entry.kind]} {entry.points} poin
      </h2>
      <p className={styles.sub}>{REASON_WORDS[entry.reason]}</p>
      <div className={shared.tableWrap}>
        <table className={`${shared.table} ${shared.stacked}`}>
          <thead>
            <tr>
              <th>Mahasiswa</th>
              <th>NIM</th>
              <th>Program studi</th>
            </tr>
          </thead>
          <tbody>
            {seen.students.map((student) => (
              <tr key={student.id}>
                <td className={shared.rowHeading} data-title="Mahasiswa">
                  <b className={shared.typed}>{student.name}</b>
                </td>
                <td data-title="NIM">{student.nim}</td>
                <td data-title="Program studi">{student.program}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ListPager
        page={seen.page}
        matching={seen.matching}
        pageSize={SEEN_PAGE_SIZE}
        noun="mahasiswa"
        keepsPlace
        stepsOnOnePage={false}
        addressOf={(page) => sikuAddress({ ...params, seenPage: page })}
      />
    </ModalDialog>
  );
}
