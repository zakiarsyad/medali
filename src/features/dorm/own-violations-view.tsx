import { DORM_NAMES } from "@/dorms/dorms";
import { AutoSubmitForm } from "@/ui/auto-submit-form";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import { AnnouncementPanel } from "./announcement-panel";
import type { OwnViolations } from "./own-violations";
import {
  ALL_PERIODS,
  type OwnViolationParams,
  ownViolationsAddress,
  VIOLATIONS_ADDRESS,
} from "./violation-address";
import { VIOLATIONS_PAGE_SIZE } from "./violation-ids";
import { AnnouncedTable } from "./violation-lists";
import styles from "./violations.module.css";

export const NO_OWN_VIOLATIONS = "Tidak ada pelanggaran pada periode ini.";

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
  params,
}: {
  own: Shown;
  params: OwnViolationParams;
}) {
  const shown = own.shownPeriod === "all" ? ALL_PERIODS : own.shownPeriod;
  return (
    <AutoSubmitForm action={VIOLATIONS_ADDRESS}>
      {keptBeside(params, { periodId: null, page: 1 }).map(([name, value]) => (
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

function HistoryPanel({
  own,
  params,
  now,
}: {
  own: Shown;
  params: OwnViolationParams;
  now: Date;
}) {
  const { history } = own;
  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <div>
          <h2 className={shared.heading}>Rekam jejak pelanggaran saya</h2>
          <p className={styles.sub}>
            Pelanggaran yang sudah diumumkan atas nama Anda
          </p>
        </div>
        <PeriodChoice own={own} params={params} />
      </div>
      {history.rows.length === 0 ? (
        <p className={shared.empty}>{NO_OWN_VIOLATIONS}</p>
      ) : (
        <AnnouncedTable
          rows={history.rows}
          now={now}
          reader="resident"
          withStudent={false}
        />
      )}
      {history.matching > 0 && (
        <ListPager
          page={history.page}
          matching={history.matching}
          pageSize={VIOLATIONS_PAGE_SIZE}
          noun="pelanggaran"
          keepsPlace
          stepsOnOnePage={false}
          addressOf={(page) => ownViolationsAddress({ ...params, page })}
        />
      )}
    </section>
  );
}

/**
 * Pelanggaran for a resident: "Pelanggaran tercatat" of the running
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
  /** Where the resident lives, as the Asrama page header says it. */
  room: string | null;
  own: Shown;
  params: OwnViolationParams;
  now: Date;
}) {
  return (
    <>
      <PageHead title="Pelanggaran">{room}</PageHead>
      <TabLinks {...tabs} />
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
      </NumberCards>
      <HistoryPanel own={own} params={params} now={now} />
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
