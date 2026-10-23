import { NumberCard, NumberCards } from "@/ui/number-cards";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import { attendanceRate, rateWords } from "./attendance-rate";
import board from "./dashboard.module.css";
import { DashboardActivities } from "./dashboard-activities";
import { AttendanceBars } from "./dashboard-bars";
import type { DormHealthPanels } from "./dashboard-health";
import { LeavePanel } from "./dashboard-leave-panel";
import { MentalHealthPanel } from "./dashboard-mental-panel";
import { PhysicalHealthPanel } from "./dashboard-physical-panel";
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
        note={attendanceNote(overall)}
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
  health,
  mayCount,
}: {
  tabs: TabLinksProps;
  view: DashboardView;
  health: DormHealthPanels;
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
      <div className={board.parts}>
        <AttendanceBars
          byOrganiser={view.byOrganiser}
          byDorm={view.byDorm}
          residents={view.residents}
          overall={view.overall}
        />
        <LeavePanel
          byKind={view.monthLeave}
          out={view.out}
          outCount={view.leave.out}
        />
      </div>
      <HealthPanels health={health} />
    </>
  );
}

/** The health panels, below the rest, for an account that may see one. */
function HealthPanels({ health }: { health: DormHealthPanels }) {
  const { physical, mental } = health;
  if (physical === null && mental === null) return null;
  return (
    <div className={board.parts}>
      {physical !== null && <PhysicalHealthPanel physical={physical} />}
      {mental !== null && <MentalHealthPanel mental={mental} />}
    </div>
  );
}
