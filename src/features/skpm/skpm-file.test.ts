import { describe, expect, it } from "vitest";
import {
  type FileStudent,
  fileNims,
  NO_ACTIVITY,
  NOT_ACTIVE,
  POINTS_NOT_IN_RANGE,
  readSkpmFile,
  skpmFileRows,
  UNKNOWN_NIM,
} from "./skpm-file";
import { skpmTemplateCsv } from "./skpm-file-columns";

const TITLES = "nim,kegiatan,kategori,tingkat,peran,tanggal,poin";

const ANI: FileStudent = { id: "id-ani", name: "Ani Contoh", active: true };
const BUDI: FileStudent = { id: "id-budi", name: "Budi Contoh", active: false };

const KNOWN = new Map([
  ["9985040001", ANI],
  ["9985040002", BUDI],
]);

function lines(text: string) {
  const read = readSkpmFile(text);
  if (!read.ok) throw new Error(read.error);
  return read.value;
}

function rowsOf(...rows: string[]) {
  return skpmFileRows(lines([TITLES, ...rows].join("\n")), KNOWN);
}

describe("readSkpmFile", () => {
  it("reads the columns by their titles, in any order, and the other titles the prototype takes", () => {
    const read = lines(
      [
        "poin,nim,nama_kegiatan,kategori,tingkat,peran,tanggal",
        "8,9985040001,Lomba debat,Lomba atau kompetisi,Nasional,Peserta,2026-10-12",
      ].join("\n"),
    );
    const scored = lines(
      [
        "nim,kegiatan,kategori,tingkat,peran,tanggal,kredit",
        "9985040001,Seminar,,,,,3",
      ].join("\n"),
    );

    expect(read).toEqual([
      {
        row: 2,
        cells: {
          nim: "9985040001",
          kegiatan: "Lomba debat",
          kategori: "Lomba atau kompetisi",
          tingkat: "Nasional",
          peran: "Peserta",
          tanggal: "2026-10-12",
          poin: "8",
        },
      },
    ]);
    expect(scored[0]?.cells.poin).toBe("3");
  });

  it("reads a file without titles in the order of the template", () => {
    const read = lines("9985040001,Seminar,Lainnya,Kampus,Peserta,,4");
    expect(read[0]).toEqual({
      row: 1,
      cells: {
        nim: "9985040001",
        kegiatan: "Seminar",
        kategori: "Lainnya",
        tingkat: "Kampus",
        peran: "Peserta",
        tanggal: "",
        poin: "4",
      },
    });
  });

  it("reads the template", () => {
    expect(lines(skpmTemplateCsv())).toHaveLength(1);
  });

  it("names the missing columns", () => {
    expect(readSkpmFile("nim,kegiatan,poin\n9985040001,Seminar,4")).toEqual({
      ok: false,
      error:
        "Kolom tidak ditemukan: kategori, tingkat, peran, tanggal. Samakan judul kolom dengan templat.",
    });
  });

  it("refuses a file with no row, and one with more than 1,000 rows", () => {
    const many = Array.from({ length: 1001 }, () => "9985040001,Seminar,,,,,1");

    expect(readSkpmFile(`${TITLES}\n`)).toEqual({
      ok: false,
      error:
        "Berkas tidak berisi baris kegiatan SKPM. Isi berkas sesuai templat, lalu unggah lagi.",
    });
    expect(readSkpmFile([TITLES, ...many].join("\n"))).toEqual({
      ok: false,
      error:
        "Berkas berisi 1.001 baris kegiatan SKPM, paling banyak 1.000. Bagi menjadi beberapa berkas, lalu unggah satu per satu.",
    });
  });
});

