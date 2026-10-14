import { describe, expect, it } from "vitest";
import { MAX_FILE_ROWS } from "@/files/csv-file";
import { BASIS_TOO_LONG, NOTE_TOO_LONG } from "./entry-input";
import {
  type FileStudent,
  fileNims,
  NEEDS_DIRECTOR_NOTE,
  NOT_ACTIVE,
  NOT_VISIBLE,
  POINTS_NOT_IN_RANGE,
  readSikuFile,
  type SikuFileRows,
  sikuFileRows,
  UNKNOWN_KIND,
  UNKNOWN_NIM,
  UNKNOWN_REASON,
} from "./siku-file";
import { sikuTemplateCsv } from "./siku-file-columns";

const TITLES = "nim,jenis,alasan,poin,keterangan";

const STUDENTS = new Map<string, FileStudent>([
  ["4121230001", { id: "a", name: "Ani", active: true, visible: true }],
  ["4121230002", { id: "b", name: "Budi", active: true, visible: true }],
  ["4121230003", { id: "c", name: "Cuti", active: false, visible: true }],
  ["4121230004", { id: "d", name: "Jauh", active: true, visible: false }],
  ["4121239999", { id: "t", name: "Templat", active: true, visible: true }],
]);

function read(...lines: string[]): SikuFileRows {
  const result = readSikuFile(lines.join("\n"));
  if (!result.ok) throw new Error(result.error);
  return sikuFileRows(result.value, STUDENTS);
}

function reasonFor(line: string): string | undefined {
  return read(TITLES, line).skipped[0]?.reason;
}

