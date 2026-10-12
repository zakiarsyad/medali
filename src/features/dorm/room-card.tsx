import { removeRoomAction } from "./actions";
import { ChangeRoomForm } from "./change-room-form";
import { RoomButton } from "./room-button";
import type { PlacedResident, Room } from "./room-list";
import styles from "./rooms.module.css";

function Residents({
  room,
  residents,
}: Pick<RoomCardProps, "room" | "residents">) {
  const hidden = room.taken - residents.length;
  if (room.taken === 0) {
    return <p className={styles.quietLine}>Belum ada penghuni.</p>;
  }
  return (
    <>
      <ul className={styles.residents}>
        {residents.map((resident) => (
          <li key={resident.id} className={styles.resident}>
            <span>
              <b>{resident.name}</b>{" "}
              <span className={styles.nim}>{resident.nim}</span>
            </span>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <p className={styles.quietLine}>
          {residents.length > 0 ? "dan " : ""}
          {hidden} penghuni dari program studi lain
        </p>
      )}
    </>
  );
}

interface RoomCardProps {
  room: Room;
  /** The residents of the room that the account may see. */
  residents: PlacedResident[];
  mayManage: boolean;
}

/** Changing and removing a room. Only an empty room can be removed. */
function RoomActions({ room }: { room: Room }) {
  return (
    <div className={styles.cardActions}>
      <ChangeRoomForm key={`${room.number} ${room.capacity}`} room={room} />
      {room.taken > 0 ? (
        <span className={styles.quietLine}>Hapus kamar: kosongkan dulu</span>
      ) : (
        <RoomButton
          action={removeRoomAction}
          ids={{ roomId: room.id }}
          confirm={`Hapus kamar ${room.number}?`}
        >
          Hapus kamar
        </RoomButton>
      )}
    </div>
  );
}

/** One room: its number, its places taken, and its residents. */
export function RoomCard({ room, residents, mayManage }: RoomCardProps) {
  const isFull = room.taken >= room.capacity;
  return (
    <li className={styles.card}>
      <div className={styles.head}>
        <h3 className={styles.roomName}>Kamar {room.number}</h3>
        <span className={isFull ? styles.full : styles.taken}>
          {room.taken}/{room.capacity}
        </span>
      </div>
      <Residents room={room} residents={residents} />
      {mayManage && <RoomActions room={room} />}
    </li>
  );
}
