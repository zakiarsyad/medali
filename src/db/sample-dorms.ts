import type { CompanionDormId } from "@/features/dorm/companion-dorms";
import type { DormId } from "@/features/dorm/dorms";
import type { SampleStudent } from "./sample-students";

/*
 * Made-up people only. Every name is a mix of common given names and
 * family names, and every number is invented.
 */

const WOMEN = [
  "Anisa",
  "Bunga",
  "Cahya",
  "Dewi",
  "Erna",
  "Fitri",
  "Hana",
  "Laras",
  "Melati",
  "Novi",
  "Wening",
];
const MEN = ["Arya", "Bagas", "Candra", "Dani", "Edo", "Farhan"];
const FAMILIES = [
  "Wiratama",
  "Hasibuan",
  "Kartika",
  "Manurung",
  "Pradipta",
  "Sitompul",
  "Wardhana",
  "Yulianto",
];
/**
 * The program studi of the first years, taken in turn. D3 Pajak comes
 * three times and D3 Akuntansi once, so the one has enough students for
 * two kelompok pengasuhan and the other too few for a usual one.
 */
const PROGRAMS = [
  "D3 Pajak",
  "D3 Akuntansi",
  "D3 Kepabeanan dan Cukai",
  "Akuntansi Sektor Publik STR",
  "D3 Pajak",
  "D3 Kepabeanan dan Cukai",
  "D3 Pajak",
  "Akuntansi Sektor Publik STR",
];
const PROVINCES = ["Jawa Barat", "Jawa Tengah", "Sumatera Utara", "Bali"];
const ABROAD = "Luar negeri";
/** One student in this many is Pembibitan, and one more is Internasional. */
const SPECIAL_EVERY = 9;
const FIRST_NUMBER = 1001;
const CLASSES = 4;

function names(given: string[]): string[] {
  return given.flatMap((first) => FAMILIES.map((last) => `${first} ${last}`));
}

function firstYear(
  name: string,
  sex: SampleStudent["sex"],
  place: number,
  cohortYear: number,
): SampleStudent {
  const isSeedling = place % SPECIAL_EVERY === 0;
  const isInternational = place % SPECIAL_EVERY === 1;
  const year = String(cohortYear).slice(2);
  const province = PROVINCES[place % PROVINCES.length] ?? ABROAD;
  return {
    nim: `9900${year}${FIRST_NUMBER + place}`,
    name,
    studyProgram: PROGRAMS[place % PROGRAMS.length] ?? "D3 Pajak",
    entryPath: "regular",
    sex,
    cohortYear,
    className: `1-0${(place % CLASSES) + 1}`,
    province: isInternational ? ABROAD : province,
    isSeedling,
    isInternational,
  };
}

/**
 * Made-up students of one angkatan, so that the year in its first two
 * semesters fills the dorms: mostly Reguler, with some Pembibitan and
 * Internasional among them.
 */
export function sampleFirstYears(cohortYear: number): SampleStudent[] {
  const women = names(WOMEN).map((name) => ({ name, sex: "female" as const }));
  const men = names(MEN).map((name) => ({ name, sex: "male" as const }));
  return [...women, ...men].map(({ name, sex }, place) =>
    firstYear(name, sex, place, cohortYear),
  );
}

export interface SampleRoom {
  floor: number;
  number: string;
  capacity: number;
  /** How many residents the sample data puts in the room. */
  placed: number;
}

/** The rooms every dorm starts with: one full, some partly full, some empty. */
export const SAMPLE_ROOMS: SampleRoom[] = [
  { floor: 1, number: "101", capacity: 2, placed: 2 },
  { floor: 1, number: "102", capacity: 4, placed: 1 },
  { floor: 2, number: "201", capacity: 4, placed: 1 },
  { floor: 2, number: "202", capacity: 6, placed: 0 },
  { floor: 3, number: "301", capacity: 2, placed: 0 },
];

export interface SamplePlace {
  roomNumber: string;
  nim: string;
}

/**
 * Puts the first residents of a dorm, in NIM order, into the sample rooms.
 * The residents after those stay without a room.
 */
export function samplePlaces(nims: string[]): SamplePlace[] {
  const waiting = [...nims].sort();
  const places: SamplePlace[] = [];
  for (const room of SAMPLE_ROOMS) {
    for (const nim of waiting.splice(0, room.placed)) {
      places.push({ roomNumber: room.number, nim });
    }
  }
  return places;
}

/** The key of a sample room among the rooms of every dorm. */
export function sampleRoomKey(dorm: DormId, roomNumber: string): string {
  return `${dorm} ${roomNumber}`;
}

export interface SampleCompanion {
  /** The NIM of a sample student who does not live in a dorm. */
  nim: string;
  dorm: CompanionDormId;
  note: string | null;
  isActive: boolean;
}

/** The kakak pendamping the sample data starts with, none in a room yet. */
export const SAMPLE_COMPANIONS: SampleCompanion[] = [
  {
    nim: "9900230032",
    dorm: "dana_rakca",
    note: "Pendamping lantai 1",
    isActive: true,
  },
  { nim: "9900220019", dorm: "cipta_bakti", note: null, isActive: true },
  {
    nim: "9900230045",
    dorm: "cipta_bakti",
    note: "Pendamping lantai 2",
    isActive: false,
  },
];
