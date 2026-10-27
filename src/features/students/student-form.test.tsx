import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import type { GroupChoice } from "./mentor-group-choices";
import { MentorGroupField } from "./mentor-group-field";
import { StudentForm } from "./student-form";
import type { StoredStudent } from "./student-input";

vi.mock("next/navigation", () => ({
  useRouter: () => ({}),
  unstable_rethrow: vi.fn(),
}));
vi.mock("./actions", () => ({}));

/** Angkatan 2026 is in semester 1, and angkatan 2025 in semester 3. */
const ODD_2026 = { startYear: 2026, term: "odd" } as const;

const PROGRAMS = [{ id: 3, name: "D3 Pajak", code: "D3PJK" }];

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

const GROUPS = [
  group("fits"),
  group("fits-too", { number: 2, mentorName: null, members: 30 }),
  group("other-year", { cohortYear: 2025 }),
];

const STUDENT: StoredStudent = {
  nim: "9900003101",
  name: "Mahasiswa Contoh",
  email: null,
  studyProgramId: 3,
  entryPath: "regular",
  sex: "female",
  cohortYear: 2026,
  className: null,
  province: null,
  originAgency: null,
  status: "active",
  isAffirmation: false,
  isSeedling: false,
  isInternational: false,
  isBlended: false,
  mentorGroupId: "fits-too",
  version: 4,
};

/** The form for a new student, which starts on the first angkatan given. */
function formFor(cohortYears: number[], groups: GroupChoice[] = []): string {
  return renderToStaticMarkup(
    <StudentForm
      programs={PROGRAMS}
      cohortYears={cohortYears}
      editing={null}
      groups={groups}
      place={{ query: "", page: 1 }}
      period={ODD_2026}
    />,
  );
}

function groupChoiceOf(form: string): string {
  return form.match(/<select name="mentorGroupId".*?<\/select>/)?.[0] ?? "";
}

test("the browser's own check is off, so the app's message is the one shown", () => {
  expect(/<form[^>]* novalidate=""/i.test(formFor([]))).toBe(true);
});

test("the note names the dorm the student being filled in will live in", () => {
  expect(formFor([2026])).toContain("Masuk penghuni Asrama Cipta Bakti.");
  expect(formFor([2025])).toContain("Bukan penghuni asrama.");
});

test("the note says nothing while no angkatan is chosen", () => {
  expect(formFor([])).not.toContain("penghuni asrama");
});

test("Kelompok pengasuhan offers Belum ditetapkan and the groups of the angkatan, program studi and jalur chosen", () => {
  const form = formFor([2026], GROUPS);

  expect(groupChoiceOf(form)).toContain(
    '<option value="" selected="">Belum ditetapkan</option>' +
      '<option value="fits">KP 26-D3PJK-01 · Pengasuh Contoh · 28 anggota</option>' +
      '<option value="fits-too">KP 26-D3PJK-02 · - · 30 anggota</option>' +
      "</select>",
  );
  expect(form).toContain(
    "Pilih kelompok yang sudah ada untuk angkatan, prodi, dan jalur ini",
  );
});

test("Kelompok pengasuhan holds only Belum ditetapkan when no group fits, and says where groups are formed", () => {
  const form = formFor([2024], GROUPS);

  expect(groupChoiceOf(form)).toContain(
    '<option value="" selected="">Belum ditetapkan</option></select>',
  );
  expect(form).toContain(
    "Belum ada kelompok untuk angkatan 2024 D3 Pajak reguler. Kelompok dibentuk lewat Pengasuh &gt; Penetapan angkatan baru.",
  );
});

test("Kelompok pengasuhan stands on the group the student being changed is in", () => {
  const form = renderToStaticMarkup(
    <StudentForm
      programs={PROGRAMS}
      cohortYears={[2026]}
      editing={STUDENT}
      groups={GROUPS}
      place={{ query: "", page: 1 }}
      period={ODD_2026}
    />,
  );

  expect(groupChoiceOf(form)).toContain(
    '<option value="fits-too" selected="">',
  );
  expect(form).not.toContain('role="status"');
});

test("the form to change a student sends the version and the group it opened with, and the form to add sends neither", () => {
  const changing = renderToStaticMarkup(
    <StudentForm
      programs={PROGRAMS}
      cohortYears={[2026]}
      editing={STUDENT}
      groups={GROUPS}
      place={{ query: "", page: 1 }}
      period={ODD_2026}
    />,
  );

  expect(changing).toContain('<input type="hidden" name="version" value="4"/>');
  expect(changing).toContain(
    '<input type="hidden" name="openedGroupId" value="fits-too"/>',
  );
  expect(formFor([2026], GROUPS)).not.toContain('name="version"');
  expect(formFor([2026], GROUPS)).not.toContain('name="openedGroupId"');
});

test("the warning of a full group shows under the line of the choice", () => {
  const field = renderToStaticMarkup(
    <MentorGroupField
      groups={GROUPS}
      chosen="fits"
      hint="Pilih kelompok."
      warning="Kelompok ini sudah berisi 35 anggota aktif."
      onChoose={() => {}}
    />,
  );

  expect(field).toMatch(
    /Pilih kelompok\.<\/p><p[^>]* role="status">Kelompok ini sudah berisi 35 anggota aktif\.<\/p>/,
  );
});
