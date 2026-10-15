import { DORM_SHORT_NAMES } from "@/dorms/dorms";
import shared from "@/ui/data-screen.module.css";
import { dayWords } from "./activity-words";
import styles from "./cleaning.module.css";
import type { OwnCleaning, ResidentDuty } from "./cleaning-resident";
import { ownRoomWords, roomWords } from "./cleaning-rows";

type ShownCleaning = Extract<OwnCleaning, { kind: "shown" }>;

function placeOf(duty: ResidentDuty): string {
  return duty.place ?? ownRoomWords(duty.roomNumber);
}

function RoomNumbers({ own }: { own: ShownCleaning }) {
  const { room } = own;
  return (
    <dl className={styles.numbers}>
      <div className={styles.number}>
        <dt className={styles.numberLabel}>Kamar</dt>
        <dd className={styles.roomValue}>
          {DORM_SHORT_NAMES[own.dorm]} · {roomWords(room.number)}
        </dd>
        <dd className={styles.numberNote}>
          {room.residents.toLocaleString("id-ID")} penghuni
        </dd>
      </div>
      <div className={styles.number}>
        <dt className={styles.numberLabel}>Tugas terjadwal</dt>
        <dd className={styles.numberValue}>
          {own.scheduled.toLocaleString("id-ID")}
        </dd>
        <dd className={styles.numberNote}>hari ini dan seterusnya</dd>
      </div>
    </dl>
  );
}

function DutyTable({ duties }: { duties: ResidentDuty[] }) {
  if (duties.length === 0) {
    return <p className={shared.empty}>Belum ada jadwal pembersihan.</p>;
  }
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Tempat</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {duties.map((duty) => (
            <tr key={`${duty.day} ${placeOf(duty)}`}>
              <td data-title="Tanggal">{dayWords(duty.day)}</td>
              <td data-title="Tempat">{placeOf(duty)}</td>
              <td data-title="Status">
                <span className={shared.badge}>Terjadwal</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Pembersihan asrama for a resident: their room with its residents, how
 * many duties it has from today on, and its last duties.
 */
export function CleaningResidentView({
  own,
}: {
  own: Exclude<OwnCleaning, { kind: "refused" }>;
}) {
  if (own.kind === "no_room") {
    return (
      <section className={shared.panel}>
        <p className={shared.empty}>Anda belum tercatat di kamar mana pun.</p>
      </section>
    );
  }
  return (
    <>
      <RoomNumbers own={own} />
      <section className={shared.panel}>
        <h2 className={shared.heading}>
          Jadwal dan hasil pembersihan kamar Anda
        </h2>
        <DutyTable duties={own.duties} />
      </section>
    </>
  );
}
