import {
  autoFillRoomAction,
  removeRoomAction,
  takeOutResidentAction,
} from "./actions";
import { ChangeRoomForm } from "./change-room-form";
import { PlaceForm } from "./place-form";
import { RoomButton } from "./room-button";
import type { PlacedResident, Resident, Room } from "./room-list";
import styles from "./rooms.module.css";

interface RoomCardProps {
  room: Room;
  /** The residents of the room that the account may see. */
  residents: PlacedResident[];
  /** The residents without a room to choose from. Null for a read-only role. */
  offered: Resident[] | null;
}

function TakeOutButton({
  room,
  resident,
}: {
  room: Room;
  resident: PlacedResident;
}) {
  return (
    <RoomButton
      action={takeOutResidentAction}
      ids={{ roomId: room.id, studentId: resident.id }}
      confirm={`Keluarkan ${resident.name} dari kamar ${room.number}?`}
    >
      Keluarkan
    </RoomButton>
  );
}

function Residents({ room, residents, offered }: RoomCardProps) {
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
            {offered && <TakeOutButton room={room} resident={resident} />}
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

/** Filling the free places of a room: by choosing a resident, or by itself. */
function FreePlaces({ room, offered }: { room: Room; offered: Resident[] }) {
  return (
    <div className={styles.cardActions}>
      <PlaceForm roomId={room.id} roomNumber={room.number} offered={offered} />
      <RoomButton action={autoFillRoomAction} ids={{ roomId: room.id }}>
        Isi otomatis
      </RoomButton>
    </div>
  );
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
export function RoomCard({ room, residents, offered }: RoomCardProps) {
  const isFull = room.taken >= room.capacity;
  return (
    <li className={styles.card}>
      <div className={styles.head}>
        <h3 className={styles.roomName}>Kamar {room.number}</h3>
        <span className={isFull ? styles.full : styles.taken}>
          {room.taken}/{room.capacity}
        </span>
      </div>
      <Residents room={room} residents={residents} offered={offered} />
      {offered && !isFull && <FreePlaces room={room} offered={offered} />}
      {offered && <RoomActions room={room} />}
    </li>
  );
}
