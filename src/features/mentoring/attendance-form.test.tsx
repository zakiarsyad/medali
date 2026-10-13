// Sample NIMs of this file: 9962000300 to 9962000399. None is added to
// the database.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AttendanceForm } from "./attendance-form";
import type { AttendanceValues } from "./attendance-form-values";
import type { GroupMember } from "./group-meetings";

vi.mock("./actions", () => ({}));

const GROUP_ID = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7301";
const ANI: GroupMember = {
  id: "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7302",
  name: "Ani Uji Formulir",
  nim: "9962000301",
  className: "2-01",
};
const BUDI: GroupMember = {
  id: "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7303",
  name: "Budi Uji Formulir",
  nim: "9962000302",
  className: null,
};

const START: AttendanceValues = {
  heldOn: "2026-10-13",
  topic: "Refleksi nilai Mandiri dan Disiplin",
  marks: { [ANI.id]: "present", [BUDI.id]: "present" },
};

function formWith(
  members: GroupMember[],
  start: AttendanceValues = START,
): string {
  return renderToStaticMarkup(
    <AttendanceForm
      groupId={GROUP_ID}
      number={2}
      members={members}
      start={start}
      firstDay="2026-08-01"
      lastDay="2026-10-13"
      closeAddress="/pengasuhan/hadir"
    />,
  );
}

/** The mark that is chosen for each student, by the id the field is named with. */
function chosenIn(form: string): Record<string, string> {
  const chosen = form.matchAll(
    /<input type="radio" name="mark\.([0-9a-f-]+)" checked="" value="(\w+)"/g,
  );
  return Object.fromEntries([...chosen].map((box) => [box[1], box[2]]));
}

describe("AttendanceForm", () => {
  it("is headed by the number of its meeting, with Tanggal, Topik, Tandai semua hadir, Simpan daftar hadir and Tutup", () => {
    const form = formWith([ANI, BUDI]);

    for (const words of [
      "Daftar hadir pertemuan 2",
      "Tanggal",
      "Topik",
      "Tandai semua hadir",
      "Simpan daftar hadir",
      "Tutup",
    ]) {
      expect(form).toContain(words);
    }
  });

  it("opens with the day and the topic it is given, and takes no day outside the period or after today", () => {
    const form = formWith([ANI]);

    const [day = ""] = form.match(/<input type="date"[^>]*>/) ?? [];

    expect(day).toContain('name="heldOn"');
    expect(day).toContain('value="2026-10-13"');
    expect(day).toContain('min="2026-08-01"');
    expect(day).toContain('max="2026-10-13"');
    expect(form).toContain('value="Refleksi nilai Mandiri dan Disiplin"');
  });

  it("suggests the seven topics", () => {
    const suggested = formWith([ANI]).match(/<option value="[^"]+"/g) ?? [];

    expect(suggested).toHaveLength(7);
    expect(suggested[0]).toContain("Orientasi kelompok dan kontrak belajar");
  });

  it("has a row for each member with name, NIM and kelas akademik, and the four choices", () => {
    const form = formWith([ANI, BUDI]);
    const rows = form.split("<li").slice(1);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain("Ani Uji Formulir");
    expect(rows[0]).toContain("9962000301");
    expect(rows[0]).toContain("Kelas akademik 2-01");
    expect(rows[1]).toContain("Kelas akademik -");
    for (const choice of ["Hadir", "Izin", "Sakit", "Alpa"]) {
      expect(rows[0]).toContain(choice);
    }
    expect(rows[0]?.match(/type="radio"/g)).toHaveLength(4);
  });

  it("opens with every member set to Hadir, and counts them", () => {
    const form = formWith([ANI, BUDI]);

    expect(chosenIn(form)).toEqual({
      [ANI.id]: "present",
      [BUDI.id]: "present",
    });
    expect(form).toContain("Hadir 2, izin 0, sakit 0, alpa 0");
  });

  it("shows the marks it is given, and counts them", () => {
    const start: AttendanceValues = {
      ...START,
      marks: { [ANI.id]: "sick", [BUDI.id]: "absent" },
    };
    const form = formWith([ANI, BUDI], start);

    expect(chosenIn(form)).toEqual({ [ANI.id]: "sick", [BUDI.id]: "absent" });
    expect(form).toContain("Hadir 0, izin 0, sakit 1, alpa 1");
  });

  it("sends the group and the number of the meeting, never who fills it in", () => {
    const form = formWith([ANI]);

    expect(form).toContain(`name="groupId" value="${GROUP_ID}"`);
    expect(form).toContain('name="number" value="2"');
    expect(form).not.toContain("savedBy");
  });

  it("says so for a group without Aktif members", () => {
    expect(formWith([])).toContain(
      "Kelompok ini belum memiliki anak asuh aktif.",
    );
  });
});
