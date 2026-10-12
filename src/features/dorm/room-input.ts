import { isUuid } from "@/db/is-uuid";
import { DORM_IDS, type DormId } from "@/dorms/dorms";
import type { Parsed } from "@/parsed";
import {
  FLOORS,
  MAX_CAPACITY,
  MIN_CAPACITY,
  ROOM_NUMBER_MAX_LENGTH,
} from "./room-limits";

/** The number and the kapasitas of a room as a form sends them. */
export interface SentRoomDetails {
  number: string;
  capacity: string;
}

/** A new room as a form sends it. */
export interface SentRoom extends SentRoomDetails {
  dorm: string;
  floor: string;
}

export interface RoomDetails {
  number: string;
  capacity: number;
}

export interface NewRoom extends RoomDetails {
  dorm: DormId;
  floor: number;
}

const ROOM_NUMBER = /^[A-Z0-9][A-Z0-9 .-]*$/;
const WHOLE_NUMBER = /^\d{1,2}$/;

const DORM_REFUSED = { ok: false, error: "Pilih asrama." } as const;
const FLOOR_REFUSED = {
  ok: false,
  error: "Pilih lantai 1 sampai 8.",
} as const;
const NUMBER_MISSING = { ok: false, error: "Isi nomor kamar." } as const;
const NUMBER_TOO_LONG = {
  ok: false,
  error: `Nomor kamar paling panjang ${ROOM_NUMBER_MAX_LENGTH} karakter.`,
} as const;
const NUMBER_REFUSED = {
  ok: false,
  error:
    "Nomor kamar hanya berisi huruf, angka, spasi, titik, atau tanda hubung, dan diawali huruf atau angka.",
} as const;
const CAPACITY_REFUSED = {
  ok: false,
  error: `Kapasitas diisi angka ${MIN_CAPACITY} sampai ${MAX_CAPACITY}.`,
} as const;
/** What a change answers when the room or the resident it names is not one. */
export const NOT_FOUND = {
  ok: false,
  error: "Kamar atau penghuni tidak ditemukan. Muat ulang halaman.",
} as const;

/**
 * A room number as kept: without spaces around it and in capital letters,
 * so that 2a and 2A are one number.
 */
function parseNumber(sent: string): Parsed<string> {
  const number = sent.trim().toUpperCase();
  if (number === "") return NUMBER_MISSING;
  if (number.length > ROOM_NUMBER_MAX_LENGTH) return NUMBER_TOO_LONG;
  if (!ROOM_NUMBER.test(number)) return NUMBER_REFUSED;
  return { ok: true, value: number };
}

function parseCapacity(sent: string): Parsed<number> {
  const text = sent.trim();
  if (!WHOLE_NUMBER.test(text)) return CAPACITY_REFUSED;
  const capacity = Number(text);
  if (capacity < MIN_CAPACITY || capacity > MAX_CAPACITY) {
    return CAPACITY_REFUSED;
  }
  return { ok: true, value: capacity };
}

/** Checks the number and the kapasitas of a room as sent. */
export function parseRoomDetails(sent: SentRoomDetails): Parsed<RoomDetails> {
  const number = parseNumber(sent.number);
  if (!number.ok) return number;
  const capacity = parseCapacity(sent.capacity);
  if (!capacity.ok) return capacity;
  return {
    ok: true,
    value: { number: number.value, capacity: capacity.value },
  };
}

/** Checks a new room as sent. */
export function parseNewRoom(sent: SentRoom): Parsed<NewRoom> {
  const dorm = DORM_IDS.find((id) => id === sent.dorm);
  if (!dorm) return DORM_REFUSED;
  const floor = FLOORS.find((one) => String(one) === sent.floor.trim());
  if (!floor) return FLOOR_REFUSED;
  const details = parseRoomDetails(sent);
  if (!details.ok) return details;
  return { ok: true, value: { dorm, floor, ...details.value } };
}

/** Checks an id as sent: a text with the shape of a row id. */
export function parseId(sent: string): Parsed<string> {
  if (!isUuid(sent)) return NOT_FOUND;
  return { ok: true, value: sent };
}
