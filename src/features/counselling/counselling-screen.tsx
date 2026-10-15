import { PageHead } from "@/ui/page-head";
import styles from "./counselling.module.css";
import { CounsellorConsentPanel } from "./counsellor-consent-panel";
import { WarnBox } from "./warn-box";

/** What Konselor reads first on Konseling, as the prototype words it. */
export const EMERGENCY_TEXT =
  "Bila mahasiswa menunjukkan risiko menyakiti diri atau orang lain, jangan menunggu jadwal konseling. Dampingi mahasiswa, hubungi tim krisis kampus, dan layanan darurat 119.";

function CounsellorPart() {
  return (
    <>
      <WarnBox title="Keadaan darurat.">{EMERGENCY_TEXT}</WarnBox>
      <CounsellorConsentPanel />
    </>
  );
}

/**
 * Konseling: the part of each role of the account that has one, one
 * under the other.
 */
export function CounsellingScreen({
  mayManage,
}: {
  /** Konselor: the emergency notice and "Persetujuan konseling". */
  mayManage: boolean;
}) {
  return (
    <>
      <PageHead title="Konseling" />
      <div className={styles.parts}>{mayManage && <CounsellorPart />}</div>
    </>
  );
}
