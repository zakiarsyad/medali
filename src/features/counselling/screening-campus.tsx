import shared from "@/ui/data-screen.module.css";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import styles from "./counselling.module.css";

/** What the staff who see only the campus count read under it. */
export const PERSONAL_DATA_NOTE =
  "Data kesehatan mental perorangan hanya tampil bila konselor mempublikasikannya dengan persetujuan mahasiswa. Angka di atas adalah rekap anonim seluruh kampus. Catatan sesi konseling tidak pernah dibagikan.";

/**
 * "Sudah diasesmen" for the whole campus, as the server sent it, "<5"
 * for 1 to 4, with the note on personal data.
 */
export function CampusScreenedCount({ shown }: { shown: string }) {
  return (
    <>
      <NumberCards>
        <NumberCard
          label="Sudah diasesmen"
          amount={shown}
          note="seluruh kampus, anonim"
        />
      </NumberCards>
      <section className={shared.panel}>
        <p className={styles.sub}>{PERSONAL_DATA_NOTE}</p>
      </section>
    </>
  );
}
