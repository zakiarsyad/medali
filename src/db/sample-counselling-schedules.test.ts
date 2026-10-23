import { describe, expect, it } from "vitest";
import type { Scores } from "@/character-scores/assessment-score";
import { coachingNeedOf } from "@/character-scores/coaching-need";
import { assignmentBasis } from "@/discipline-penalties/assignment-basis";
import { limitedScores, limitOf } from "@/discipline-penalties/score-limit";
import { callReason } from "@/features/counselling/assessment-call-rules";
import {
  ACTIVE_STATUSES,
  SCHEDULE_STATUSES,
} from "@/mental-health/schedule-ids";
import { SAMPLE_ASSESSMENTS } from "./sample-character-assessments";
import { SAMPLE_CONSENTS } from "./sample-counselling-consents";
import {
  isSenderScheduleStep,
  isStudentScheduleStep,
  SAMPLE_ASSIGNMENTS,
  SAMPLE_SCHEDULES,
} from "./sample-counselling-schedules";
import { SAMPLE_STUDENTS } from "./sample-data";
import { SAMPLE_DISCIPLINE_PENALTIES } from "./sample-discipline-penalties";

const ASSIGNMENT_STATUSES = [
  "awaiting",
  "scheduled",
  "reschedule_asked",
  "done",
  "missed",
] as const;

const VOLUNTARY_STATUSES = SCHEDULE_STATUSES.filter(
  (status) => status !== "awaiting" && status !== "reschedule_asked",
);

const NIMS = new Set(SAMPLE_STUDENTS.map((student) => student.nim));

describe("the sample requests for counselling", () => {
  it.each(SAMPLE_SCHEDULES)(
    "name a sample student, start by registering, with steps oldest first: $nim",
    (sample) => {
      expect(NIMS.has(sample.nim)).toBe(true);
      expect(sample.steps[0]?.step).toBe("register");
      const days = sample.steps.map((step) => step.daysAgo);
      expect(days).toEqual([...days].sort((one, other) => other - one));
    },
  );

  it("are about a coming day while waiting, and a day gone by once finished", () => {
    for (const sample of SAMPLE_SCHEDULES) {
      const status = sample.steps.at(-1)?.statusAfter ?? "submitted";
      if (status === "scheduled") continue;
      const isActive = ACTIVE_STATUSES.includes(status);
      expect(sample.inDays > 0, sample.nim).toBe(isActive);
    }
  });

  it("hold a Dijadwalkan session whose day has come, for Konselor to mark", () => {
    const due = SAMPLE_SCHEDULES.filter(
      (sample) =>
        sample.steps.at(-1)?.statusAfter === "scheduled" && sample.inDays < 0,
    );
    expect(due).toHaveLength(1);
  });

  it("give each student at most one active request, and one of each status", () => {
    const actives = SAMPLE_SCHEDULES.filter((sample) =>
      ACTIVE_STATUSES.includes(sample.steps.at(-1)?.statusAfter ?? "done"),
    ).map((sample) => sample.nim);
    expect(new Set(actives).size).toBe(actives.length);
    const kinds = SAMPLE_SCHEDULES.map(
      (sample) => `${sample.nim} ${sample.steps.at(-1)?.statusAfter}`,
    );
    expect(new Set(kinds).size).toBe(kinds.length);
  });

  it("end in every status of a voluntary request", () => {
    const lasts = SAMPLE_SCHEDULES.map((sample) => sample.steps.at(-1));
    for (const status of VOLUNTARY_STATUSES) {
      expect(lasts.some((step) => step?.statusAfter === status)).toBe(true);
    }
  });

  it("are each of a student who gave their consent", () => {
    for (const sample of SAMPLE_SCHEDULES) {
      const consent = SAMPLE_CONSENTS.find((each) => each.nim === sample.nim);
      const gave = consent?.steps.some((step) => step.status === "approved");
      expect(gave, sample.nim).toBe(true);
    }
  });

  it("leave approving, proposing, moving and marking to Konselor, and the rest to the student", () => {
    for (const step of [
      "register",
      "accept",
      "ask_another",
      "cancel",
    ] as const) {
      expect(isStudentScheduleStep(step)).toBe(true);
    }
    for (const step of [
      "approve",
      "propose",
      "reschedule",
      "mark_done",
      "mark_missed",
    ] as const) {
      expect(isStudentScheduleStep(step)).toBe(false);
    }
  });
});

