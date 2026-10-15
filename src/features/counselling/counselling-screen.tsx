import { PageHead } from "@/ui/page-head";
import type { ConsentView } from "./consent-view";
import styles from "./counselling.module.css";
import { CounsellorConsentPanel } from "./counsellor-consent-panel";
import { OwnConsentBox } from "./own-consent-box";
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

function OwnPart({ consent }: { consent: ConsentView | null }) {
  return (
    <>
      <WarnBox title="Butuh bantuan segera?">{HELP_TEXT}</WarnBox>
      <OwnConsentBox consent={consent} />
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
  /** Mahasiswa: their own consent, or null when never asked. */
  own: { consent: ConsentView | null } | null;
  /** Konselor: the emergency notice and "Persetujuan konseling". */
  mayManage: boolean;
}) {
  return (
    <>
      <PageHead title="Konseling" />
      <div className={styles.parts}>
        {own && <OwnPart consent={own.consent} />}
        {mayManage && <CounsellorPart />}
      </div>
    </>
  );
}
