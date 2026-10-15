import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { AppealCards } from "./appeal-cards";
import type { AppealInbox } from "./appeal-inbox";
import {
  type StaffViolationParams,
  staffViolationsAddress,
} from "./violation-address";
import { VIOLATIONS_PAGE_SIZE } from "./violation-ids";
import styles from "./violations.module.css";

export const NO_WAITING_APPEALS = "Tidak ada advokasi yang menunggu.";

/**
 * "Advokasi masuk" for BAM - BPHK and BAM - KI: how many appeals wait,
 * and their cards, 20 a page.
 */
export function AppealInboxPanel({
  inbox,
  params,
  ownStudentId,
}: {
  inbox: AppealInbox;
  params: StaffViolationParams;
  ownStudentId: string | null;
}) {
  const look = inbox.waiting > 0 ? styles.warn : undefined;
  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <div>
          <h2 className={shared.heading}>Advokasi masuk</h2>
          <p className={styles.sub}>
            Diterima: pelanggaran tidak dihitung. Ditolak: pelanggaran naik ke
            Pengelola Asrama.
          </p>
        </div>
        <span className={`${shared.badge} ${look ?? ""}`}>
          {inbox.waiting} menunggu
        </span>
      </div>
      {inbox.cards.length === 0 ? (
        <p className={shared.empty}>{NO_WAITING_APPEALS}</p>
      ) : (
        // Made anew for each page, so an answer shown on one is not kept on another.
        <AppealCards
          key={inbox.page}
          cards={inbox.cards}
          ownStudentId={ownStudentId}
        />
      )}
      {inbox.waiting > 0 && (
        <ListPager
          page={inbox.page}
          matching={inbox.waiting}
          pageSize={VIOLATIONS_PAGE_SIZE}
          noun="advokasi"
          keepsPlace
          stepsOnOnePage={false}
          addressOf={(page) =>
            staffViolationsAddress({ ...params, appealPage: page })
          }
        />
      )}
    </section>
  );
}
