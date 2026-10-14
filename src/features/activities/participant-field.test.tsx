import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { STARTING_DRAFT } from "./participant-draft";
import { ParticipantField } from "./participant-field";
import { Offered } from "./record-student-field";
import { draw } from "./test-press";
import { TEST_EXTRA_FORM_PARTS } from "./test-screen-parts";

/*
 * The checks run without a browser, so the field is drawn by calling it:
 * what it keeps starts as given and is not changed here.
 */
vi.mock("react", async (original) => ({
  ...(await original<typeof import("react")>()),
  useState: (start: unknown) => [start, () => {}],
}));

vi.mock("@/ui/use-found", () => ({ useFound: () => [] }));

vi.mock("./actions", () => ({ searchParticipantStudentsAction: vi.fn() }));

const POOL = TEST_EXTRA_FORM_PARTS.extra?.pool ?? { classes: [], cohorts: [] };

function searchBox(mode: "students" | "classes", label: string): ReactElement {
  const drawn = draw(
    <ParticipantField start={{ ...STARTING_DRAFT, mode }} pool={POOL} />,
    [Offered],
  );
  const box = drawn.find(
    (element) =>
      element.type === "input" && element.props["aria-label"] === label,
  );
  if (!box) throw new Error(`No box "${label}" is shown.`);
  return box;
}

function pressKey(box: ReactElement, key: string): boolean {
  const props = box.props as { onKeyDown?: (event: unknown) => void };
  let isKept = false;
  props.onKeyDown?.({
    key,
    preventDefault: () => {
      isKept = true;
    },
  });
  return isKept;
}

describe("the search boxes of Peserta", () => {
  it.each([
    ["students", "Cari mahasiswa"],
    ["classes", "Cari kelas"],
  ] as const)(
    "keep Enter in %s from sending the schedule form",
    (mode, label) => {
      const box = searchBox(mode, label);

      expect(pressKey(box, "Enter")).toBe(true);
      expect(pressKey(box, "a")).toBe(false);
    },
  );
});
