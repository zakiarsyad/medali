import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import type { ListedReplacement } from "./replacement-rows";
import {
  type ReplacementRowRights,
  ReplacementTable,
} from "./replacement-table";

const GROUP_ID = "00000000-0000-4000-8000-000000000001";
const EVERY_ROW: RowLimit = { kind: "all" };

const WAITING: ListedReplacement = {
  id: "00000000-0000-4000-8000-000000000002",
  startsOn: "2026-11-02",
  group: {
    id: GROUP_ID,
    studyProgramId: 7,
    cohortYear: 2025,
    entryPath: "regular",
    number: 1,
    programCode: "UJI",
  },
  members: 1234,
  oldMentorName: "Pengasuh Uji Lama",
  oldMentorStatus: "inactive",
  newMentorName: "Pengasuh Uji Baru",
  reason: "retirement",
  note: "Purnabakti akhir tahun.",
  letterNumber: "KEP-123/PKN/2026",
  status: "scheduled",
  cancelled: null,
};

const CANCELLED: ListedReplacement = {
  ...WAITING,
  id: "00000000-0000-4000-8000-000000000003",
  status: "cancelled",
  cancelled: { by: "Kepala Uji", at: new Date("2026-10-13T03:00:00Z") },
};

const IN_FORCE: ListedReplacement = {
  ...WAITING,
  id: "00000000-0000-4000-8000-000000000004",
  oldMentorStatus: "reserve",
  note: null,
  status: "in_force",
};

const KEPALA_UNIT: ReplacementRowRights = {
  groupLimit: EVERY_ROW,
  mayCancel: true,
};

const READER: ReplacementRowRights = {
  groupLimit: EVERY_ROW,
  mayCancel: false,
};

function shown(
  replacements: ListedReplacement[],
  rights: ReplacementRowRights = KEPALA_UNIT,
): string {
  return renderToStaticMarkup(
    <ReplacementTable replacements={replacements} rights={rights} />,
  );
}

describe("ReplacementTable", () => {
  it("shows the date, the group with its size, the old mentor and what they become, the new mentor, the reason with its note, the letter and the status", () => {
    const table = shown([WAITING]);

    for (const words of [
      "2 Nov 2026",
      "KP 25-UJI-01",
      "1.234 mahasiswa",
      "Pengasuh Uji Lama",
      "menjadi tidak aktif",
      "Pengasuh Uji Baru",
      "Pensiun",
      "Purnabakti akhir tahun.",
      "KEP-123/PKN/2026",
      "Terjadwal",
    ]) {
      expect(table).toContain(words);
    }
  });

  it("says menjadi cadangan for an old mentor who stays, and names Berlaku", () => {
    const table = shown([IN_FORCE]);

    expect(table).toContain("menjadi cadangan");
    expect(table).toContain("Berlaku");
  });

  it("says who cancelled a replacement and when", () => {
    const table = shown([CANCELLED]);

    expect(table).toContain("Dibatalkan");
    expect(table).toContain("13 Okt 2026 · Kepala Uji");
  });

  it("links the code to the page of the group for an account that may open it, and not for another", () => {
    const link = `href="/pengasuh/kelompok?kelompok=${GROUP_ID}"`;
    const otherProgram: RowLimit = {
      kind: "some",
      studyProgramIds: [8],
      menteesOf: [],
      studentIds: [],
    };

    expect(shown([WAITING])).toContain(link);
    expect(
      shown([WAITING], { groupLimit: otherProgram, mayCancel: false }),
    ).not.toContain(link);
    expect(
      shown([WAITING], { groupLimit: null, mayCancel: false }),
    ).not.toContain(link);
  });

  it("has Batalkan on a row that waits, for an account that may cancel only", () => {
    expect(shown([WAITING])).toContain("Batalkan");
    expect(shown([WAITING], READER)).not.toContain("Batalkan");
  });

  it("has no Batalkan on a row that is in force or cancelled", () => {
    expect(shown([IN_FORCE])).not.toContain("Batalkan");
    expect(shown([CANCELLED])).not.toContain("Batalkan");
  });

  it("gives every row a title for each value, so a phone shows it as a card", () => {
    const table = shown([WAITING]);

    for (const title of [
      "Tanggal efektif",
      "Kelompok",
      "Pengasuh lama",
      "Pengganti",
      "Alasan",
      "Surat",
      "Status",
    ]) {
      expect(table).toContain(`data-title="${title}"`);
    }
  });

  it("says so when there is no replacement", () => {
    expect(shown([])).toContain("Belum ada penggantian pengasuh.");
  });
});
