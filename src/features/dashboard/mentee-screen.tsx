import { PageHead } from "@/ui/page-head";
import { AchievementSection } from "./achievement-section";
import styles from "./dashboard.module.css";
import { KIND_TITLES } from "./dashboard-kind";
import { GradeSection } from "./grade-section";
import { MenteeAttentionPanel } from "./mentee-attention-panel";
import { MenteeCardsRow } from "./mentee-cards-row";
import { MenteeMentalSection } from "./mentee-mental-section";
import { MenteeNotesPanel } from "./mentee-notes-panel";
import { MenteeProgressBox, type ProgressLinks } from "./mentee-progress-box";
import type { MenteeDashboard } from "./mentee-recap";
import {
  MENTEES_NOT_ASSESSED,
  menteeLede,
  NO_GROUP_HELD,
} from "./mentee-words";
import { PhysicalSection } from "./physical-section";

/** Where the links of Dashboard anak asuh lead, or null for a tab the account may not open. */
export interface MenteeLinks extends ProgressLinks {
  notes: string | null;
  /** "Lihat rincian" of section 1: Penilaian > Asesmen karakter. */
  assessment: string | null;
  /** "Lihat rincian" of section 2: Penilaian > Penilaian karakter. */
  grade: string | null;
  /** "Lihat rincian" of section 3: Penilaian > Penilaian jasmani. */
  fitness: string | null;
  /** "Lihat rincian" of section 4: Penilaian > Kesehatan mental. */
  mental: string | null;
}

/** Dashboard anak asuh, for Pengasuh: only their own anak asuh. */
export function MenteeScreen({
  view,
  links,
}: {
  view: MenteeDashboard;
  links: MenteeLinks;
}) {
  if (view.kind === "no_group") {
    return <PageHead title={KIND_TITLES.mentees}>{NO_GROUP_HELD}</PageHead>;
  }
  return (
    <>
      <PageHead title={KIND_TITLES.mentees}>{menteeLede(view)}</PageHead>
      <MenteeProgressBox progress={view.progress} links={links} />
      <MenteeCardsRow cards={view.cards} />
      <div className={styles.panels}>
        <MenteeAttentionPanel rows={view.attention} />
        <MenteeNotesPanel
          notes={view.notes}
          numbers={view.noteNumbers}
          writeAddress={links.notes}
        />
      </div>
      <AchievementSection
        recap={view.cards.achievement}
        detailAddress={links.assessment}
        line="Nilai MEDALI hasil asesmen anak asuh."
        emptyWords={MENTEES_NOT_ASSESSED}
      />
      <GradeSection grades={view.cards.grades} detailAddress={links.grade} />
      <PhysicalSection
        recap={view.cards.physical}
        limits={view.fitnessLimits}
        detailAddress={links.fitness}
        line="Kategori kesehatan fisik anak asuh dari uji kesehatan dan riwayat penyakit."
      />
      <MenteeMentalSection
        published={view.cards.published}
        detailAddress={links.mental}
      />
    </>
  );
}
