import { database } from "@/db/database";
import shared from "@/ui/data-screen.module.css";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import { dayWords } from "./activity-words";
import styles from "./cleaning.module.css";
import type { CleaningParams } from "./cleaning-address";
import { CleaningDaySwitch } from "./cleaning-day-switch";
import { CleaningPlacesBoard, type DormPlaces } from "./cleaning-places-board";
import { isChangeable, placeRows } from "./cleaning-rows";
import { CleaningScheduleBoard } from "./cleaning-schedule-board";
import { CleaningSwitch } from "./cleaning-switch";
import { type CleaningView, loadCleaning } from "./cleaning-view";

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

function CleaningNumber({
  label,
  amount,
  note,
}: {
  label: string;
  amount: number;
  note: string;
}) {
  return (
    <div className={styles.number}>
      <dt className={styles.numberLabel}>{label}</dt>
      <dd className={styles.numberValue}>{shown(amount)}</dd>
      <dd className={styles.numberNote}>{note}</dd>
    </div>
  );
}

function CleaningNumbers({ view, day }: { view: CleaningView; day: string }) {
  const rooms = view.schedules.reduce(
    (sum, schedule) => sum + schedule.rooms.length,
    0,
  );
  return (
    <dl className={styles.numbers}>
      <CleaningNumber
        label="Tempat pembersihan"
        amount={view.places.length}
        note={`ditambah ${shown(rooms)} kamar`}
      />
      <CleaningNumber
        label="Tugas hari dipilih"
        amount={view.dutiesOnDay}
        note={dayWords(day)}
      />
    </dl>
  );
}

/**
 * Pembersihan asrama for staff: the numbers, the places of the dorms shown
 * and the schedule of one date. It shows rooms by number only, never a
 * student. `today` is the day on campus.
 */
export async function CleaningScreen({
  tabs,
  params,
  today,
  mayManage,
}: {
  tabs: TabLinksProps;
  params: CleaningParams;
  today: string;
  /** Whether the account may change places and duties, or only see them. */
  mayManage: boolean;
}) {
  const view = await loadCleaning(database(), params, today);
  const groups: DormPlaces[] = view.schedules.map((schedule) => ({
    dorm: schedule.dorm,
    places: view.places.filter((place) => place.dorm === schedule.dorm),
    rooms: schedule.rooms.length,
  }));
  const mayChange = mayManage && isChangeable(params.day, today);
  return (
    <>
      <PageHead title="Pembersihan asrama">
        Tempat pembersihan bersama tiap asrama dan kamar yang bertugas
        membersihkannya.
      </PageHead>
      <TabLinks {...tabs} />
      {!mayManage && (
        <p className={styles.note}>
          Pembersihan asrama dikelola oleh Pengelola Asrama dan BAM. Anda dapat
          melihat tempat dan jadwalnya.
        </p>
      )}
      <CleaningSwitch params={params} today={today} />
      <CleaningNumbers view={view} day={params.day} />
      <p className={styles.note}>
        Satu tugas pembersihan dikerjakan oleh satu kelompok, yaitu seluruh
        penghuni satu kamar.
      </p>
      <section className={shared.panel}>
        <h2 className={shared.heading}>Tempat pembersihan</h2>
        <p className={styles.sub}>
          Daftar tempat yang dibersihkan bergiliran. Selain tempat ini, setiap
          kamar penghuni dapat ditugaskan membersihkan kamarnya sendiri.
        </p>
        <CleaningPlacesBoard
          groups={groups}
          mayManage={mayManage}
          formDorm={params.dorm ?? "dana_rakca"}
        />
      </section>
      <section className={shared.panel}>
        <div className={styles.head}>
          <div>
            <h2 className={`${shared.heading} ${styles.title}`}>
              Jadwal pembersihan
            </h2>
            {mayManage && (
              <p className={styles.sub}>
                Pilih tanggal, lalu tugaskan kamar untuk setiap tempat.
              </p>
            )}
          </div>
          <CleaningDaySwitch params={params} today={today} />
        </div>
        {view.schedules.map((schedule) => (
          <CleaningScheduleBoard
            key={schedule.dorm}
            scope={{
              dorm: schedule.dorm,
              params,
              today,
              rooms: schedule.rooms,
              mayChange,
            }}
            rows={placeRows(schedule.places, view.placeDuties)}
            ownRooms={schedule.ownRooms}
            scheduledRooms={schedule.scheduledRooms}
          />
        ))}
      </section>
    </>
  );
}
