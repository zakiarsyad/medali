import Link from "next/link";
import { DORM_IDS, DORM_NAMES, DORM_RESIDENTS, type DormId } from "./dorms";
import type { CompanionCounts } from "./room-companions";
import type { ResidentCounts, Room } from "./room-list";
import styles from "./rooms.module.css";
import { roomsAddress } from "./rooms-address";

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

/** The switch between the four dorms. Each opens on the floor that is open. */
export function DormSwitch({ open, floor }: { open: DormId; floor: number }) {
  return (
    <nav className={styles.switch} aria-label="Asrama">
      {DORM_IDS.map((dorm) => (
        <Link
          key={dorm}
          href={roomsAddress(dorm, floor)}
          className={styles.choice}
          aria-current={dorm === open ? "true" : undefined}
        >
          {DORM_NAMES[dorm]}
        </Link>
      ))}
    </nav>
  );
}

function DormNumber({
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

/**
 * The numbers of one dorm: its residents, those with a room, its rooms,
 * and its kakak pendamping when the dorm has them.
 */
export function DormNumbers({
  dorm,
  counts,
  rooms,
  companions,
}: {
  dorm: DormId;
  counts: ResidentCounts;
  rooms: Room[];
  /** Null for a dorm that has no kakak pendamping. */
  companions: CompanionCounts | null;
}) {
  const places = rooms.reduce((sum, room) => sum + room.capacity, 0);
  return (
    <dl className={styles.numbers}>
      <DormNumber
        label={`Penghuni ${DORM_NAMES[dorm]}`}
        amount={counts.residents}
        note={DORM_RESIDENTS[dorm]}
      />
      <DormNumber
        label="Sudah diplot"
        amount={counts.placed}
        note={`${shown(counts.residents - counts.placed)} belum diplot`}
      />
      <DormNumber
        label="Kamar terdaftar"
        amount={rooms.length}
        note={`kapasitas ${shown(places)} orang`}
      />
      {companions && (
        <DormNumber
          label="Kakak pendamping"
          amount={companions.active}
          note={`${shown(companions.placed)} sudah diplot`}
        />
      )}
    </dl>
  );
}
