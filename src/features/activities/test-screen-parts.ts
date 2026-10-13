import type { ActivityChoice } from "./activity-choices";
import type { FormParts } from "./form-values";
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

/** A schedule of two days of the semester 3 activity, not required. */
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
    name: "Latihan dasar kepemimpinan organisasi",
    semester: 3,
    indicatorCodes: ["M2", "D2"],
    targetParticipants: 110,
  },
  period: { startYear: 2026, term: "odd" },
};
