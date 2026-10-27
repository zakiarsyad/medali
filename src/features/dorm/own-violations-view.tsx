import { DORM_NAMES } from "@/dorms/dorms";
import { AutoSubmitForm } from "@/ui/auto-submit-form";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import type { TabLinksProps } from "@/ui/tab-links";
import { TabbedHead } from "@/ui/tabbed-head";
import { AnnouncementPanel } from "./announcement-panel";
import { OwnRoomLine } from "./own-room-line";
import { OwnViolationTable } from "./own-violation-table";
import type { OwnRecordData, OwnViolations } from "./own-violations";
import { OwnWarningBoxes, WarningProgressCard } from "./own-warning-view";
import {
  ALL_PERIODS,
  type OwnViolationParams,
  ownViolationsAddress,
  VIOLATIONS_ADDRESS,
} from "./violation-address";
import { APPEAL_HOURS, VIOLATIONS_PAGE_SIZE } from "./violation-ids";
import styles from "./violations.module.css";

export const NO_OWN_VIOLATIONS = "Belum ada pelanggaran pada periode ini.";

type Shown = Extract<OwnViolations, { kind: "shown" }>;

/** The parts of the address a new choice of one list keeps of the other. */
function keptBeside(
  params: OwnViolationParams,
  dropped: Partial<OwnViolationParams>,
): [string, string][] {
  const address = ownViolationsAddress({ ...params, ...dropped });
  return [...new URL(address, "http://medali").searchParams.entries()];
}

function PeriodChoice({
  own,
  keep,
}: {
  own: OwnRecordData;
  keep: [string, string][];
}) {
  const shown = own.shownPeriod === "all" ? ALL_PERIODS : own.shownPeriod;
  return (
    <AutoSubmitForm action={VIOLATIONS_ADDRESS}>
      {keep.map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <select
        name="periode"
        className={shared.input}
        aria-label="Periode"
        defaultValue={shown}
      >
        <option value={ALL_PERIODS}>Semua periode</option>
        {own.periods.map((each) => (
          <option key={each.id} value={each.id}>
            {each.title}
          </option>
        ))}
      </select>
    </AutoSubmitForm>
  );
}

/**
 * The resident's own record: their call and SPs, "Pelanggaran
 * tercatat", "Menuju panggilan SP 1" or "Menuju SP 2", "Dalam masa
 * advokasi" and "Advokasi diterima", and "Rekam jejak pelanggaran saya"
 * with its period and "Ajukan advokasi". `keep` holds the other parts of
 * the address, which a new period keeps; `addressOfPage` gives the
 * address of a page of the record.
 */
export function OwnRecord({
  own,
  now,
  keep,
  addressOfPage,
  title = null,
}: {
  own: OwnRecordData;
  now: Date;
  keep: [string, string][];
  addressOfPage: (page: number) => string;
  /** A heading above the numbers, where other numbers stand on the same screen. */
  title?: string | null;
}) {
  const { history } = own;
  return (
    <>
      {title !== null && (
        <h2 className={`${shared.heading} ${styles.spaced}`}>{title}</h2>
      )}
      {own.warning !== null && <OwnWarningBoxes warning={own.warning} />}
      <NumberCards>
        <NumberCard
          label="Pelanggaran tercatat"
          amount={own.recorded}
          note={
            own.semester === null
              ? "belum ada periode akademik"
              : `semester ${own.semester.title}`
          }
        />
        {own.warning !== null && <WarningProgressCard warning={own.warning} />}
        <NumberCard
          label="Dalam masa advokasi"
          amount={own.inAppeal}
          note={`batas ${APPEAL_HOURS} jam setelah diumumkan`}
        />
        <NumberCard
          label="Advokasi diterima"
          amount={own.accepted}
          note="tidak dihitung"
        />
      </NumberCards>
      <section className={shared.panel}>
        <div className={styles.panelHead}>
          <div>
            <h2 className={shared.heading}>Rekam jejak pelanggaran saya</h2>
            <p className={styles.sub}>
              Pelanggaran yang sudah diumumkan atas nama Anda
            </p>
          </div>
          <PeriodChoice own={own} keep={keep} />
        </div>
        {history.rows.length === 0 ? (
          <p className={shared.empty}>{NO_OWN_VIOLATIONS}</p>
        ) : (
          <OwnViolationTable rows={history.rows} now={now} />
        )}
        {history.matching > 0 && (
          <ListPager
            page={history.page}
            matching={history.matching}
            pageSize={VIOLATIONS_PAGE_SIZE}
            noun="pelanggaran"
            keepsPlace
            stepsOnOnePage={false}
            addressOf={addressOfPage}
          />
        )}
      </section>
    </>
  );
}

/**
 * Pelanggaran asrama for a resident: "Pelanggaran tercatat" of the running
 * semester, "Rekam jejak pelanggaran saya" with its period, and
 * "Pengumuman pelanggaran" of the dorm they live in.
 */
export function OwnViolationsView({
  tabs,
  room,
  own,
  params,
  now,
}: {
  tabs: TabLinksProps;
  /** Where the resident lives, at the top of the tab's content. */
  room: string | null;
  own: Shown;
  params: OwnViolationParams;
  now: Date;
}) {
  return (
    <>
      <TabbedHead title="Asrama" tabs={tabs} />
      <OwnRoomLine room={room} />
      <OwnRecord
        own={own}
        now={now}
        keep={keptBeside(params, { periodId: null, page: 1 })}
        addressOfPage={(page) => ownViolationsAddress({ ...params, page })}
      />
      <AnnouncementPanel
        announcement={own.announcement}
        now={now}
        reader="resident"
        lede={`Pelanggaran penghuni ${DORM_NAMES[own.dorm]} yang sudah diumumkan, per hari`}
        keep={keptBeside(params, { day: null, announcementPage: 1 })}
        addressOfPage={(page) =>
          ownViolationsAddress({
            ...params,
            day: own.announcement.day,
            announcementPage: page,
          })
        }
      />
    </>
  );
}