/** What "Dasar" of a Penugasan may hold: the Kategori and the Jenjang. */
const PENALTY_BASIS =
  /^Pelanggaran disiplin (ringan|sedang|berat) jenjang (pertama|kedua|ketiga)$/;

function lastStatusOf(sample: { steps: { statusAfter: string }[] }) {
  return sample.steps.at(-1)?.statusAfter ?? "done";
}

describe("the sample assignments of counselling", () => {
  it.each(SAMPLE_ASSIGNMENTS)(
    "name a sample student, start with the sender, with steps oldest first: $nim",
    (sample) => {
      expect(NIMS.has(sample.nim)).toBe(true);
      const first = sample.kind === "assigned" ? "assign" : "call";
      expect(sample.steps[0]).toMatchObject({
        step: first,
        statusAfter: "awaiting",
      });
      const days = sample.steps.map((step) => step.daysAgo);
      expect(days).toEqual([...days].sort((one, other) => other - one));
    },
  );

  it("end in every status of an assignment, of both kinds", () => {
    const lasts = SAMPLE_ASSIGNMENTS.map(lastStatusOf);
    for (const status of ASSIGNMENT_STATUSES) {
      expect(lasts).toContain(status);
    }
    const kinds = new Set(SAMPLE_ASSIGNMENTS.map((sample) => sample.kind));
    expect(kinds).toEqual(new Set(["assigned", "called"]));
  });

  it("have a time only once Konselor set one, coming while active", () => {
    for (const sample of SAMPLE_ASSIGNMENTS) {
      const status = lastStatusOf(sample);
      expect(sample.time === null, sample.nim).toBe(status === "awaiting");
      if (sample.time === null) continue;
      const isActive = ACTIVE_STATUSES.some((each) => each === status);
      expect(sample.time.inDays > 0, sample.nim).toBe(isActive);
    }
  });

  it("hold in Dasar of a Penugasan only the Kategori and Jenjang", () => {
    for (const sample of SAMPLE_ASSIGNMENTS) {
      if (sample.kind !== "assigned") continue;
      expect(sample.basis, sample.nim).toMatch(PENALTY_BASIS);
    }
  });

  it("are sent from a penalty only as a Penugasan, of the student's one sample penalty, with that penalty's Kategori and Jenjang as Dasar", () => {
    const fromPenalty = SAMPLE_ASSIGNMENTS.filter(
      (sample) => sample.fromPenalty,
    );
    expect(fromPenalty.length).toBeGreaterThan(0);
    for (const sample of fromPenalty) {
      expect(sample.kind, sample.nim).toBe("assigned");
      const penalties = SAMPLE_DISCIPLINE_PENALTIES.filter(
        (penalty) => penalty.nim === sample.nim,
      );
      expect(penalties, sample.nim).toHaveLength(1);
      const [penalty] = penalties;
      if (!penalty) continue;
      expect(sample.basis).toBe(
        assignmentBasis(penalty.category, penalty.level),
      );
    }
  });

  it("leave some sample penalties with no Penugasan sent from them", () => {
    const sentFrom = new Set(
      SAMPLE_ASSIGNMENTS.filter((sample) => sample.fromPenalty).map(
        (sample) => sample.nim,
      ),
    );
    const without = SAMPLE_DISCIPLINE_PENALTIES.filter(
      (penalty) => !sentFrom.has(penalty.nim),
    );
    expect(without.length).toBeGreaterThan(0);
  });

  it("give one student an assignment beside an active voluntary request", () => {
    const isActive = (status: string) =>
      ACTIVE_STATUSES.some((each) => each === status);
    const voluntary = SAMPLE_SCHEDULES.filter((sample) =>
      isActive(lastStatusOf(sample)),
    ).map((sample) => sample.nim);
    const beside = SAMPLE_ASSIGNMENTS.filter(
      (sample) =>
        isActive(lastStatusOf(sample)) && voluntary.includes(sample.nim),
    );
    expect(beside.length).toBeGreaterThan(0);
  });

  it("give a Dijadwalkan one to a student whose consent is not Disetujui", () => {
    const withoutConsent = SAMPLE_ASSIGNMENTS.filter((sample) => {
      const consent = SAMPLE_CONSENTS.find((each) => each.nim === sample.nim);
      return (
        lastStatusOf(sample) === "scheduled" &&
        consent?.steps.at(-1)?.status !== "approved"
      );
    });
    expect(withoutConsent.length).toBeGreaterThan(0);
  });

  it("leave the first step to the sender, asking again to the student, and the rest to Konselor", () => {
    expect(isSenderScheduleStep("assign")).toBe(true);
    expect(isSenderScheduleStep("call")).toBe(true);
    expect(isSenderScheduleStep("set_time")).toBe(false);
    expect(isSenderScheduleStep("ask_another")).toBe(false);
    expect(isStudentScheduleStep("assign")).toBe(false);
    expect(isStudentScheduleStep("set_time")).toBe(false);
  });
});

