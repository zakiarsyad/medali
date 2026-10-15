import { NumberCard, NumberCards } from "@/ui/number-cards";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import { attendanceRate, rateWords } from "./attendance-rate";
import { DashboardActivities } from "./dashboard-activities";
import type { DashboardView } from "./dashboard-view";
import {
  attendanceNote,
  outNote,
  residentsNote,
  totalResidents,
} from "./dashboard-words";

function DashboardNumbers({ view }: { view: DashboardView }) {
  const { residents, leave, overall } = view;
  const { present, absent } = overall.attendance;
  return (
    <NumberCards>
      <NumberCard
        label="Penghuni asrama"
        amount={totalResidents(residents)}
        note={residentsNote(residents)}
      />
      <NumberCard
        label="Sedang di luar asrama"
        amount={leave.out}
        note={outNote(leave.outLate)}
      />
      <NumberCard
        label="Izin menunggu verifikasi"
        amount={leave.waiting}
        note="pengajuan"
      />
      <NumberCard
        label="Kehadiran 7 hari terakhir"
        amount={rateWords(attendanceRate(present, present + absent))}
        note={attendanceNote(overall.activities)}
      />
    </NumberCards>
  );
}

/**
 * Dashboard asrama: how the dorms are doing today, among the students the
 * account may see. Nobody changes anything here.
 */
export function DashboardScreen({
  tabs,
  view,
  mayCount,
}: {
  tabs: TabLinksProps;
  view: DashboardView;
  /** Whether the account counts the attendance, for the link of a row. */
  mayCount: boolean;
}) {
  return (
    <>
      <PageHead title="Dashboard asrama">
        Rekap kegiatan dan perizinan penghuni Asrama Wismantara, Dana Rakca, dan
        Cipta Bakti.
      </PageHead>
      <TabLinks {...tabs} />
      <DashboardNumbers view={view} />
      <DashboardActivities
        activities={view.activities}
        today={view.today}
        mayCount={mayCount}
      />
    </>
  );
}
