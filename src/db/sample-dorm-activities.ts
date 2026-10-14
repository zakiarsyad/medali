import { daysAfter } from "@/academic-periods/days-after";
import type {
  ActivityCategory,
  ActivityPattern,
  Audience,
  Organiser,
  RundownLine,
} from "@/features/dorm/activity-ids";

/*
 * Made-up dorm activities only. Every name, hour and place is invented.
 */

/** What a sample activity holds for the days it is shown with. */
export interface SampleActivityVersion {
  shownFrom: string | null;
  shownUntil: string | null;
  name: string;
  category: ActivityCategory;
  location: string;
  pattern: ActivityPattern;
  weekdays: number[];
  monthDay: number | null;
  startsOn: string;
  endsOn: string | null;
  startTime: string;
  endTime: string;
  organiser: Organiser;
  organiserName: string;
  audience: Audience;
  isRequired: boolean;
  rundown: RundownLine[];
}

export interface SampleDormActivity {
  /** Its versions, the one without a last day among them. */
  versions: SampleActivityVersion[];
  daysOff: string[];
}

/** What a sample says of itself; the rest is the same for all of its kind. */
type Parts = Pick<
  SampleActivityVersion,
  | "name"
  | "category"
  | "location"
  | "startTime"
  | "endTime"
  | "organiser"
  | "organiserName"
  | "rundown"
> &
  Partial<SampleActivityVersion>;

/** How long before the day the repeating samples began. */
const ROUTINES_BEGAN = -60;

const UPK = {
  organiser: "upk",
  organiserName: "Unit Pembangunan Karakter",
} as const;
const BAM = {
  organiser: "bam",
  organiserName: "Badan Asrama Mahasiswa",
} as const;
const COACH = { organiser: "coach", organiserName: "Tim Pelatih" } as const;

/** A repeating sample for every resident, every day, unless told otherwise. */
function routine(day: string, parts: Parts): SampleActivityVersion {
  return {
    shownFrom: null,
    shownUntil: null,
    pattern: "daily",
    weekdays: [],
    monthDay: null,
    startsOn: daysAfter(day, ROUTINES_BEGAN),
    endsOn: null,
    audience: "all",
    isRequired: true,
    ...parts,
  };
}

/** A one-off sample for every resident, so many days from the day. */
function oneOff(day: string, daysFrom: number, parts: Parts) {
  const on = daysAfter(day, daysFrom);
  const version: SampleActivityVersion = {
    shownFrom: null,
    shownUntil: null,
    pattern: "once",
    weekdays: [],
    monthDay: null,
    startsOn: on,
    endsOn: on,
    audience: "all",
    isRequired: true,
    ...parts,
  };
  return { versions: [version], daysOff: [] };
}

/**
 * Apel pagi was held half an hour sooner until two weeks ago: the days
 * before the change still show the old hours.
 */
function morningRollCall(day: string): SampleDormActivity {
  const now = routine(day, {
    name: "Apel pagi dan senam",
    category: "roll_call",
    location: "Lapangan asrama",
    startTime: "05:30",
    endTime: "06:15",
    ...COACH,
    rundown: [
      { time: "05:30", activity: "Apel dan laporan kehadiran" },
      { time: "05:45", activity: "Senam pagi" },
      { time: "06:10", activity: "Pengumuman harian" },
    ],
  });
  const changedOn = daysAfter(day, -14);
  const before = {
    ...now,
    shownUntil: daysAfter(changedOn, -1),
    startTime: "05:00",
    endTime: "05:45",
  };
  return {
    versions: [before, { ...now, shownFrom: changedOn }],
    daysOff: [daysAfter(day, -6)],
  };
}

