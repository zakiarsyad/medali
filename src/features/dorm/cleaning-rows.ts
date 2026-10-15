import type { CleaningPlace } from "./cleaning-place-list";
import type { OccupiedRoom } from "./cleaning-rooms";
import type { ScheduledDuty } from "./cleaning-schedule";

/** One place of the schedule, with its duty on the date or none. */
export interface PlaceRow {
  place: CleaningPlace;
  duty: ScheduledDuty | null;
}

/** Each place shown with the duty it has on the date. */
export function placeRows(
  places: CleaningPlace[],
  duties: ScheduledDuty[],
): PlaceRow[] {
  return places.map((place) => ({
    place,
    duty: duties.find((duty) => duty.placeId === place.id) ?? null,
  }));
}

/**
 * How many residents the room of a duty has today, or null for a room
 * that has none or is removed.
 */
export function residentsOf(
  duty: ScheduledDuty,
  rooms: OccupiedRoom[],
): number | null {
  const room = rooms.find((each) => each.id === duty.roomId);
  return room?.residents ?? null;
}

/** A room as the schedule names it, such as Kamar 101. */
export function roomWords(roomNumber: string): string {
  return `Kamar ${roomNumber}`;
}

/** The duty of a room's own room, such as Kamar 101 (kamar sendiri). */
export function ownRoomWords(roomNumber: string): string {
  return `${roomWords(roomNumber)} (kamar sendiri)`;
}

/** A room offered for a duty, with its residents, such as Kamar 101 (2). */
export function offeredRoomWords(room: OccupiedRoom): string {
  return `${roomWords(room.number)} (${room.residents.toLocaleString("id-ID")})`;
}

/** Whether a duty on a date may still be given or cancelled. */
export function isChangeable(day: string, today: string): boolean {
  return day >= today;
}
