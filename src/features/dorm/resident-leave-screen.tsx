import shared from "@/ui/data-screen.module.css";
import type { TabLinksProps } from "@/ui/tab-links";
import { TabbedHead } from "@/ui/tabbed-head";
import styles from "./leave.module.css";
import type { LeaveListParams } from "./leave-address";
import { LeaveForm } from "./leave-form";
import { LEAVE_KINDS } from "./leave-ids";
import { KIND_RULES, KIND_WORDS } from "./leave-words";
import type { OwnLeave } from "./own-leave";
import { OwnLeaveView } from "./own-leave-view";
import { OwnRoomLine } from "./own-room-line";

/** Ketentuan: the rule of each kind, how it is approved, and what ITMK does. */
function LeaveTerms() {
  return (
    <ul className={styles.terms}>
      {LEAVE_KINDS.map((kind) => (
        <li key={kind}>
          <b>{KIND_WORDS[kind]}</b>
          <span>{KIND_RULES[kind]}</span>
        </li>
      ))}
      <li>
        <b>Persetujuan</b>
        <span>
          Diverifikasi oleh Pengelola Asrama. Kegiatan asrama selama izin yang
          disetujui tercatat sebagai izin, bukan tidak hadir.
        </span>
      </li>
      <li>
        <b>ITMK</b>
        <span>
          Setelah disetujui, kegiatan asrama dalam rentang jam ITMK tercatat
          hadir dengan keterangan ITMK di riwayat Anda.
        </span>
      </li>
    </ul>
  );
}

export interface ResidentLeaveProps {
  leave: OwnLeave;
  /** The key the next request is kept under. */
  newLeaveId: string;
  /** The key the next report of a return is kept under. */
  newReportId: string;
  /** The staff list shown below, whose place a page step keeps; or null. */
  staffList: LeaveListParams | null;
}

/**
 * The resident part of Perizinan asrama: "Ajukan izin" beside
 * "Ketentuan", one under the other on a phone, and "Riwayat izin saya"
 * below.
 */
export function ResidentLeavePart({
  leave,
  newLeaveId,
  newReportId,
  staffList,
}: ResidentLeaveProps) {
  return (
    <>
      <div className={styles.sideBySide}>
        <section className={shared.panel}>
          <LeaveForm newLeaveId={newLeaveId} />
        </section>
        <section className={shared.panel}>
          <h2 className={shared.heading}>Ketentuan</h2>
          <LeaveTerms />
        </section>
      </div>
      <section className={shared.panel}>
        <h2 className={shared.heading}>Riwayat izin saya</h2>
        <OwnLeaveView
          leave={leave}
          newReportId={newReportId}
          staffList={staffList}
        />
      </section>
    </>
  );
}

/** Perizinan asrama for a resident: the page head, the tabs and their part. */
export function ResidentLeaveScreen({
  tabs,
  room,
  ...part
}: ResidentLeaveProps & {
  tabs: TabLinksProps;
  /** Where the resident lives, at the top of the tab's content. */
  room: string | null;
}) {
  return (
    <>
      <TabbedHead
        title="Asrama"
        tabs={tabs}
        lede="Ajukan izin keluar asrama atau Izin Tidak Mengikuti Kegiatan (ITMK) dan pantau statusnya."
      />
      <OwnRoomLine room={room} />
      <ResidentLeavePart {...part} />
    </>
  );
}
