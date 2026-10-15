import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import { APPEAL_HOURS } from "./violation-ids";
import styles from "./violations.module.css";

export const READ_ONLY_NOTE =
  "Pelanggaran dicatat oleh Badan Asrama Mahasiswa. Anda dapat melihat rekap dan rinciannya.";

/**
 * Pelanggaran for staff: "Input dan publikasi pelanggaran" for those who
 * record, and a note for those who only read.
 */
export function StaffViolationsScreen({
  tabs,
  form,
}: {
  tabs: TabLinksProps;
  /** "Input dan publikasi pelanggaran", or null for an account that only reads. */
  form: ReactNode;
}) {
  return (
    <>
      <PageHead title="Pelanggaran">
        Pelanggaran tata tertib asrama yang diumumkan Badan Asrama Mahasiswa
        pada jam yang ditentukan. Setelah diumumkan ada masa advokasi{" "}
        {APPEAL_HOURS} jam; setelah itu pelanggaran naik ke Pengelola Asrama.
      </PageHead>
      <TabLinks {...tabs} />
      {form === null ? (
        <p className={styles.note}>{READ_ONLY_NOTE}</p>
      ) : (
        <section className={shared.panel}>{form}</section>
      )}
    </>
  );
}