describe("skpmFileRows", () => {
  it("keeps a filled row with its student and every text as the file has it", () => {
    const { ready, skipped } = rowsOf(
      "9985040001,Lomba debat,Lomba antarbangsa,Asia,Juri,12/10/2026,8",
    );

    expect(skipped).toEqual([]);
    expect(ready).toEqual([
      {
        row: 2,
        studentId: "id-ani",
        nim: "9985040001",
        name: "Ani Contoh",
        activity: "Lomba debat",
        category: "Lomba antarbangsa",
        level: "Asia",
        activityRole: "Juri",
        day: "12/10/2026",
        points: 8,
      },
    ]);
  });

  it("gives an empty kategori Lainnya, and keeps an empty tingkat, peran and tanggal empty", () => {
    const { ready } = rowsOf("9985040001,Seminar,,,,,4");
    expect(ready[0]).toMatchObject({
      category: "Lainnya",
      level: null,
      activityRole: null,
      day: null,
    });
  });

  it("keeps every row of a student", () => {
    const { ready } = rowsOf(
      "9985040001,Seminar,,,,,4",
      "9985040001,Seminar,,,,,4",
      "9985040001,Lomba,,,,,8",
    );
    expect(ready.map((row) => [row.row, row.points])).toEqual([
      [2, 4],
      [3, 4],
      [4, 8],
    ]);
  });

  it("takes points from 0 to 1000 with decimals after a comma or a point, kept to two places", () => {
    const { ready, skipped } = rowsOf(
      "9985040001,A,,,,,0",
      "9985040001,B,,,,,1000",
      '9985040001,C,,,,,"2,25"',
      "9985040001,D,,,,,3.333",
    );
    const semicolons = skpmFileRows(
      lines(
        [TITLES.replaceAll(",", ";"), "9985040001;Seminar;;;;;7,5"].join("\n"),
      ),
      KNOWN,
    );

    expect(skipped).toEqual([]);
    expect(ready.map((row) => row.points)).toEqual([0, 1000, 2.25, 3.33]);
    expect(semicolons.ready.map((row) => row.points)).toEqual([7.5]);
  });

  it.each([
    ["an unknown NIM", "9985040099,Seminar,,,,,4", UNKNOWN_NIM],
    ["a student who is not Aktif", "9985040002,Seminar,,,,,4", NOT_ACTIVE],
    ["an empty kegiatan", "9985040001,,,,,,4", NO_ACTIVITY],
    ["empty points", "9985040001,Seminar,,,,,", POINTS_NOT_IN_RANGE],
    ["points over 1000", "9985040001,Seminar,,,,,1001", POINTS_NOT_IN_RANGE],
    ["points below 0", "9985040001,Seminar,,,,,-1", POINTS_NOT_IN_RANGE],
    ["words for points", "9985040001,Seminar,,,,,lima", POINTS_NOT_IN_RANGE],
  ])("skips %s with the prototype's reason", (_, line, reason) => {
    const { ready, skipped } = rowsOf(line);
    expect(ready).toEqual([]);
    expect(skipped).toEqual([
      { row: 2, nim: line.split(",")[0] ?? "", reason },
    ]);
  });

  it("gives the prototype's reasons", () => {
    expect([UNKNOWN_NIM, NOT_ACTIVE, NO_ACTIVITY, POINTS_NOT_IN_RANGE]).toEqual(
      [
        "NIM tidak ada dalam data mahasiswa.",
        "Mahasiswa tidak aktif.",
        "Nama kegiatan kosong.",
        "Poin harus angka 0–1000.",
      ],
    );
  });

  it("keeps a text on one line and cuts one longer than is kept", () => {
    const long = "a".repeat(250);
    const { ready } = rowsOf(`9985040001,"Seminar\nnasional ${long}",,,,,4`);
    expect(ready[0]?.activity).toBe(`Seminar nasional ${long}`.slice(0, 200));
  });
});

describe("fileNims", () => {
  it("gives each NIM the rows name once", () => {
    const read = lines(
      [
        TITLES,
        "9985040001,A,,,,,1",
        "9985040001,B,,,,,1",
        ",C,,,,,1",
        "9985040002,D,,,,,1",
      ].join("\n"),
    );
    expect(fileNims(read)).toEqual(["9985040001", "9985040002"]);
  });
});
