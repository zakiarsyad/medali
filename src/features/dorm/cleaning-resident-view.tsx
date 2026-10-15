import { DORM_SHORT_NAMES } from "@/dorms/dorms";
import shared from "@/ui/data-screen.module.css";
import { dayWords } from "./activity-words";
import styles from "./cleaning.module.css";
import { resultWithPoints, scoreOf, scoreWords } from "./cleaning-assessment";
import {
  CleaningResultBadge,
  CleaningStatusBadge,
  RepeatBadge,
} from "./cleaning-duty-parts";
import type { OwnCleaning, ResidentDuty } from "./cleaning-resident";
import { ownRoomWords, roomWords } from "./cleaning-rows";

type ShownCleaning = Extract<OwnCleaning, { kind: "shown" }>;

function placeOf(duty: ResidentDuty): string {
  return duty.place ?? ownRoomWords(duty.roomNumber);
}

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

function RoomNumbers({ own }: { own: ShownCleaning }) {
  const { room, score } = own;
  return (
    <dl className={styles.numbers}>
      <div className={styles.number}>
        <dt className={styles.numberLabel}>Kamar</dt>
        <dd className={styles.roomValue}>
          {DORM_SHORT_NAMES[own.dorm]} · {roomWords(room.number)}
        </dd>
        <dd className={styles.numberNote}>{shown(room.residents)} penghuni</dd>
      </div>
      <div className={styles.number}>
        <dt className={styles.numberLabel}>Skor kebersihan kamar</dt>
        <dd className={styles.numberValue}>
          {scoreWords(scoreOf(score.plus, score.minus))}
        </dd>
        <dd className={styles.numberNote}>
          +{shown(score.plus)} / −{shown(score.minus)}
        </dd>
      </div>
      <div className={styles.number}>
        <dt className={styles.numberLabel}>Tugas terjadwal</dt>
        <dd className={styles.numberValue}>{shown(own.scheduled)}</dd>
        <dd className={styles.numberNote}>hari ini dan seterusnya</dd>
      </div>
    </dl>
  );
}

function ResultCell({ duty }: { duty: ResidentDuty }) {
  if (duty.result === null) {
    return (
      <td data-title="Hasil">
        <span className={styles.quiet}>-</span>
      </td>
    );
  }
  const { result, note } = duty.result;
  return (
    <td data-title="Hasil">
      <CleaningResultBadge result={result} words={resultWithPoints(result)} />
      {note !== "" && <small className={shared.detail}>{note}</small>}
    </td>
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
            <th>Hasil</th>
          </tr>
        </thead>
        <tbody>
          {duties.map((duty) => (
            <tr key={`${duty.day} ${placeOf(duty)}`}>
              <td data-title="Tanggal">{dayWords(duty.day)}</td>
              <td data-title="Tempat">
                {placeOf(duty)} {duty.isRepeat && <RepeatBadge />}
              </td>
              <td data-title="Status">
                <CleaningStatusBadge status={duty.status} />
              </td>
              <ResultCell duty={duty} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Pembersihan asrama for a resident: their room with its residents and
 * its score, how many duties it has from today on, and its last duties
 * with their results once validated.
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
