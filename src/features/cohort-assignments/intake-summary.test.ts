import { describe, expect, it } from "vitest";
import { batchLabel, intakeSummary } from "./intake-summary";

const PAJAK_PUTRA = {
  sex: "male",
  entryPath: "regular",
  programName: "D3 Pajak",
} as const;
const PAJAK_PUTRI = { ...PAJAK_PUTRA, sex: "female" } as const;
const PAJAK_ALIH = { ...PAJAK_PUTRI, entryPath: "transfer" } as const;
const AKUNTANSI = { ...PAJAK_PUTRI, programName: "D3 Akuntansi" } as const;

describe("batchLabel", () => {
  it("names the alih program jalur after the program studi", () => {
    expect(batchLabel(PAJAK_PUTRA)).toBe("D3 Pajak");
    expect(batchLabel(PAJAK_ALIH)).toBe("D3 Pajak (alih program)");
  });
});

describe("intakeSummary", () => {
  it("counts the students, putra and putri", () => {
    const summary = intakeSummary([PAJAK_PUTRA, PAJAK_PUTRI, AKUNTANSI]);

    expect(summary).toMatchObject({ students: 3, male: 1, female: 2 });
  });

  it("counts each program studi and jalur apart, by name", () => {
    const summary = intakeSummary([
      PAJAK_ALIH,
      PAJAK_PUTRA,
      AKUNTANSI,
      PAJAK_PUTRI,
    ]);

    expect(summary.batches).toEqual([
      { label: "D3 Akuntansi", students: 1 },
      { label: "D3 Pajak", students: 2 },
      { label: "D3 Pajak (alih program)", students: 1 },
    ]);
  });

  it("counts nothing for no student", () => {
    expect(intakeSummary([])).toEqual({
      students: 0,
      male: 0,
      female: 0,
      batches: [],
    });
  });
});
