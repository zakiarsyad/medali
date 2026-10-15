import { AutoSubmitForm } from "@/ui/auto-submit-form";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { ListPager } from "@/ui/list-pager";
import { VIOLATIONS_ADDRESS } from "./violation-address";
import type { Announcement } from "./violation-announcement";
import { VIOLATIONS_PAGE_SIZE } from "./violation-ids";
import { AnnouncedTable, type ListReader } from "./violation-lists";
import styles from "./violations.module.css";

export const NOTHING_ANNOUNCED = "Belum ada pelanggaran yang diumumkan.";

/** Where the parts of the address that are not the day are kept. */
function KeptFields({ keep }: { keep: [string, string][] }) {
  return keep.map(([name, value]) => (
    <input key={name} type="hidden" name={name} value={value} />
  ));
}

/** The violation days to choose from, each with how many it holds. */
function DayChoice({
  announcement,
  keep,
}: {
  announcement: Announcement;
  keep: [string, string][];
}) {
  if (announcement.day === null) return null;
  return (
    <AutoSubmitForm action={VIOLATIONS_ADDRESS}>
      <KeptFields keep={keep} />
      <select
        name="tgl"
        className={shared.input}
        aria-label="Tanggal"
        defaultValue={announcement.day}
      >
        {announcement.days.map((each) => (
          <option key={each.day} value={each.day}>
            {shownDay(each.day)} · {each.count} pelanggaran
          </option>
        ))}
      </select>
    </AutoSubmitForm>
  );
}

/**
 * "Pengumuman pelanggaran": the violations announced on one violation
 * day, chosen from every day that has any, 20 a page. `keep` holds the
 * other parts of the address, which a new day keeps.
 */
export function AnnouncementPanel({
  announcement,
  now,
  reader,
  lede,
  keep,
  addressOfPage,
}: {
  announcement: Announcement;
  now: Date;
  reader: ListReader;
  lede: string;
  keep: [string, string][];
  addressOfPage: (page: number) => string;
}) {
  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <div>
          <h2 className={shared.heading}>Pengumuman pelanggaran</h2>
          <p className={styles.sub}>{lede}</p>
        </div>
        <DayChoice announcement={announcement} keep={keep} />
      </div>
      {announcement.rows.length === 0 ? (
        <p className={shared.empty}>{NOTHING_ANNOUNCED}</p>
      ) : (
        <AnnouncedTable
          rows={announcement.rows}
          now={now}
          reader={reader}
          withStudent
        />
      )}
      {announcement.matching > 0 && (
        <ListPager
          page={announcement.page}
          matching={announcement.matching}
          pageSize={VIOLATIONS_PAGE_SIZE}
          noun="pelanggaran"
          keepsPlace
          stepsOnOnePage={false}
          addressOf={addressOfPage}
        />
      )}
    </section>
  );
}
