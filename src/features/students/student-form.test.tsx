import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import { StudentForm } from "./student-form";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));
vi.mock("./actions", () => ({}));

/** Angkatan 2026 is in semester 1, and angkatan 2025 in semester 3. */
const ODD_2026 = { startYear: 2026, term: "odd" } as const;

/** The form for a new student, which starts on the first angkatan given. */
function formFor(cohortYears: number[]): string {
  return renderToStaticMarkup(
    <StudentForm
      programs={[]}
      cohortYears={cohortYears}
      editing={null}
      query=""
      period={ODD_2026}
    />,
  );
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
