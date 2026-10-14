import type { ActivityChoice } from "./activity-choice";
import type { FormParts } from "./form-values";
import type { ListAttendance } from "./schedule-attendance";
import type { ScheduleRow } from "./schedule-row";

/* Made-up screen data for the checks of the screen parts of this area. */

export const TEST_CHOICES: ActivityChoice[] = [
  {
    id: "00000000-0000-4000-8000-0000000000a1",
    semester: 1,
    name: "Orientasi uji",
    valueKeys: ["D", "A"],
    indicatorCodes: ["D1", "A1"],
    targetParticipants: null,
    isRequired: false,
  },
  {
    id: "00000000-0000-4000-8000-0000000000a3",
    semester: 3,
    name: "Latihan dasar kepemimpinan uji",
    valueKeys: ["M", "D"],
    indicatorCodes: ["M2", "D2"],
    targetParticipants: 110,
    isRequired: true,
  },
];

export const TEST_FORM_PARTS: FormParts = {
  choices: TEST_CHOICES,
  periods: [{ startYear: 2026, term: "odd", startsOn: "2026-08-01" }],
  counts: [
    { cohortYear: 2026, students: 120 },
    { cohortYear: 2025, students: 96 },
  ],
  today: "2026-10-13",
  newScheduleId: "00000000-0000-4000-8000-0000000000f1",
};

/**
 * A schedule of two days, not required, of an activity of semester 3 that
 * is not among the choices: it was removed from Kurikulum since.
 */
export const TEST_SCHEDULE: ScheduleRow = {
  id: "00000000-0000-4000-8000-000000000001",
  startsOn: "2026-10-13",
  endsOn: "2026-10-14",
  startTime: "07:30",
  endTime: "11:30",
  uploadCount: 1,
  uploadUnit: "week",
  location: "Aula asrama",
  isRequired: false,
  activity: {
    id: "00000000-0000-4000-8000-0000000000b3",
    name: "Latihan dasar kepemimpinan organisasi",
    valueKeys: ["M", "D"],
    indicatorCodes: ["M2", "D2"],
    targetParticipants: 110,
    isRequired: true,
  },
  target: { kind: "semester", semester: 3 },
  period: { startYear: 2026, term: "odd" },
  version: "2026-10-01T02:03:04.567Z",
};

/** A schedule of an extra activity for two angkatan, of 64 Aktif students. */
export const TEST_EXTRA_SCHEDULE: ScheduleRow = {
  ...TEST_SCHEDULE,
  id: "00000000-0000-4000-8000-000000000002",
  isRequired: true,
  activity: {
    id: "00000000-0000-4000-8000-0000000000b9",
    name: "Pelatihan kepemimpinan uji",
    valueKeys: ["A", "L"],
    indicatorCodes: ["A2", "L3"],
    targetParticipants: null,
    isRequired: true,
  },
  target: {
    kind: "chosen",
    choice: { kind: "cohorts", cohortYears: [2024, 2025] },
    participants: 64,
  },
};

/** A page of the list with no attendance read and no "Peserta" open. */
export const TEST_NO_ATTENDANCE: ListAttendance = { counts: {}, absent: null };
