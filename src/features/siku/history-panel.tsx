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
import type {
  HistoryEntry,
  SeenChange,
  SeenStudents,
  SikuHistory,
} from "./siku-history";
import { KIND_WORDS, REASON_WORDS, signedPoints } from "./siku-words";

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

function SeenTitle({ entry }: { entry: HistoryEntry }) {
  if (entry.source === "upload") {
    return (
      <>
        <h2 className={shared.heading}>Unggah berkas</h2>
        <p className={`${styles.sub} ${shared.typed}`}>{entry.fileName}</p>
      </>
    );
  }
  return (
    <>
      <h2 className={shared.heading}>
        {KIND_WORDS[entry.kind]} {entry.points} poin
      </h2>
      <p className={styles.sub}>{REASON_WORDS[entry.reason]}</p>
    </>
  );
}

/** The student's own points and reason, on a row of an upload. */
function SeenChangeCell({ change }: { change: SeenChange }) {
  return (
    <td data-title="Penyesuaian">
      <b className={change.kind === "gain" ? styles.gain : styles.loss}>
        {signedPoints(change.points, change.kind)}
      </b>{" "}
      {REASON_WORDS[change.reason]}
    </td>
  );
}

/**
 * "Lihat mahasiswa": the students of one entry the account sees, 25 a
 * page, in a box over the tab. For an upload, each row of it, with the
 * student's own points and reason.
 */
export function SeenStudentsDialog({
  seen,
  params,
}: {
  seen: SeenStudents;
  params: SikuParams;
}) {
  const { entry } = seen;
  const fromFile = entry.source === "upload";
  return (
    <ModalDialog
      label="Mahasiswa penyesuaian SIKU"
      closeAddress={sikuAddress({ ...params, seenEntry: null })}
    >
      <SeenTitle entry={entry} />
      <div className={shared.tableWrap}>
        <table className={`${shared.table} ${shared.stacked}`}>
          <thead>
            <tr>
              <th>Mahasiswa</th>
              <th>NIM</th>
              <th>Program studi</th>
              {fromFile && <th>Penyesuaian</th>}
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
                {student.change && <SeenChangeCell change={student.change} />}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ListPager
        page={seen.page}
        matching={seen.matching}
        pageSize={SEEN_PAGE_SIZE}
        noun={fromFile ? "baris" : "mahasiswa"}
        keepsPlace
        stepsOnOnePage={false}
        addressOf={(page) => sikuAddress({ ...params, seenPage: page })}
      />
    </ModalDialog>
  );
}
