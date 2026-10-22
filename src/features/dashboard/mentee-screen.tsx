import { PageHead } from "@/ui/page-head";
import styles from "./dashboard.module.css";
import { KIND_TITLES } from "./dashboard-kind";
import { MenteeAttentionPanel } from "./mentee-attention-panel";
import { MenteeCardsRow } from "./mentee-cards-row";
import { MenteeNotesPanel } from "./mentee-notes-panel";
import { MenteeProgressBox, type ProgressLinks } from "./mentee-progress-box";
import type { MenteeDashboard } from "./mentee-recap";
import { menteeLede, NO_GROUP_HELD } from "./mentee-words";

/** Where the links of Dashboard anak asuh lead, or null for a tab the account may not open. */
export interface MenteeLinks extends ProgressLinks {
  notes: string | null;
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
    </>
  );
}
