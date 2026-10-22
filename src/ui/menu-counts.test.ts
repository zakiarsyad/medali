import { describe, expect, it } from "vitest";
import { withMenuCounts } from "./menu-counts";

const PAGES = [
  { id: "tasks", path: "tugas", title: "Tugas saya" },
  { id: "guidance", path: "pembinaan", title: "Pembinaan" },
  { id: "dorm", path: "asrama", title: "Asrama" },
];

describe("withMenuCounts", () => {
  it("puts each count beside its own page and leaves the others without one", () => {
    expect(withMenuCounts(PAGES, { tasks: 2, guidance: 5 })).toEqual([
      { id: "tasks", path: "tugas", title: "Tugas saya", count: 2 },
      { id: "guidance", path: "pembinaan", title: "Pembinaan", count: 5 },
      { id: "dorm", path: "asrama", title: "Asrama" },
    ]);
  });

  it("keeps a count of zero, which the menu shows as no number", () => {
    expect(withMenuCounts(PAGES, { guidance: 0 })[1]?.count).toBe(0);
  });
});