const ACTIVE_NIMS = new Set(
  SAMPLE_STUDENTS.filter(
    (student) => (student.status ?? "active") === "active",
  ).map((student) => student.nim),
);

/**
 * A sample student's latest assessment, its scores as every screen shows
 * them: held at 70 under a sample Ringan or Sedang penalty.
 */
function latestOf(nim: string): { scores: Scores; daysAgo: number } | null {
  const latest = SAMPLE_ASSESSMENTS.filter((each) => each.nim === nim).at(-1);
  if (!latest) return null;
  const [M, E, D, A, L, I] = latest.scores;
  const penalties = SAMPLE_DISCIPLINE_PENALTIES.filter(
    (penalty) => penalty.nim === nim,
  );
  const limited = limitOf(penalties) !== null;
  const scores = limitedScores({ M, E, D, A, L, I }, limited);
  return { scores, daysAgo: latest.daysAgo };
}

function isListed(nim: string): boolean {
  const latest = latestOf(nim);
  if (!ACTIVE_NIMS.has(nim) || latest === null) return false;
  return coachingNeedOf(latest.scores) !== null;
}

describe("the sample Pemanggilan calls", () => {
  const calls = SAMPLE_ASSIGNMENTS.filter((sample) => sample.kind === "called");

  it.each(calls)(
    "are of a listed student, sent after their latest assessment, with its reason as Dasar and no Pesan pengirim: $nim",
    (sample) => {
      expect(isListed(sample.nim)).toBe(true);
      const latest = latestOf(sample.nim);
      const need = latest && coachingNeedOf(latest.scores);
      if (!latest || !need) throw new Error("The student is not listed.");
      expect(sample.basis).toBe(callReason(latest.scores, need));
      expect(sample.senderMessage).toBeNull();
      expect(sample.steps[0]?.daysAgo).toBeLessThan(latest.daysAgo);
    },
  );

  it("are one per student, one waiting for its time and one with a time set", () => {
    const nims = calls.map((sample) => sample.nim);
    expect(new Set(nims).size).toBe(nims.length);
    const lasts = calls.map(lastStatusOf);
    expect(lasts).toContain("awaiting");
    expect(lasts).toContain("scheduled");
  });

  it("leave a listed student with no call, to call from Asesmen karakter", () => {
    const called = new Set(calls.map((sample) => sample.nim));
    const listed = SAMPLE_STUDENTS.map((student) => student.nim).filter(
      isListed,
    );
    expect(listed.some((nim) => !called.has(nim))).toBe(true);
  });
});
