// Sample NIMs of this file: 9962000600 to 9962000699. None is added to
// the database.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AttendanceView } from "./attendance-view";
import type { GroupMember } from "./group-meetings";
import type { KeptList } from "./meetings-overview";

const ANI: GroupMember = {
  id: "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7402",
  name: "Ani Uji Lihat",
  nim: "9962000601",
  className: "2-01",
};
const BUDI: GroupMember = {
  id: "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7403",
  name: "Budi Uji Lihat",
  nim: "9962000602",
  className: null,
};
const JOINED_LATER: GroupMember = {
  id: "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7404",
  name: "Citra Uji Lihat",
  nim: "9962000603",
  className: null,
};

const KEPT: KeptList = {
  meeting: {
    id: "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7401",
    number: 2,
    heldOn: "2026-09-28",
    topic: "Refleksi nilai Mandiri dan Disiplin",
    version: 1,
  },
  marks: {
    [ANI.id]: "present",
    [BUDI.id]: "sick",
    "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7405": "absent",
  },
};

function viewOf(members: GroupMember[]): string {
  return renderToStaticMarkup(
    <AttendanceView
      number={2}
      members={members}
      kept={KEPT}
      closeAddress="/pengasuhan/hadir"
    />,
  );
}

describe("AttendanceView", () => {
  it("shows the number, the day and the topic of the meeting, and Tutup", () => {
    const view = viewOf([ANI, BUDI]);

    expect(view).toContain("Daftar hadir pertemuan 2");
    expect(view).toContain("28 Sep 2026");
    expect(view).toContain("Refleksi nilai Mandiri dan Disiplin");
    expect(view).toContain("Tutup");
  });

  it("shows each member with name, NIM, kelas akademik and their mark", () => {
    const rows = viewOf([ANI, BUDI]).split("<li").slice(1);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain("Ani Uji Lihat");
    expect(rows[0]).toContain("9962000601");
    expect(rows[0]).toContain("Kelas akademik 2-01");
    expect(rows[0]).toContain("Hadir");
    expect(rows[1]).toContain("Budi Uji Lihat");
    expect(rows[1]).toContain("Sakit");
  });

  it("counts the marks of the members it lists, not the mark kept for a student who has left", () => {
    expect(viewOf([ANI, BUDI])).toContain("Hadir 1, izin 0, sakit 1, alpa 0");
  });

  it("says so for a member who has no mark in the list", () => {
    const rows = viewOf([ANI, BUDI, JOINED_LATER]).split("<li").slice(1);

    expect(rows).toHaveLength(3);
    expect(rows[2]).toContain("Citra Uji Lihat");
    expect(rows[2]).toContain("Tidak tercatat");
  });

  it("has nothing to fill in, to change or to send", () => {
    const view = viewOf([ANI, BUDI]);

    expect(view).not.toContain("<input");
    expect(view).not.toContain("<form");
    expect(view).not.toContain("<button");
    expect(view).not.toContain("Simpan daftar hadir");
    expect(view).not.toContain("Tandai semua hadir");
  });
});
