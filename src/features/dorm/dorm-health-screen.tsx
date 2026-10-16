import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import type { DormHealthList } from "./dorm-health";
import styles from "./dorm-health.module.css";
import type { DormHealthParams } from "./dorm-health-address";
import { DormHealthListPanel, DormHealthNumbers } from "./dorm-health-list";
import { DORM_HEALTH_LEDE } from "./dorm-health-words";

/**
 * Asrama > Kesehatan, in the prototype's order: the numbers, "Catatan
 * kesehatan" with its form or the note of who fills it, and "Mahasiswa
 * asrama yang sakit". The numbers and the list show only to an account
 * that may read the list.
 */
export function DormHealthScreen({
  tabs,
  found,
  params,
  form,
  readOnlyNote,
}: {
  tabs: TabLinksProps;
  /** Null for an account without the right to read the list. */
  found: DormHealthList | null;
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
      <section className={shared.panel}>
        <h2 className={shared.heading}>Catatan kesehatan</h2>
        {form ?? <p className={styles.readOnly}>{readOnlyNote}</p>}
      </section>
      {found && <DormHealthListPanel found={found} params={params} />}
    </>
  );
}
