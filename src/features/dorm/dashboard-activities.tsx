import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { PressableRow } from "@/ui/pressable-row";
import pressable from "@/ui/pressable-row.module.css";
import styles from "./activities.module.css";
import { activitiesAddress } from "./activities-address";
import { OrganiserBadge, StateBadge } from "./activity-badges";
import { audienceWords, dayWords, hoursWords } from "./activity-words";
import { rateWords } from "./attendance-rate";
import board from "./dashboard.module.css";
import { dashboardAddress } from "./dashboard-address";
import { kehadiranOf, type ShownLine } from "./dashboard-lines";
import type { LinePage } from "./dashboard-view";

export const NO_ACTIVITIES = "Belum ada kegiatan asrama dalam 7 hari terakhir.";

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

function KehadiranCell({ line }: { line: ShownLine }) {
  const kehadiran = kehadiranOf(line);
  if (kehadiran.kind === "state") return <StateBadge state={kehadiran.state} />;
  if (kehadiran.kind === "not_announced") {
    return (
      <span className={`${shared.badge} ${styles.warn}`}>Belum diumumkan</span>
    );
  }
  return <b>{rateWords(kehadiran.rate)}</b>;
}

function ActivityLineRow({
  line,
  address,
}: {
  line: ShownLine;
  address: string;
}) {
  const { activity, attendance } = line;
  return (
    <PressableRow address={address} opens="page">
      <td className={shared.rowHeading} data-title="Kegiatan">
        <Link href={address} className={pressable.open}>
          <b>{activity.name}</b>
        </Link>
        <span className={shared.detail}>
          {audienceWords(activity.audience)}
        </span>
      </td>
      <td data-title="Waktu">
        {dayWords(line.day)}
        <span className={shared.detail}>
          {hoursWords(activity.startTime, activity.endTime)}
        </span>
      </td>
      <td data-title="Penanggung jawab">
        <OrganiserBadge organiser={activity.organiser} />
      </td>
      <td data-title="Peserta">{shown(line.participants)}</td>
      <td data-title="Hadir">
        {attendance === null ? "-" : shown(attendance.present)}
      </td>
      <td data-title="Izin">
        {attendance === null ? "-" : shown(attendance.leave)}
      </td>
      <td data-title="Tidak hadir">
        {attendance === null ? "-" : shown(attendance.absent)}
      </td>
      <td data-title="Kehadiran">
        <KehadiranCell line={line} />
      </td>
    </PressableRow>
  );
}

/**
 * Kehadiran kegiatan: every activity of today and the 7 dates before, the
 * latest first, a page at a time; a card each on a phone. Pressing one
 * opens Jadwal harian of Kegiatan asrama on its date, with the activity
 * chosen in "Penghitungan kehadiran" for an account that counts.
 */
export function DashboardActivities({
  activities,
  today,
  mayCount,
}: {
  activities: LinePage;
  today: string;
  mayCount: boolean;
}) {
  const addressOf = (line: ShownLine) =>
    activitiesAddress(
      {
        view: "harian",
        day: line.day,
        page: 1,
        counted: mayCount ? line.activity.id : null,
      },
      today,
    );
  return (
    <section className={shared.panel}>
      <div className={board.head}>
        <h2 className={shared.heading}>Kehadiran kegiatan</h2>
        <span className={board.sub}>Hari ini dan 7 hari terakhir</span>
      </div>
      {activities.matching === 0 ? (
        <p className={shared.empty}>{NO_ACTIVITIES}</p>
      ) : (
        <>
          <div className={shared.tableWrap}>
            <table className={`${shared.table} ${shared.stacked}`}>
              <thead>
                <tr>
                  <th>Kegiatan</th>
                  <th>Waktu</th>
                  <th>Penanggung jawab</th>
                  <th>Peserta</th>
                  <th>Hadir</th>
                  <th>Izin</th>
                  <th>Tidak hadir</th>
                  <th>Kehadiran</th>
                </tr>
              </thead>
              <tbody>
                {activities.lines.map((line) => (
                  <ActivityLineRow
                    key={`${line.day} ${line.activity.id}`}
                    line={line}
                    address={addressOf(line)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <ListPager
            page={activities.page}
            matching={activities.matching}
            noun="kegiatan"
            keepsPlace
            stepsOnOnePage={false}
            addressOf={dashboardAddress}
          />
        </>
      )}
    </section>
  );
}
