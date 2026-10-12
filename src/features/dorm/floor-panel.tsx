import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import type { DormId } from "./dorms";
import { RoomCard } from "./room-card";
import { FLOORS } from "./room-limits";
import type { PlacedResident, Room } from "./room-list";
import styles from "./rooms.module.css";
import { roomsAddress } from "./rooms-address";

function FloorChips({
  dorm,
  open,
  rooms,
}: {
  dorm: DormId;
  open: number;
  rooms: Room[];
}) {
  return (
    <nav className={styles.floors} aria-label="Lantai">
      {FLOORS.map((floor) => (
        <Link
          key={floor}
          href={roomsAddress(dorm, floor)}
          className={styles.choice}
          aria-current={floor === open ? "true" : undefined}
        >
          Lantai {floor}{" "}
          <span className={styles.count}>
            ({rooms.filter((room) => room.floor === floor).length})
          </span>
        </Link>
      ))}
    </nav>
  );
}

/** The floors of a dorm, and the rooms of the floor that is open. */
export function FloorPanel({
  dorm,
  floor,
  rooms,
  residents,
  mayManage,
}: {
  dorm: DormId;
  floor: number;
  /** Every room of the dorm. */
  rooms: Room[];
  /** The residents in the rooms of the open floor. */
  residents: PlacedResident[];
  mayManage: boolean;
}) {
  const onFloor = rooms.filter((room) => room.floor === floor);
  return (
    <section className={shared.panel}>
      <div className={styles.head}>
        <h2 className={`${shared.heading} ${styles.title}`}>Lantai</h2>
        <FloorChips dorm={dorm} open={floor} rooms={rooms} />
      </div>
      {onFloor.length === 0 ? (
        <p className={shared.empty}>
          Belum ada kamar di lantai {floor}.
          {mayManage && " Tambahkan nomor kamar di atas."}
        </p>
      ) : (
        <ul className={styles.cards}>
          {onFloor.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              residents={residents.filter((one) => one.roomId === room.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
