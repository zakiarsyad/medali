import { describe, expect, it } from "vitest";
import { PROOF_KINDS, type ProofKind } from "./proof-kinds";
import {
  DECIDED_STATUSES,
  isRemovable,
  type KeepingRule,
  type KeptProof,
} from "./removable";

const ODD = { startsOn: "2025-08-01", endsOn: "2026-01-31" };
const EVEN = { startsOn: "2026-02-01", endsOn: "2026-07-31" };

/** 30 days after the odd period ended is 2026-03-02. */
const RULE: KeepingRule = {
  keepDays: 30,
  periods: [EVEN, ODD],
  today: "2026-03-05",
};

const WAITING: Record<ProofKind, string[]> = {
  attendance_photo: ["waiting"],
  siku_photo: ["waiting"],
  return_photo: ["waiting", "verified"],
  activity_clarification: ["submitted"],
  dorm_clarification: ["submitted", "verified"],
  appeal_proof: ["waiting"],
};

function decided(kind: ProofKind, sentOn: string | null): KeptProof {
  const [status = ""] = DECIDED_STATUSES[kind];
  return { kind, status, sentOn, isScheduleRemoved: false };
}

/** Each kind with each of its statuses. */
function pairsOf(
  statuses: Record<ProofKind, readonly string[]>,
): [ProofKind, string][] {
  return PROOF_KINDS.flatMap((kind) =>
    statuses[kind].map((status): [ProofKind, string] => [kind, status]),
  );
}

describe("isRemovable", () => {
  it.each(PROOF_KINDS)(
    "removes a decided %s sent in a period that ended long enough ago",
    (kind) => {
      expect(isRemovable(decided(kind, "2025-10-01"), RULE)).toBe(true);
    },
  );

  it.each(pairsOf(DECIDED_STATUSES))(
    "counts %s with status %s as decided",
    (kind, status) => {
      const file = {
        kind,
        status,
        sentOn: "2025-10-01",
        isScheduleRemoved: false,
      };
      expect(isRemovable(file, RULE)).toBe(true);
    },
  );

  it.each(pairsOf(WAITING))(
    "never removes %s whose record still waits as %s",
    (kind, status) => {
      const file = {
        kind,
        status,
        sentOn: "2025-10-01",
        isScheduleRemoved: false,
      };
      expect(isRemovable(file, RULE)).toBe(false);
    },
  );

  describe("a file of a removed schedule", () => {
    const SCHEDULE_KINDS: [ProofKind, string][] = [
      ["attendance_photo", "waiting"],
      ["activity_clarification", "submitted"],
    ];

    it.each(SCHEDULE_KINDS)(
      "removes %s still waiting as %s once its period ended long enough ago",
      (kind, status) => {
        const file = { kind, status, sentOn: "2025-10-01" };
        expect(isRemovable({ ...file, isScheduleRemoved: true }, RULE)).toBe(
          true,
        );
        expect(isRemovable({ ...file, isScheduleRemoved: false }, RULE)).toBe(
          false,
        );
      },
    );

    it("keeps it while its period did not end long enough ago", () => {
      const file = {
        kind: "attendance_photo" as const,
        status: "waiting",
        sentOn: "2026-02-10",
        isScheduleRemoved: true,
      };
      expect(isRemovable(file, RULE)).toBe(false);
    });

    it("keeps it while the number of days is not set", () => {
      const file = {
        kind: "attendance_photo" as const,
        status: "waiting",
        sentOn: "2025-10-01",
        isScheduleRemoved: true,
      };
      expect(isRemovable(file, { ...RULE, keepDays: null })).toBe(false);
    });
  });

  it("removes nothing while the number of days is not set", () => {
    const file = decided("attendance_photo", "2025-10-01");
    expect(isRemovable(file, { ...RULE, keepDays: null })).toBe(false);
  });

  it("keeps a file of a period that ended exactly the set days ago", () => {
    const file = decided("attendance_photo", "2025-10-01");
    expect(isRemovable(file, { ...RULE, today: "2026-03-02" })).toBe(false);
    expect(isRemovable(file, { ...RULE, today: "2026-03-03" })).toBe(true);
  });

  it("keeps a file of the running period", () => {
    expect(isRemovable(decided("siku_photo", "2026-02-10"), RULE)).toBe(false);
  });

  it("counts the first and the last day as part of the period", () => {
    expect(isRemovable(decided("siku_photo", "2025-08-01"), RULE)).toBe(true);
    expect(isRemovable(decided("siku_photo", "2026-01-31"), RULE)).toBe(true);
    expect(isRemovable(decided("siku_photo", "2026-02-01"), RULE)).toBe(false);
  });

  it("keeps a file sent on a day no period holds", () => {
    expect(isRemovable(decided("return_photo", "2025-07-15"), RULE)).toBe(
      false,
    );
  });

  it("keeps a file with no day sent", () => {
    expect(isRemovable(decided("attendance_photo", null), RULE)).toBe(false);
  });

  it("keeps everything with a longer time set", () => {
    const file = decided("appeal_proof", "2025-10-01");
    expect(isRemovable(file, { ...RULE, keepDays: 365 })).toBe(false);
  });
});
