import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DormTasks } from "./tasks-card";
import { DormTasksScreen } from "./tasks-screen";

const NOTHING: DormTasks = {
  leaves: { items: [], total: 0 },
  returns: { items: [], total: 0 },
  outLate: 0,
};

describe("Tugas saya", () => {
  it("shows the title, what it is for, and the all-clear box while nothing waits", () => {
    const html = renderToStaticMarkup(<DormTasksScreen tasks={NOTHING} />);

    expect(html).toContain("Tugas saya");
    expect(html).toContain("menunggu tindakan Pengelola Asrama");
    expect(html).toContain("Semua tugas sudah beres.");
  });

  it("shows no all-clear box while something waits", () => {
    const html = renderToStaticMarkup(
      <DormTasksScreen
        tasks={{ ...NOTHING, returns: { items: [], total: 1 } }}
      />,
    );

    expect(html).not.toContain("Semua tugas sudah beres.");
  });
});
