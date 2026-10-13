import type { StudentActivities } from "./student-activities";
import type { StudentSchedule } from "./student-schedule";

/* Made-up screen data for the checks of the student's page of this area. */

/** The moment the checks look at the page: 13 October, eight in the morning. */
export const TEST_NOW = { day: "2026-10-13", time: "08:00" };

/**
 * A required schedule of the morning of 13 October, with photos taken
 * until the end of 14 October, and nothing sent by the student.
 */
export const TEST_STUDENT_SCHEDULE: StudentSchedule = {
  id: "00000000-0000-4000-8000-0000000000c1",
  startsOn: "2026-10-13",
  endsOn: "2026-10-13",
  startTime: "07:30",
  endTime: "11:30",
  uploadCount: 1,
  uploadUnit: "day",
  location: "Aula asrama",
  isRequired: true,
  name: "Latihan dasar kepemimpinan organisasi",
  description: "Latihan memimpin rapat dan membagi tugas.",
  valueKeys: ["M", "D"],
  attendance: null,
};

export const TEST_SENT_PHOTO = {
  status: "waiting",
  note: "",
  sentAt: new Date("2026-10-13T02:05:00Z"),
} as const;

/** The page of a student in semester 3 with nothing on it. */
export const TEST_EMPTY_ACTIVITIES: StudentActivities = {
  now: TEST_NOW,
  semester: 3,
  score: { attended: 0, counted: 0 },
  waiting: 0,
  dispensations: 0,
  current: [],
  coming: [],
  history: { schedules: [], matching: 0, page: 1 },
};
