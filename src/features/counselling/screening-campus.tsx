import shared from "@/ui/data-screen.module.css";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import styles from "./counselling.module.css";
import type { SharedNumbers } from "./shared-view";

/** What the staff who see only the campus count read under it. */
export const PERSONAL_DATA_NOTE =
  "Data kesehatan mental perorangan hanya tampil bila konselor mempublikasikannya dengan persetujuan mahasiswa. Angka di atas adalah rekap anonim seluruh kampus. Catatan sesi konseling tidak pernah dibagikan.";

/**
 * "Sudah diasesmen" for the whole campus, as the server sent it, "<5"
 * for 1 to 4, with the note on personal data. A recipient of shared
 * data also sees "Dipublikasikan untuk Anda" and "Sesi konseling 30
 * hari" beside it.
 */
export function CampusScreenedCount({
  shown,
  shared: numbers = null,
}: {
  shown: string;
  shared?: SharedNumbers | null;
}) {
  return (
    <>
      <NumberCards>
        {numbers && (
          <NumberCard
            label="Dipublikasikan untuk Anda"
            amount={numbers.forYou}
            note={numbers.menteesOnly ? "anak asuh" : "mahasiswa"}
          />
        )}
        <NumberCard
          label="Sudah diasesmen"
          amount={shown}
          note="seluruh kampus, anonim"
        />
        {numbers && (
          <NumberCard
            label="Sesi konseling 30 hari"
            amount={numbers.sessions}
            note="seluruh kampus, anonim"
          />
        )}
      </NumberCards>
      <section className={shared.panel}>
        <p className={styles.sub}>{PERSONAL_DATA_NOTE}</p>
      </section>
    </>
  );
}
