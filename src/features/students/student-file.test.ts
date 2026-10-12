// Sample NIMs of this file: 9900001600 to 9900001699, and 9900300000 to 9900301099.
import { describe, expect, it } from "vitest";
import { readStudentFile, skipRegistered } from "./student-file";
import { MAX_FILE_ROWS, templateCsv } from "./student-file-columns";
import { cohortChoices } from "./student-input";

const context = {
  programs: [
    { id: 3, name: "Prodi Uji Satu" },
    { id: 7, name: "Manajemen Keuangan Negara STR" },
  ],
  cohortYears: cohortChoices(2026),
};

const TITLES =
  "nim,nama,prodi,jalur,jenis_kelamin,angkatan,kelas,provinsi,instansi_asal,afirmasi,pembibitan,internasional,status";

/** A valid row for a made-up student, with some columns set otherwise. */
function row(nim: string, changed: Record<number, string> = {}): string {
  const cells = [
    nim,
    "Berkas Uji",
    "Prodi Uji Satu",
    "Reguler",
    "L",
    "2026",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ];
  for (const [place, text] of Object.entries(changed)) {
    cells[Number(place)] = text;
  }
  return cells.join(",");
}

function read(...lines: string[]) {
  const result = readStudentFile(lines.join("\n"), context);
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

function reasonFor(changed: Record<number, string>): string | undefined {
  return read(TITLES, row("9900001601", changed)).skipped[0]?.reason;
}

describe("readStudentFile", () => {
  it("reads the template: its example row is ready", () => {
    const result = readStudentFile(templateCsv(), context);

    expect(result).toEqual({
      ok: true,
      value: {
        ready: [
          {
            row: 2,
            student: {
              nim: "4121260001",
              name: "Nama Mahasiswa",
              studyProgramId: 7,
              entryPath: "regular",
              sex: "female",
              cohortYear: 2026,
              className: "1-01",
              province: "Jawa Barat",
              originAgency: null,
              status: "active",
              isAffirmation: false,
              isSeedling: false,
              isInternational: false,
              isBlended: false,
            },
          },
        ],
        skipped: [],
        registered: [],
        repeated: 0,
      },
    });
  });

  it("reads each column in the spellings the notes allow", () => {
    const line = row("9900001602", {
      1: "  Berkas   Uji Dua ",
      2: "prodi  uji SATU",
      3: "alih program",
      4: "Perempuan",
      5: "25",
      6: "2-03",
      7: "jawa barat",
      8: "direktorat jenderal pajak",
      9: "Ya",
      10: "1",
      11: "tidak",
      12: "Non Aktif",
    });

    expect(read(TITLES, line).ready[0]?.student).toEqual({
      nim: "9900001602",
      name: "Berkas Uji Dua",
      studyProgramId: 3,
      entryPath: "transfer",
      sex: "female",
      cohortYear: 2025,
      className: "2-03",
      province: "Jawa Barat",
      originAgency: "Direktorat Jenderal Pajak",
      status: "inactive",
      isAffirmation: true,
      isSeedling: true,
      isInternational: false,
      isBlended: false,
    });
  });

  it("takes an empty jalur as Reguler and an empty status as Aktif", () => {
    const line = row("9900001603", { 3: "", 4: "pria", 12: "cuti" });

    expect(read(TITLES, line).ready[0]?.student).toMatchObject({
      entryPath: "regular",
      sex: "male",
      status: "on_leave",
    });
  });

  it.each([
    [
      "a NIM that is not 10 digits",
      { 0: "99000016" },
      "NIM harus 10 digit angka.",
    ],
    ["a missing name", { 1: "" }, "Nama wajib diisi."],
    [
      "an unknown program studi",
      { 2: "Prodi Lain" },
      "Program studi tidak dikenal: Prodi Lain.",
    ],
    [
      "an unknown jalur",
      { 3: "Mandiri" },
      "Jalur harus Reguler atau Alih program.",
    ],
    ["an unknown jenis kelamin", { 4: "X" }, "Jenis kelamin harus L atau P."],
    [
      "an angkatan outside the choices",
      { 5: "2019" },
      "Angkatan harus 2021 sampai 2026.",
    ],
    [
      "an angkatan that is no year",
      { 5: "baru" },
      "Angkatan harus 2021 sampai 2026.",
    ],
    [
      "a kelas that is too long",
      { 6: "x".repeat(21) },
      "Kelas akademik paling banyak 20 karakter.",
    ],
    [
      "an unknown provinsi",
      { 7: "Atlantis" },
      "Provinsi tidak dikenal: Atlantis.",
    ],
    [
      "an unknown instansi asal",
      { 8: "Kantor Lain" },
      "Instansi asal tidak dikenal: Kantor Lain.",
    ],
    [
      "an unknown status",
      { 12: "Lulus" },
      "Status harus Aktif, Cuti, atau Non Aktif.",
    ],
  ])("skips a row with %s, and says why", (_kind, changed, reason) => {
    expect(reasonFor(changed)).toBe(reason);
  });

  it("refuses the stored words of a choice: a file holds the words on screen", () => {
    expect(reasonFor({ 3: "transfer" })).toBe(
      "Jalur harus Reguler atau Alih program.",
    );
    expect(reasonFor({ 4: "male" })).toBe("Jenis kelamin harus L atau P.");
    expect(reasonFor({ 12: "active" })).toBe(
      "Status harus Aktif, Cuti, atau Non Aktif.",
    );
  });

  it("names no text when the cell of a choice is empty", () => {
    expect(reasonFor({ 2: "" })).toBe("Program studi tidak dikenal.");
    expect(reasonFor({ 4: "" })).toBe("Jenis kelamin harus L atau P.");
  });

  it("names the text of a cell on one line and cut short", () => {
    const long = `Prodi   ${"x".repeat(60)}`;

    expect(reasonFor({ 2: long })).toBe(
      `Program studi tidak dikenal: Prodi ${"x".repeat(34)}.`,
    );
  });

  it("takes a first row with any known title as the titles, and names a missing nim", () => {
    const titles = TITLES.replace("nim,", "nomor,");

    expect(
      readStudentFile([titles, row("9900001615")].join("\n"), context),
    ).toEqual({
      ok: false,
      error: "Kolom tidak ditemukan: nim. Samakan judul kolom dengan templat.",
    });
    const other = readStudentFile(
      ["no,jk,program studi", "1,L,Prodi Uji Satu"].join("\n"),
      context,
    );
    expect(!other.ok && other.error).toContain("Kolom tidak ditemukan: nim,");
  });

  it("reads a first row that starts with a NIM as a student, whatever its cells say", () => {
    const rows = read(row("9900001618", { 1: "Status" }), row("9900001619"));

    expect(rows.skipped).toEqual([]);
    expect(rows.ready.map(({ row, student }) => [row, student.nim])).toEqual([
      [1, "9900001618"],
      [2, "9900001619"],
    ]);
  });

  it("refuses a file with a quote that is never closed, and reads no row of it", () => {
    const text = [
      TITLES,
      row("9900001620"),
      row("9900001621", { 1: '"Berkas Uji' }),
      row("9900001622"),
    ].join("\n");

    expect(readStudentFile(text, context)).toEqual({
      ok: false,
      error:
        "Tanda kutip di baris 3 tidak ditutup. Perbaiki berkas, lalu unggah lagi.",
    });
  });

  it("gives each skipped row its number in the file and its NIM, cut short", () => {
    const rows = read(
      TITLES,
      row("9900001604"),
      "",
      row("12", { 1: "Berkas Uji Tiga" }),
      row("9".repeat(40)),
    );

    expect(rows.ready.map((ready) => ready.row)).toEqual([2]);
    expect(rows.skipped).toEqual([
      { row: 4, nim: "12", reason: "NIM harus 10 digit angka." },
      { row: 5, nim: "9".repeat(20), reason: "NIM harus 10 digit angka." },
    ]);
  });

  it("uses the last row of a NIM that is in the file twice, and counts the others", () => {
    const rows = read(
      TITLES,
      row("9900001605", { 1: "Berkas Uji Awal" }),
      row("9900001606"),
      row("9900001605", { 1: "Berkas Uji Akhir" }),
    );

    expect(rows.repeated).toBe(1);
    expect(rows.ready.map(({ row, student }) => [row, student.name])).toEqual([
      [4, "Berkas Uji Akhir"],
      [3, "Berkas Uji"],
    ]);
  });

  it("follows the titles of the first row, in any order and spelling", () => {
    const rows = read(
      "Status;JK;Program Studi;Nama;NIM;angkatan;jalur;kelas;provinsi;instansi;afirmasi;pembibitan;internasional;catatan",
      "Cuti;P;Prodi Uji Satu;Berkas Uji Empat;9900001607;2026;;;;;;;;abaikan",
    );

    expect(rows.skipped).toEqual([]);
    expect(rows.ready[0]?.student).toMatchObject({
      nim: "9900001607",
      name: "Berkas Uji Empat",
      sex: "female",
      status: "on_leave",
    });
  });

  it("reads the columns in the order of the template when no row names them", () => {
    const rows = read(row("9900001608"), row("9900001609"));

    expect(rows.ready.map(({ row, student }) => [row, student.nim])).toEqual([
      [1, "9900001608"],
      [2, "9900001609"],
    ]);
  });

  it("refuses a file whose titles lack a column, and names it", () => {
    const result = readStudentFile(
      `nim,nama,prodi,jalur,angkatan\n${row("9900001610")}`,
      context,
    );

    expect(result).toEqual({
      ok: false,
      error:
        "Kolom tidak ditemukan: jenis_kelamin, kelas, provinsi, instansi_asal, afirmasi, pembibitan, internasional, status. Samakan judul kolom dengan templat.",
    });
  });

  it.each([
    ["nothing", ""],
    ["only empty rows", "\n , ,\n\n"],
    ["only the titles", `${TITLES}\n`],
  ])("refuses a file that holds %s", (_kind, text) => {
    expect(readStudentFile(text, context)).toEqual({
      ok: false,
      error:
        "Berkas tidak berisi baris mahasiswa. Isi berkas sesuai templat, lalu unggah lagi.",
    });
  });

  it("reads a file with the most rows allowed, and refuses one row more", () => {
    const rows = Array.from({ length: MAX_FILE_ROWS + 1 }, (_, index) =>
      row(String(9900300000 + index)),
    );
    const full = [TITLES, ...rows.slice(0, MAX_FILE_ROWS)].join("\n");
    const tooLong = [TITLES, ...rows].join("\n");

    const read = readStudentFile(full, context);
    expect(read.ok && read.value.ready).toHaveLength(MAX_FILE_ROWS);
    expect(readStudentFile(tooLong, context)).toEqual({
      ok: false,
      error:
        "Berkas berisi 1.001 baris mahasiswa, paling banyak 1.000. Bagi menjadi beberapa berkas, lalu unggah satu per satu.",
    });
  });
});

describe("skipRegistered", () => {
  it("skips the rows whose NIM is registered, in the order of the file", () => {
    const rows = read(
      TITLES,
      row("9900001611"),
      row("12"),
      row("9900001612"),
      row("9900001613"),
    );

    const checked = skipRegistered(rows, new Set(["9900001611", "9900001613"]));

    expect(checked.ready.map((ready) => ready.student.nim)).toEqual([
      "9900001612",
    ]);
    expect(checked.skipped).toEqual([
      { row: 3, nim: "12", reason: "NIM harus 10 digit angka." },
    ]);
    expect(checked.registered).toEqual([
      { row: 2, nim: "9900001611", reason: "NIM sudah terdaftar." },
      { row: 5, nim: "9900001613", reason: "NIM sudah terdaftar." },
    ]);
  });

  it("adds to the rows found registered before, in the order of the file", () => {
    const rows = read(TITLES, row("9900001616"), row("9900001617"));

    const first = skipRegistered(rows, new Set(["9900001617"]));
    const second = skipRegistered(first, new Set(["9900001616"]));

    expect(second.ready).toEqual([]);
    expect(second.registered.map((skipped) => skipped.row)).toEqual([2, 3]);
  });

  it("changes nothing when no NIM is registered", () => {
    const rows = read(TITLES, row("9900001614"));

    expect(skipRegistered(rows, new Set())).toEqual(rows);
  });
});
