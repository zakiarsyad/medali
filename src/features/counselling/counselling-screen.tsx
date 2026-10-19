import { PageHead } from "@/ui/page-head";
import type { ConsentView } from "./consent-view";
import styles from "./counselling.module.css";
import { CounsellorConsentPanel } from "./counsellor-consent-panel";
import { OwnConsentBox } from "./own-consent-box";
import { OwnScheduleList } from "./own-schedule-list";
import { RegisterForm } from "./register-form";
import type { OwnScheduleView } from "./schedule-view";
import { WarnBox } from "./warn-box";

/** What Konselor reads first on Konseling, as the prototype words it. */
export const EMERGENCY_TEXT =
  "Bila mahasiswa menunjukkan risiko menyakiti diri atau orang lain, jangan menunggu jadwal konseling. Dampingi mahasiswa, hubungi tim krisis kampus, dan layanan darurat 119.";

/** What the student reads on Konseling, as the prototype words it. */
export const HELP_TEXT =
  "Jika Anda berpikir untuk menyakiti diri atau berada dalam bahaya, jangan menunggu jadwal: hubungi konselor kampus, orang yang Anda percaya, atau layanan darurat 119.";

function CounsellorPart() {
  return (
    <>
      <WarnBox title="Keadaan darurat.">{EMERGENCY_TEXT}</WarnBox>
      <CounsellorConsentPanel />
    </>
  );
}

/** What Konseling shows the student of their own. */
export interface OwnCounselling {
  /** Their consent, or null when never asked. */
  consent: ConsentView | null;
  /** Their active requests, the newest first. */
  schedules: OwnScheduleView[];
  /** The first day a request may be for: tomorrow on campus. */
  tomorrow: string;
}

function OwnPart({ own }: { own: OwnCounselling }) {
  return (
    <>
      <WarnBox title="Butuh bantuan segera?">{HELP_TEXT}</WarnBox>
      <OwnConsentBox consent={own.consent} />
      <RegisterForm tomorrow={own.tomorrow} />
      <OwnScheduleList schedules={own.schedules} />
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
}: {
  /** Mahasiswa: their consent, the registration and their requests. */
  own: OwnCounselling | null;
  /** Konselor: the emergency notice and "Persetujuan konseling". */
  mayManage: boolean;
}) {
  return (
    <>
      <PageHead title="Konseling" />
      <div className={styles.parts}>
        {own && <OwnPart own={own} />}
        {mayManage && <CounsellorPart />}
      </div>
    </>
  );
}