function routines(day: string): SampleDormActivity[] {
  const samples = [
    routine(day, {
      name: "Belajar malam bersama",
      category: "study_together",
      location: "Ruang belajar tiap asrama",
      startTime: "19:30",
      endTime: "21:00",
      ...UPK,
      rundown: [
        { time: "19:30", activity: "Belajar mandiri dan kelompok" },
        { time: "20:45", activity: "Refleksi harian" },
      ],
    }),
    routine(day, {
      name: "Apel malam dan pengecekan kamar",
      category: "roll_call",
      location: "Lobi tiap asrama",
      startTime: "22:00",
      endTime: "22:30",
      ...BAM,
      rundown: [],
    }),
    routine(day, {
      name: "Pembinaan karakter asrama",
      category: "character_building",
      location: "Aula asrama",
      pattern: "weekly",
      weekdays: [3],
      startTime: "16:00",
      endTime: "17:30",
      ...UPK,
      rundown: [
        { time: "16:00", activity: "Materi nilai MEDALI" },
        { time: "17:00", activity: "Diskusi kelompok kamar" },
      ],
    }),
    routine(day, {
      name: "Kerja bakti lingkungan asrama",
      category: "cleaning",
      location: "Lingkungan asrama",
      pattern: "weekly",
      weekdays: [6],
      startTime: "07:00",
      endTime: "09:00",
      ...BAM,
      rundown: [
        { time: "07:00", activity: "Pembagian area per kamar" },
        { time: "08:45", activity: "Pemeriksaan kebersihan" },
      ],
    }),
    routine(day, {
      name: "Olahraga sore putra",
      category: "sport",
      location: "Lapangan asrama",
      pattern: "weekly",
      weekdays: [2, 4],
      startTime: "16:30",
      endTime: "17:30",
      ...COACH,
      audience: "men",
      isRequired: false,
      rundown: [],
    }),
    routine(day, {
      name: "Olahraga sore putri",
      category: "sport",
      location: "Lapangan asrama",
      pattern: "weekly",
      weekdays: [1, 5],
      startTime: "16:30",
      endTime: "17:30",
      ...COACH,
      audience: "women",
      isRequired: false,
      rundown: [],
    }),
    routine(day, {
      name: "Rapat penghuni Asrama Dana Rakca",
      category: "other",
      location: "Aula asrama",
      pattern: "monthly",
      monthDay: 1,
      startTime: "19:00",
      endTime: "20:30",
      ...BAM,
      audience: "dana_rakca",
      rundown: [
        { time: "19:00", activity: "Evaluasi kegiatan bulan lalu" },
        { time: "20:00", activity: "Rencana bulan berjalan" },
      ],
    }),
  ];
  const kept = samples.map((version) => ({ versions: [version], daysOff: [] }));
  return [morningRollCall(day), ...kept];
}

/** One-off activities gone by, taken in turn, enough for a second page. */
const PAST_NAMES = [
  "Kajian dan diskusi malam",
  "Lomba kebersihan antar kamar",
  "Nonton bareng film inspiratif",
  "Pelatihan tanggap darurat asrama",
  "Senam bersama penghuni asrama",
  "Pentas seni antar lantai",
  "Bakti sosial lingkungan sekitar",
];
const PAST_ONE_OFFS = 28;
const DAYS_BETWEEN_PAST = 4;
const LAST_PAST = -14;

function pastOneOffs(day: string): SampleDormActivity[] {
  const past: SampleDormActivity[] = [];
  for (let place = 0; place < PAST_ONE_OFFS; place++) {
    const name = PAST_NAMES[place % PAST_NAMES.length] ?? "Kegiatan asrama";
    past.push(
      oneOff(day, LAST_PAST - place * DAYS_BETWEEN_PAST, {
        name,
        category: "other",
        location: "Aula asrama",
        startTime: "19:00",
        endTime: "20:30",
        ...BAM,
        rundown: [],
      }),
    );
  }
  return past;
}

function oneOffs(day: string): SampleDormActivity[] {
  return [
    oneOff(day, 0, {
      name: "Piket kebersihan asrama",
      category: "cleaning",
      location: "Asrama masing-masing",
      startTime: "00:00",
      endTime: "23:59",
      organiser: "bam",
      organiserName: "Koordinator BAM",
      rundown: [
        {
          time: "Sepanjang hari",
          activity: "Piket kamar dan koridor sesuai jadwal",
        },
      ],
    }),
    oneOff(day, -10, {
      name: "Malam keakraban penghuni asrama",
      category: "arts_and_culture",
      location: "Aula asrama",
      startTime: "19:00",
      endTime: "22:00",
      ...BAM,
      rundown: [
        { time: "19:00", activity: "Pentas seni per kamar" },
        { time: "21:00", activity: "Ramah tamah" },
      ],
    }),
    oneOff(day, 3, {
      name: "Sosialisasi tata tertib asrama",
      category: "character_building",
      location: "Aula asrama",
      startTime: "19:00",
      endTime: "20:30",
      ...UPK,
      rundown: [],
    }),
    oneOff(day, 9, {
      name: "Peringatan hari jadi asrama",
      category: "arts_and_culture",
      location: "Lapangan asrama",
      startTime: "08:00",
      endTime: "11:00",
      ...BAM,
      rundown: [
        { time: "08:00", activity: "Upacara pembukaan" },
        { time: "09:00", activity: "Lomba antar lantai" },
      ],
    }),
    oneOff(day, 16, {
      name: "Donor darah sukarela",
      category: "other",
      location: "Lobi Asrama Cipta Bakti",
      startTime: "09:00",
      endTime: "12:00",
      ...UPK,
      audience: "cipta_bakti",
      isRequired: false,
      rundown: [],
    }),
    ...pastOneOffs(day),
  ];
}

/**
 * The made-up dorm activities around a day: repeating ones of every
 * pattern and for every kind of Peserta, one of them changed two weeks
 * ago and with a day off, and one-off ones that are over, today and to
 * come. `day` is today on campus.
 */
export function sampleDormActivities(day: string): SampleDormActivity[] {
  return [...routines(day), ...oneOffs(day)];
}
