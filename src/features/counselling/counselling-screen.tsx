import { PageHead } from "@/ui/page-head";
import type { ConsentView } from "./consent-view";
import styles from "./counselling.module.css";
import { CounsellorConsentPanel } from "./counsellor-consent-panel";
import { OwnConsentBox } from "./own-consent-box";
import { OwnHistoryList } from "./own-history-list";
import { OwnScheduleList } from "./own-schedule-list";
import { RegisterForm } from "./register-form";
import type { ScheduleFilter } from "./schedule-address";
import { SchedulePanel } from "./schedule-panel";
import type {
  OwnHistory,
  OwnScheduleView,
  ScheduleBoard,
} from "./schedule-view";
import { WarnBox } from "./warn-box";

/** What Konselor reads first on Konseling, as the prototype words it. */
export const EMERGENCY_TEXT =
  "Bila mahasiswa menunjukkan risiko menyakiti diri atau orang lain, jangan menunggu jadwal konseling. Dampingi mahasiswa, hubungi tim krisis kampus, dan layanan darurat 119.";

/** What the student reads on Konseling, as the prototype words it. */
export const HELP_TEXT =
  "Jika Anda berpikir untuk menyakiti diri atau berada dalam bahaya, jangan menunggu jadwal: hubungi konselor kampus, orang yang Anda percaya, atau layanan darurat 119.";

/** "Jadwal konseling" of Konselor, with the Status filter it shows. */
export interface CounsellorSchedules {
  board: ScheduleBoard;
  filter: ScheduleFilter;
}

function CounsellorPart({
  mayManageConsent,
  schedules,
}: {
  mayManageConsent: boolean;
  schedules: CounsellorSchedules | null;
}) {
  return (
    <>
      <WarnBox title="Keadaan darurat.">{EMERGENCY_TEXT}</WarnBox>
      {mayManageConsent && <CounsellorConsentPanel />}
      {schedules && (
        <SchedulePanel board={schedules.board} filter={schedules.filter} />
      )}
    </>
  );
}

/** What Konseling shows the student of their own. */
export interface OwnCounselling {
  /** Their consent, or null when never asked. */
  consent: ConsentView | null;
  /** Their registration part, or null when they may not register. */
  registration: OwnRegistration | null;
}

/** What a student who may register sees of their own requests. */
export interface OwnRegistration {
  /** Their active requests, the newest first. */
  schedules: OwnScheduleView[];
  /** "Riwayat": their requests that are over, the latest first. */
  history: OwnHistory;
  /** The first day a request may be for: tomorrow on campus. */
  tomorrow: string;
}

function OwnPart({ own }: { own: OwnCounselling }) {
  return (
    <>
      <WarnBox title="Butuh bantuan segera?">{HELP_TEXT}</WarnBox>
      <OwnConsentBox consent={own.consent} />
      {own.registration && (
        <>
          <RegisterForm tomorrow={own.registration.tomorrow} />
          <OwnScheduleList
            schedules={own.registration.schedules}
            tomorrow={own.registration.tomorrow}
          />
          <OwnHistoryList history={own.registration.history} />
        </>
      )}
    </>
  );
}

/**
 * Konseling: the part of each role of the account that has one, one
 * under the other. A student who is also Konselor sees their own part
 * first.
 */
export function CounsellingScreen({
  own,
  mayManage,
  schedules = null,
}: {
  /** Mahasiswa: their consent, the registration and their requests. */
  own: OwnCounselling | null;
  /** Konselor: the emergency notice and "Persetujuan konseling". */
  mayManage: boolean;
  /** Konselor: "Jadwal konseling", or null for an account without the right. */
  schedules?: CounsellorSchedules | null;
}) {
  const showsCounsellor = mayManage || schedules !== null;
  return (
    <>
      <PageHead title="Konseling" />
      <div className={styles.parts}>
        {own && <OwnPart own={own} />}
        {showsCounsellor && (
          <CounsellorPart mayManageConsent={mayManage} schedules={schedules} />
        )}
      </div>
    </>
  );
}