describe("readSikuFile and sikuFileRows", () => {
  it("reads the template: its example row is a ready gain", () => {
    const result = readSikuFile(sikuTemplateCsv());
    if (!result.ok) throw new Error(result.error);

    expect(sikuFileRows(result.value, STUDENTS)).toEqual({
      ready: [
        {
          row: 2,
          studentId: "t",
          nim: "4121239999",
          name: "Templat",
          kind: "gain",
          reason: "spiritual_activity",
          points: 2,
          note: "Petugas kegiatan ibadah rutin",
          basis: "",
        },
      ],
      skipped: [],
    });
  });

  it("reads a gain and a loss, with the reason by its number in the prototype's order", () => {
    const rows = read(
      TITLES,
      "4121230001,tambah,1,3,Konten kampanye",
      "4121230002,kurang,3,5,Tidak hadir apel",
    );

    expect(rows.skipped).toEqual([]);
    expect(rows.ready).toMatchObject([
      {
        row: 2,
        kind: "gain",
        reason: "social_media_campaign",
        points: 3,
        note: "Konten kampanye",
      },
      {
        row: 3,
        kind: "loss",
        reason: "unannounced_absence",
        points: 5,
        note: "Tidak hadir apel",
      },
    ]);
  });

  it.each(["tambah", "TAMBAH", "Penambahan", "+"])(
    "reads %s as a gain",
    (jenis) => {
      expect(read(TITLES, `4121230001,${jenis},1,2,`).ready[0]?.kind).toBe(
        "gain",
      );
    },
  );

  it.each(["kurang", "Kurang", "PENGURANGAN", "-", "−"])(
    "reads %s as a loss",
    (jenis) => {
      expect(read(TITLES, `4121230001,${jenis},1,2,`).ready[0]?.kind).toBe(
        "loss",
      );
    },
  );

  it("reads a reason by its whole words or their beginning, in any case", () => {
    const rows = read(
      TITLES,
      "4121230001,tambah,Aktif dalam kegiatan spiritual,2,",
      "4121230001,tambah,melakukan pembimbingan,2,",
      "4121230001,kurang,HUKUMAN,2,",
    );

    expect(rows.ready.map((row) => row.reason)).toEqual([
      "spiritual_activity",
      "peer_mentoring",
      "discipline_penalty",
    ]);
  });

  it("takes the first reason in the prototype's order when a beginning fits more than one", () => {
    expect(
      read(TITLES, "4121230001,tambah,melakukan,2,").ready[0]?.reason,
    ).toBe("social_media_campaign");
  });

  it("puts the keterangan of a decision of the Direktur in its Dasar, with an empty note", () => {
    const [row] = read(TITLES, "4121230002,kurang,4,10,SK-01/2026").ready;

    expect(row).toMatchObject({
      reason: "director_decision",
      note: "",
      basis: "SK-01/2026",
    });
  });

  it("keeps every row of a student who is in the file several times", () => {
    const rows = read(
      TITLES,
      "4121230001,tambah,1,2,",
      "4121230001,tambah,1,2,",
      "4121230001,kurang,1,4,",
    );

    expect(rows.ready.map((row) => [row.row, row.studentId])).toEqual([
      [2, "a"],
      [3, "a"],
      [4, "a"],
    ]);
  });

  it("reads a file without the column keterangan, its notes empty", () => {
    const [row] = read("nim,jenis,alasan,poin", "4121230001,tambah,2,1").ready;

    expect(row).toMatchObject({ reason: "knowledge_sharing", note: "" });
  });

  it("follows the titles of the first row in any order", () => {
    const [row] = read("poin,NIM,Alasan,jenis", "7,4121230001,2,kurang").ready;

    expect(row).toMatchObject({
      nim: "4121230001",
      kind: "loss",
      reason: "discipline_penalty",
      points: 7,
    });
  });

  it("reads the columns in the order of the template when the first row is a student", () => {
    const rows = read("4121230001,tambah,1,2,Satu", "4121230002,kurang,2,3,");

    expect(rows.ready.map((row) => [row.row, row.nim])).toEqual([
      [1, "4121230001"],
      [2, "4121230002"],
    ]);
  });

  it.each([
    ["an unknown NIM", "4121239876,tambah,1,2,", UNKNOWN_NIM],
    ["an empty NIM", ",tambah,1,2,", UNKNOWN_NIM],
    ["a student who is not Aktif", "4121230003,tambah,1,2,", NOT_ACTIVE],
    [
      "a student the account does not see",
      "4121230004,tambah,1,2,",
      NOT_VISIBLE,
    ],
    ["an unknown jenis", "4121230001,naik,1,2,", UNKNOWN_KIND],
    ["an empty jenis", "4121230001,,1,2,", UNKNOWN_KIND],
    ["a number past the gains", "4121230001,tambah,6,2,", UNKNOWN_REASON],
    ["a number past the losses", "4121230001,kurang,5,2,", UNKNOWN_REASON],
    ["a reason zero", "4121230001,kurang,0,2,", UNKNOWN_REASON],
    [
      "a reason of the other kind",
      "4121230001,tambah,Pelanggaran,2,",
      UNKNOWN_REASON,
    ],
    ["an empty reason", "4121230001,tambah,,2,", UNKNOWN_REASON],
    ["no points", "4121230001,tambah,1,,", POINTS_NOT_IN_RANGE],
    ["zero points", "4121230001,tambah,1,0,", POINTS_NOT_IN_RANGE],
    ["31 points", "4121230001,tambah,1,31,", POINTS_NOT_IN_RANGE],
    [
      "points that are not whole",
      "4121230001,tambah,1,2.5,",
      POINTS_NOT_IN_RANGE,
    ],
    [
      "points that are not a number",
      "4121230001,tambah,1,dua,",
      POINTS_NOT_IN_RANGE,
    ],
    [
      "a decision of the Direktur with no keterangan",
      "4121230001,kurang,4,5,",
      NEEDS_DIRECTOR_NOTE,
    ],
  ])("skips %s", (_, line, reason) => {
    expect(reasonFor(line)).toBe(reason);
  });

  it("skips a keterangan longer than the form takes, in the form's words", () => {
    const longNote = "a".repeat(501);
    const longBasis = "b".repeat(201);

    expect(
      reasonFor(`4121230001,tambah,1,2,${"a".repeat(500)}`),
    ).toBeUndefined();
    expect(reasonFor(`4121230001,tambah,1,2,${longNote}`)).toBe(NOTE_TOO_LONG);
    expect(
      reasonFor(`4121230001,kurang,4,2,${"b".repeat(200)}`),
    ).toBeUndefined();
    expect(reasonFor(`4121230001,kurang,4,2,${longBasis}`)).toBe(
      BASIS_TOO_LONG,
    );
  });

  it("says the messages of the prototype, each ending with a period", () => {
    expect([
      UNKNOWN_NIM,
      NOT_ACTIVE,
      NOT_VISIBLE,
      UNKNOWN_KIND,
      UNKNOWN_REASON,
      POINTS_NOT_IN_RANGE,
      NEEDS_DIRECTOR_NOTE,
    ]).toEqual([
      "NIM tidak ada dalam data mahasiswa.",
      "Mahasiswa tidak aktif.",
      "Di luar mahasiswa yang dapat Anda kelola.",
      "Jenis harus tambah atau kurang.",
      "Alasan tidak dikenali.",
      "Poin harus 1–30.",
      "Ketentuan keputusan Direktur wajib disertai keterangan atau nomor surat.",
    ]);
  });

  it("gives each skipped row its number in the file and its NIM, cut short", () => {
    const rows = read(
      TITLES,
      "4121230001,tambah,1,2,",
      "",
      `${"9".repeat(30)},tambah,1,2,`,
    );

    expect(rows.skipped).toEqual([
      { row: 4, nim: "9".repeat(20), reason: UNKNOWN_NIM },
    ]);
  });

  it("names each NIM of the file once, to look the students up", () => {
    const result = readSikuFile(
      [
        TITLES,
        "4121230001,tambah,1,2,",
        "4121230001,kurang,1,2,",
        ",x,,,",
      ].join("\n"),
    );
    if (!result.ok) throw new Error(result.error);

    expect(fileNims(result.value)).toEqual(["4121230001"]);
  });
});

