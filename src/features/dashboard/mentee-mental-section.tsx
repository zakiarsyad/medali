import styles from "./dashboard.module.css";
import { MENTAL_SECTION } from "./mental-card";
import { PublishedPanel } from "./mental-published";
import type { PublishedMental } from "./mental-recap";
import { MENTEES_NOTHING_PUBLISHED } from "./mentee-words";
import { SectionHead } from "./section-head";

/**
 * Section 4 of Dashboard anak asuh: only "Kesehatan mental anak asuh",
 * the records published to the Pengasuh with the student's consent, and
 * no anonymous count. `detailAddress` leads to Penilaian > Kesehatan
 * mental, for an account that may open it.
 */
export function MenteeMentalSection({
  published,
  detailAddress,
}: {
  published: PublishedMental;
  detailAddress: string | null;
}) {
  return (
    <section className={styles.section} aria-labelledby={MENTAL_SECTION}>
      <SectionHead
        number={4}
        id={MENTAL_SECTION}
        title="Kesehatan mental"
        detailAddress={detailAddress}
      >
        Hanya data yang dipublikasikan konselor dengan persetujuan anak asuh.
      </SectionHead>
      <PublishedPanel
        published={published}
        detailAddress={detailAddress}
        title="Kesehatan mental anak asuh"
        emptyWords={MENTEES_NOTHING_PUBLISHED}
        namesMentor={false}
      />
    </section>
  );
}
