import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import type { DormHealthList, DormHealthNumbersOnly } from "./dorm-health";
import styles from "./dorm-health.module.css";
import type { DormHealthParams } from "./dorm-health-address";
import { DormHealthCountCards } from "./dorm-health-counts-view";
import { DormHealthListPanel, DormHealthNumbers } from "./dorm-health-list";
import { DORM_HEALTH_LEDE } from "./dorm-health-words";

/**
 * Asrama > Kesehatan, in the prototype's order: the numbers, "Catatan
 * kesehatan" with its form or the note of who fills it, and "Mahasiswa
 * asrama yang sakit". An account that may read the list sees its numbers
 * and the list; one that sees numbers only gets them held back, with no
 * list.
 */
export function DormHealthScreen({
  tabs,
  found,
  counts = null,
  params,
  form,
  readOnlyNote,
}: {
  tabs: TabLinksProps;
  /** Null for an account without the right to read the list. */
  found: DormHealthList | null;
  /** The numbers alone, for an account that may not read the list. */
  counts?: DormHealthNumbersOnly | null;
  params: DormHealthParams;
  /** The form for the writers; null for the others. */
  form: ReactNode;
  /** What an account without the form is told instead of it. */
  readOnlyNote: string;
}) {
  return (
    <>
      <PageHead title="Kesehatan">{DORM_HEALTH_LEDE}</PageHead>
      <TabLinks {...tabs} />
      {found && <DormHealthNumbers found={found} />}
      {counts && <DormHealthCountCards found={counts} />}
      <section className={shared.panel}>
        <h2 className={shared.heading}>Catatan kesehatan</h2>
        {form ?? <p className={styles.readOnly}>{readOnlyNote}</p>}
      </section>
      {found && <DormHealthListPanel found={found} params={params} />}
    </>
  );
}
