import { describe, expect, it } from "vitest";
import { may } from "@/auth/access";
import {
  cohortAssignmentChangeAction,
  cohortAssignmentStatus,
} from "@/db/schema";
import {
  ASSIGNMENT_STEPS,
  type AssignmentStatus,
  CHANGE_TITLES,
  changeActionOf,
  NOT_FORMED_TITLE,
  STATUS_TITLES,
  STEP_ACTIONS,
  statusAfter,
} from "./assignment-steps";

const STATUSES = cohortAssignmentStatus.enumValues;

describe("the status titles", () => {
  it("are the words of the screen", () => {
    expect(STATUSES.map((status) => STATUS_TITLES[status])).toEqual([
      "Draf",
      "Diajukan",
      "Ditetapkan",
      "Dibatalkan",
    ]);
    expect(NOT_FORMED_TITLE).toBe("Belum dibentuk");
  });
});

describe("statusAfter", () => {
  it("starts a draft when groups are formed for an angkatan without a penetapan", () => {
    expect(statusAfter(null, "form")).toBe("draft");
  });

  it.each(["save", "submit", "fix", "cancel"] as const)(
    "has nothing to %s for an angkatan without a penetapan",
    (step) => {
      expect(statusAfter(null, step)).toBe(null);
    },
  );

  it("goes from draft to submitted to fixed to cancelled", () => {
    expect(statusAfter("draft", "submit")).toBe("submitted");
    expect(statusAfter("submitted", "fix")).toBe("fixed");
    expect(statusAfter("fixed", "cancel")).toBe("cancelled");
  });

  it("lets a draft be fixed without being submitted first", () => {
    expect(statusAfter("draft", "fix")).toBe("fixed");
  });

  it("keeps a draft a draft and a submitted one submitted when saved", () => {
    expect(statusAfter("draft", "save")).toBe("draft");
    expect(statusAfter("submitted", "save")).toBe("submitted");
    expect(statusAfter("submitted", "submit")).toBe("submitted");
  });

  it("lets a cancelled one be saved, submitted and fixed again", () => {
    expect(statusAfter("cancelled", "save")).toBe("draft");
    expect(statusAfter("cancelled", "submit")).toBe("submitted");
    expect(statusAfter("cancelled", "fix")).toBe("fixed");
  });

  it.each(["draft", "submitted", "cancelled"] as const)(
    "makes a %s one a draft when its groups are formed again",
    (status) => {
      expect(statusAfter(status, "form")).toBe("draft");
    },
  );

  it.each(["form", "save", "submit", "fix"] as const)(
    "refuses to %s a fixed one",
    (step) => {
      expect(statusAfter("fixed", step)).toBe(null);
    },
  );

  it.each(["draft", "submitted", "cancelled"] as const)(
    "refuses to cancel a %s one",
    (status) => {
      expect(statusAfter(status, "cancel")).toBe(null);
    },
  );

  it("has no step that sends a submitted one back to draft with its groups kept", () => {
    const keepingGroups = ASSIGNMENT_STEPS.filter((step) => step !== "form");
    const after = keepingGroups.map((step) => statusAfter("submitted", step));

    expect(after).not.toContain("draft");
  });
});

describe("changeActionOf", () => {
  it("says the groups were formed the first time, and formed again after that", () => {
    expect(changeActionOf("form", null)).toBe("groups_formed");
    for (const status of STATUSES) {
      expect(changeActionOf("form", status)).toBe("groups_reformed");
    }
  });

  it.each([
    ["save", "draft_saved"],
    ["submit", "submitted"],
    ["fix", "fixed"],
    ["cancel", "cancelled"],
  ] as const)("writes %s as %s, whatever the status", (step, action) => {
    const statuses: (AssignmentStatus | null)[] = [null, ...STATUSES];
    for (const status of statuses) {
      expect(changeActionOf(step, status)).toBe(action);
    }
  });

  it("has the words of the prototype for every line of the log", () => {
    const actions = cohortAssignmentChangeAction.enumValues;
    expect(actions.map((action) => CHANGE_TITLES[action])).toEqual([
      "Membentuk kelompok",
      "Membentuk ulang kelompok",
      "Menyimpan draf",
      "Mengajukan ke Kepala UPK",
      "Menetapkan",
      "Membatalkan",
    ]);
  });
});

describe("the right each step asks for", () => {
  it.each(["form", "save", "submit"] as const)(
    "lets Pegawai UPK and Kepala Unit %s, and refuses Direktur, Ketua Program Studi and Pengasuh",
    (step) => {
      const action = STEP_ACTIONS[step];
      expect(may(["upk_staff"], action)).toBe(true);
      expect(may(["head_of_unit"], action)).toBe(true);
      expect(may(["director"], action)).toBe(false);
      expect(may(["head_of_program"], action)).toBe(false);
      expect(may(["mentor"], action)).toBe(false);
    },
  );

  it.each(["fix", "cancel"] as const)(
    "lets Kepala Unit %s, and refuses Pegawai UPK and every reader",
    (step) => {
      const action = STEP_ACTIONS[step];
      expect(may(["head_of_unit"], action)).toBe(true);
      expect(may(["upk_staff"], action)).toBe(false);
      expect(may(["director"], action)).toBe(false);
      expect(may(["head_of_program"], action)).toBe(false);
      expect(may(["mentor"], action)).toBe(false);
    },
  );
});
