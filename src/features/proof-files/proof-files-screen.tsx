import { campusDay } from "@/academic-periods/campus-day";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import { database } from "@/db/database";
import shared from "@/ui/data-screen.module.css";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import { NOT_SET_WORDS } from "./keep-days";
import { KeepDaysForm } from "./keep-days-form";
import { ProofCountTable } from "./proof-count-table";
import { countProofs } from "./proof-counts";
import { RemoveOldButton } from "./remove-old-button";
import { readSentGroups } from "./sent-groups";
import { readKeepDays } from "./stored-keep-days";

function KeepingNote({ keepDays }: { keepDays: number | null }) {
  if (keepDays === null) {
    return <p className={shared.detail}>{NOT_SET_WORDS}</p>;
  }
  return (
    <p className={shared.detail}>
      Berkas dapat dihapus setelah keputusannya final dan {keepDays} hari
      setelah periode akademik tempat berkas dikirim berakhir.
    </p>
  );
}

export async function ProofFilesScreen({ tabs }: { tabs: TabLinksProps }) {
  const db = database();
  const [keepDays, periods, groups] = await Promise.all([
    readKeepDays(db),
    readAcademicPeriods(db),
    readSentGroups(db),
  ]);
  const counts = countProofs(groups, { keepDays, periods, today: campusDay() });
  return (
    <>
      <PageHead title="Berkas bukti">
        Foto bukti dan lampiran yang sudah tidak diperlukan dapat dihapus.
        Status, keputusan, dan siapa yang memutuskan tetap tersimpan.
      </PageHead>
      <TabLinks {...tabs} />
      <section className={shared.panel}>
        <h2 className={shared.heading}>Lama simpan berkas bukti</h2>
        <KeepingNote keepDays={keepDays} />
        <KeepDaysForm keepDays={keepDays} />
      </section>
      <section className={shared.panel}>
        <h2 className={shared.heading}>Berkas tersimpan</h2>
        <ProofCountTable counts={counts} />
        <RemoveOldButton
          removable={counts.removable}
          isSet={keepDays !== null}
        />
      </section>
    </>
  );
}
