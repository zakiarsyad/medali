import Link from "next/link";
import type { DormId } from "@/dorms/dorms";
import shared from "@/ui/data-screen.module.css";
import { AddRoomForm } from "./add-room-form";
import { RoomCard } from "./room-card";
import type { RoomCompanions } from "./room-companions";
import { FLOORS } from "./room-limits";
import type { PlacedResident, Resident, Room } from "./room-list";
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
  offered,
  companions,
}: {
  dorm: DormId;
  floor: number;
  /** Every room of the dorm. */
  rooms: Room[];
  /** The residents in the rooms of the open floor. */
  residents: PlacedResident[];
  /** The residents without a room to choose from. Null for a read-only role. */
  offered: Resident[] | null;
  /** The kakak pendamping of the dorm. Null for a dorm that has none. */
  companions: RoomCompanions | null;
}) {
  const placed = companions?.placed ?? [];
  const mayManage = offered !== null;
  const onFloor = rooms.filter((room) => room.floor === floor);
  return (
    <section className={shared.panel}>
      <div className={styles.head}>
        <h2 className={`${shared.heading} ${styles.title}`}>Lantai</h2>
        <FloorChips dorm={dorm} open={floor} rooms={rooms} />
      </div>
      {mayManage && (
        <AddRoomForm key={`${dorm} ${floor}`} dorm={dorm} floor={floor} />
      )}
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
              offered={offered}
              companions={placed.filter((one) => one.roomId === room.id)}
              offeredCompanions={companions?.waiting ?? []}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
