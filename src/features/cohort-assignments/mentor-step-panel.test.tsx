import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { checkOfGroups } from "./draft-check";
import { DraftGroupsPanel } from "./draft-groups-panel";
import type { PoolMentor } from "./mentor-options";
import { MentorStepPanel } from "./mentor-step-panel";
import { OneSaveAtATime } from "./one-save";
import type { DraftGroup, DraftMember } from "./stored-assignment";

const FIRST = "11111111-1111-4111-8111-111111111111";
const SECOND = "22222222-2222-4222-8222-222222222222";
const OTHER = "33333333-3333-4333-8333-333333333333";

function members(count: number, tag: string): DraftMember[] {
  return Array.from({ length: count }, (_, place) => ({
    id: `${tag}-${place}`,
    nim: `99${tag}${place}`,
    name: `Anggota Uji ${tag} ${place}`,
    sex: place % 2 === 0 ? "female" : "male",
    province: "Bali",
    className: "1-01",
  }));
}

function group(id: string, more: Partial<DraftGroup>): DraftGroup {
  return {
    id,
    studyProgramId: 1,
    programName: "D3 Pajak",
    programCode: "D3PJK",
    cohortYear: 2026,
    entryPath: "regular",
    number: 1,
    mentor: null,
    members: members(26, id.slice(0, 2)),
    ...more,
  };
}

const YUNI = { id: "yuni", name: "Yuni Contoh", title: "M.Si." };

const GROUPS = [
  group(FIRST, { mentor: YUNI }),
  group(SECOND, { number: 2 }),
  group(OTHER, {
    studyProgramId: 2,
    programName: "D3 Akuntansi",
    programCode: "D3AKT",
    members: members(17, "33"),
  }),
];

const POOL: PoolMentor[] = [
  {
    ...YUNI,
    unit: "Jurusan Pajak",
    hasMentorRole: true,
    leftAsInactive: false,
    isPromised: false,
    heldCohortYears: [],
  },
];

/** Every member waits in their group's program studi, and one more in none. */
const WAITING = [
  ...GROUPS.flatMap((g) =>
    g.members.map(({ id }) => ({
      id,
      studyProgramId: g.studyProgramId,
      entryPath: g.entryPath,
    })),
  ),
  { id: "late", studyProgramId: 1, entryPath: "regular" as const },
];

function step(openGroupId: string | null): string {
  return renderToStaticMarkup(
    <OneSaveAtATime>
      <MentorStepPanel
        assignment={{ cohortYear: 2026, version: 4, groups: GROUPS }}
        check={checkOfGroups(GROUPS, WAITING)}
        pool={POOL}
        openGroupId={openGroupId}
      />
    </OneSaveAtATime>,
  );
}

describe("MentorStepPanel", () => {
  it("shows each group with its size, a mentor choice and Anggota, and names no member", () => {
    const panel = step(null);

    expect(panel).toContain("3. Pengasuh setiap kelompok");
    expect(panel).toContain("3 kelompok · 1 sudah punya pengasuh");
    expect(panel).toContain("KP 26-D3PJK-02");
    expect(panel).toContain("13 putra, 13 putri");
    expect(panel).toContain("Yuni Contoh, M.Si. · Jurusan Pajak ✓");
    expect(panel).toContain("Isi otomatis yang kosong");
    expect(panel).toContain(`kelompok=${SECOND}`);
    expect(panel).not.toContain("Anggota Uji");
  });

  it("marks a group of an unusual size, and says what holds the penetapan back", () => {
    const panel = step(null);

    expect(panel).toContain("di luar ukuran 25–35");
    expect(panel).toContain("2 kelompok belum punya pengasuh.");
    expect(panel).toContain("1 kelompok di luar ukuran 25–35");
    expect(panel).toContain(
      "1 mahasiswa angkatan ini belum masuk kelompok mana pun pada draf.",
    );
  });

  it("lists the members of the open group, each with the other groups of its program studi to move to", () => {
    const panel = step(FIRST);

    expect(panel).toContain("Anggota Uji 11 0");
    expect(panel).toContain("99110 · putri · Bali · 1-01");
    expect(panel).not.toContain("Anggota Uji 22");
    expect(panel).toContain("Pindahkan ke…");
    expect(panel).toContain(
      `<option value="${SECOND}">KP 26-D3PJK-02</option>`,
    );
    expect(panel).not.toContain(`<option value="${OTHER}"`);
    expect(panel).toContain("Tutup");
  });

  it("offers no move in a program studi with one group", () => {
    expect(step(OTHER)).not.toContain("Pindahkan ke…");
  });
});

const SAVED = {
  cohortYear: 2026,
  groups: GROUPS,
  decreeNumber: "KEP-12/UJI/2026",
  effectiveOn: "2026-09-01",
  savedBy: "Kepala Uji",
};

describe("DraftGroupsPanel", () => {
  it("shows the groups and their mentors to read only: no member, no choice, no Anggota", () => {
    const panel = renderToStaticMarkup(
      <DraftGroupsPanel assignment={{ ...SAVED, status: "draft" }} />,
    );

    expect(panel).toContain("Draf penetapan");
    expect(panel).not.toContain("KEP-12/UJI/2026");
    expect(panel).not.toContain("sejak");

    expect(panel).toContain("KP 26-D3PJK-01");
    expect(panel).toContain("Yuni Contoh, M.Si.");
    expect(panel).toContain("13 putra, 13 putri");
    expect(panel).not.toContain("Anggota Uji");
    expect(panel).not.toContain("<select");
    expect(panel).not.toContain("<button");
    expect(panel).not.toContain("<a ");
  });

  it("says a fixed angkatan is fixed, with its decree, who fixed it and since when each mentor holds the group", () => {
    const panel = renderToStaticMarkup(
      <DraftGroupsPanel assignment={{ ...SAVED, status: "fixed" }} />,
    );

    expect(panel).toContain("Angkatan 2026 sudah ditetapkan");
    expect(panel).toContain(
      "KEP-12/UJI/2026 · berlaku 1 Sep 2026 · ditetapkan Kepala Uji",
    );
    expect(panel).toContain("sejak 1 Sep 2026");
    expect(panel).not.toContain("Anggota Uji");
    expect(panel).not.toContain("<button");
    expect(panel).not.toContain("<a ");
  });

  it("gives an account that may read member names Anggota on each group, and names no member while none is open", () => {
    const panel = renderToStaticMarkup(
      <DraftGroupsPanel
        assignment={{ ...SAVED, status: "fixed" }}
        openGroupId={null}
      />,
    );

    expect(panel).toContain(`kelompok=${FIRST}`);
    expect(panel).toContain(`kelompok=${SECOND}`);
    expect(panel).toContain(">Anggota</a>");
    expect(panel).not.toContain("Anggota Uji");
  });

  it("lists the members of the open group to read only, with nowhere to move them", () => {
    const panel = renderToStaticMarkup(
      <DraftGroupsPanel
        assignment={{ ...SAVED, status: "fixed" }}
        openGroupId={FIRST}
      />,
    );

    expect(panel).toContain("Anggota Uji 11 0");
    expect(panel).toContain("99110 · putri · Bali · 1-01");
    expect(panel).not.toContain("Anggota Uji 22 0");
    expect(panel).toContain(">Tutup</a>");
    expect(panel).not.toContain("Pindahkan ke…");
    expect(panel).not.toContain("<select");
    expect(panel).not.toContain("<button");
  });
});
