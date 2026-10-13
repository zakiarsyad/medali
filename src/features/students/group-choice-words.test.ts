import { describe, expect, it } from "vitest";
import {
  type ChosenCohort,
  fittingGroups,
  groupChoiceWords,
  groupHint,
  keptGroupId,
} from "./group-choice-words";
import type { GroupChoice } from "./mentor-group-choices";

function group(id: string, parts: Partial<GroupChoice> = {}): GroupChoice {
  return {
    id,
    studyProgramId: 3,
    cohortYear: 2026,
    entryPath: "regular",
    number: 1,
    programCode: "D3PJK",
    mentorName: "Pengasuh Contoh",
    members: 28,
    ...parts,
  };
}

const CHOSEN: ChosenCohort = {
  cohortYear: "2026",
  studyProgramId: "3",
  entryPath: "regular",
};

describe("fittingGroups", () => {
  it("keeps the groups of the angkatan, program studi and jalur chosen", () => {
    const groups = [
      group("fits"),
      group("other-year", { cohortYear: 2025 }),
      group("other-program", { studyProgramId: 4 }),
      group("other-path", { entryPath: "transfer" }),
      group("fits-too", { number: 2 }),
    ];

    const fitting = fittingGroups(groups, CHOSEN);

    expect(fitting.map((one) => one.id)).toEqual(["fits", "fits-too"]);
  });

  it("gives none while no angkatan is chosen", () => {
    const none = fittingGroups([group("a")], { ...CHOSEN, cohortYear: "" });

    expect(none).toEqual([]);
  });
});

describe("keptGroupId", () => {
  it("keeps a chosen group that still fits", () => {
    expect(keptGroupId("a", [group("a"), group("b")])).toBe("a");
  });

  it("clears a group that no longer fits, the saved one too", () => {
    expect(keptGroupId("a", [group("b")])).toBe("");
    expect(keptGroupId("a", [])).toBe("");
  });

  it("stays on no group", () => {
    expect(keptGroupId("", [group("a")])).toBe("");
  });
});

describe("groupChoiceWords", () => {
  it("names the code, the mentor and how many Aktif members", () => {
    expect(groupChoiceWords(group("a"))).toBe(
      "KP 26-D3PJK-01 · Pengasuh Contoh · 28 anggota",
    );
  });

  it("writes a dash for a group without a mentor", () => {
    const words = groupChoiceWords(group("a", { mentorName: null }));

    expect(words).toBe("KP 26-D3PJK-01 · - · 28 anggota");
  });
});

describe("groupHint", () => {
  it("explains the choice while groups are offered", () => {
    expect(groupHint([group("a")], CHOSEN, "D3 Pajak")).toBe(
      "Pilih kelompok yang sudah ada untuk angkatan, prodi, dan jalur ini, atau biarkan kosong untuk diatur lewat Pengasuh > Penetapan angkatan baru.",
    );
  });

  it("says where groups are formed when there is none, naming what was chosen", () => {
    expect(groupHint([], CHOSEN, "D3 Pajak")).toBe(
      "Belum ada kelompok untuk angkatan 2026 D3 Pajak reguler. Kelompok dibentuk lewat Pengasuh > Penetapan angkatan baru.",
    );
    const transfer = { ...CHOSEN, entryPath: "transfer" };
    expect(groupHint([], transfer, "D4 Akuntansi")).toBe(
      "Belum ada kelompok untuk angkatan 2026 D4 Akuntansi alih program. Kelompok dibentuk lewat Pengasuh > Penetapan angkatan baru.",
    );
  });
});