describe("readSikuFile refusals", () => {
  it("refuses a file whose titles lack a column, and names it", () => {
    expect(readSikuFile("nim,jenis,poin\n4121230001,tambah,2")).toEqual({
      ok: false,
      error:
        "Kolom tidak ditemukan: alasan. Samakan judul kolom dengan templat.",
    });
  });

  it("refuses a file with only titles", () => {
    expect(readSikuFile(`${TITLES}\n`)).toEqual({
      ok: false,
      error:
        "Berkas tidak berisi baris penyesuaian SIKU. Isi berkas sesuai templat, lalu unggah lagi.",
    });
  });

  it("refuses a quote that is never closed", () => {
    expect(readSikuFile(`${TITLES}\n4121230001,tambah,1,2,"terbuka`)).toEqual({
      ok: false,
      error:
        "Tanda kutip di baris 2 tidak ditutup. Perbaiki berkas, lalu unggah lagi.",
    });
  });

  it("reads the most rows allowed, and refuses one row more", () => {
    const line = "4121230001,tambah,1,2,Catatan";
    const rows = Array.from({ length: MAX_FILE_ROWS + 1 }, () => line);

    const full = readSikuFile([TITLES, ...rows.slice(1)].join("\n"));
    const over = readSikuFile([TITLES, ...rows].join("\n"));

    expect(full.ok && full.value).toHaveLength(MAX_FILE_ROWS);
    expect(over).toEqual({
      ok: false,
      error:
        "Berkas berisi 1.001 baris penyesuaian SIKU, paling banyak 1.000. Bagi menjadi beberapa berkas, lalu unggah satu per satu.",
    });
  });

  it("reads and checks a file of 1,000 rows well within two seconds", () => {
    const lines = Array.from(
      { length: MAX_FILE_ROWS },
      (_, at) =>
        `41212300${String((at % 4) + 1).padStart(2, "0")},kurang,Ketidakhadiran,3,Tidak hadir apel pagi ke-${at}`,
    );
    const started = performance.now();

    const result = readSikuFile([TITLES, ...lines].join("\n"));
    if (!result.ok) throw new Error(result.error);
    const rows = sikuFileRows(result.value, STUDENTS);

    expect(rows.ready.length + rows.skipped.length).toBe(MAX_FILE_ROWS);
    expect(performance.now() - started).toBeLessThan(2000);
  });
});
