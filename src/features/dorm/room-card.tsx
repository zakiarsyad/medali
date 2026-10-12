import shared from "@/ui/data-screen.module.css";
import {
  autoFillRoomAction,
  placeCompanionAction,
  placeResidentAction,
  removeRoomAction,
  takeOutCompanionAction,
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
  /** The kakak pendamping of the room that the account may see. */
  companions: PlacedResident[];
  /** The kakak pendamping without a room to choose from. */
  offeredCompanions: Resident[];
}

function TakeOutButton({
  room,
  resident,
  isCompanion = false,
}: {
  room: Room;
  resident: PlacedResident;
  isCompanion?: boolean;
}) {
  return (
    <RoomButton
      action={isCompanion ? takeOutCompanionAction : takeOutResidentAction}
      ids={{ roomId: room.id, studentId: resident.id }}
      confirm={`Keluarkan ${resident.name} dari kamar ${room.number}?`}
    >
      Keluarkan
    </RoomButton>
  );
}

function Residents({ room, residents, offered, companions }: RoomCardProps) {
  const hidden = room.taken - residents.length - companions.length;
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
        {companions.map((companion) => (
          <li key={companion.id} className={styles.resident}>
            <span>
              <b>{companion.name}</b>{" "}
              <span className={styles.nim}>{companion.nim}</span>{" "}
              <span className={shared.badge}>Kakak pendamping</span>
            </span>
            {offered && (
              <TakeOutButton room={room} resident={companion} isCompanion />
            )}
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <p className={styles.quietLine}>
          {residents.length + companions.length > 0 ? "dan " : ""}
          {hidden} orang dari program studi lain
        </p>
      )}
    </>
  );
}

/**
 * Filling the free places of a room: by choosing a resident or a kakak
 * pendamping, or by itself, which takes residents only.
 */
function FreePlaces({
  room,
  offered,
  offeredCompanions,
}: {
  room: Room;
  offered: Resident[];
  offeredCompanions: Resident[];
}) {
  return (
    <div className={styles.cardActions}>
      <PlaceForm
        action={placeResidentAction}
        what="penghuni"
        roomId={room.id}
        roomNumber={room.number}
        offered={offered}
      />
      {offeredCompanions.length > 0 && (
        <PlaceForm
          action={placeCompanionAction}
          what="kakak pendamping"
          roomId={room.id}
          roomNumber={room.number}
          offered={offeredCompanions}
        />
      )}
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

/** One room: its number, its places taken, and who is in it. */
export function RoomCard(props: RoomCardProps) {
  const { room, offered, offeredCompanions } = props;
  const isFull = room.taken >= room.capacity;
  return (
    <li className={styles.card}>
      <div className={styles.head}>
        <h3 className={styles.roomName}>Kamar {room.number}</h3>
        <span className={isFull ? styles.full : styles.taken}>
          {room.taken}/{room.capacity}
        </span>
      </div>
      <Residents {...props} />
      {offered && !isFull && (
        <FreePlaces
          room={room}
          offered={offered}
          offeredCompanions={offeredCompanions}
        />
      )}
      {offered && <RoomActions room={room} />}
    </li>
  );
}
