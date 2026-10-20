import type { ReactNode } from "react";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import styles from "./counselling.module.css";
import { EMERGENCY_TEXT } from "./counselling-screen";
import type { ScreeningParams } from "./screening-address";
import { ScreeningListPanel } from "./screening-list";
import type { ScreeningList, ScreeningNumbers } from "./screening-view";
import { WarnBox } from "./warn-box";

/** What Konselor sees of the screenings. */
export interface CounsellorScreenings {
  numbers: ScreeningNumbers;
  list: ScreeningList;
  params: ScreeningParams;
}

function CounsellorNumbers({ numbers }: { numbers: ScreeningNumbers }) {
  return (
    <NumberCards>
      <NumberCard
        label="Sudah diasesmen"
        amount={numbers.screened}
        note="mahasiswa"
      />
      <NumberCard
        label="Perlu konseling"
        amount={numbers.needCounselling}
        note="tingkat sedang ke atas"
      />
      <NumberCard
        label="Menunggu persetujuan"
        amount={numbers.waitingConsent}
        note="mahasiswa yang sudah diasesmen"
      />
    </NumberCards>
  );
}

/**
 * Penilaian > Kesehatan mental: "Keadaan darurat" for everyone, then for
 * Konselor the numbers, the screening form and "Daftar mahasiswa", and
 * for the other roles what they may see.
 */
export function ScreeningScreen({
  tabs,
  counsellor,
  form = null,
  others = null,
}: {
  tabs: TabLinksProps;
  /** Konselor's numbers and list, or null for an account without the right. */
  counsellor: CounsellorScreenings | null;
  /** "Asesmen kesehatan mental", for Konselor. */
  form?: ReactNode;
  /** What the other roles that open the tab see. */
  others?: ReactNode;
}) {
  return (
    <>
      <PageHead title="Kesehatan mental">
        Asesmen kesehatan mental yang ditindaklanjuti konseling oleh konselor.
        Data perorangan hanya dibagikan bila konselor mempublikasikannya dengan
        persetujuan mahasiswa.
      </PageHead>
      <TabLinks {...tabs} />
      <div className={styles.parts}>
        <WarnBox title="Keadaan darurat.">{EMERGENCY_TEXT}</WarnBox>
        {counsellor && (
          <>
            <CounsellorNumbers numbers={counsellor.numbers} />
            {form}
            <ScreeningListPanel
              list={counsellor.list}
              params={counsellor.params}
            />
          </>
        )}
        {others}
      </div>
    </>
  );
}
