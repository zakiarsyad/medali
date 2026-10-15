import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DormTasksScreen } from "./tasks-screen";

describe("Tugas saya", () => {
  it("shows the title, what it is for, and the all-clear box while nothing waits", () => {
    const html = renderToStaticMarkup(<DormTasksScreen waiting={0} />);

    expect(html).toContain("Tugas saya");
    expect(html).toContain("menunggu tindakan Pengelola Asrama");
    expect(html).toContain("Semua tugas sudah beres.");
  });

  it("shows no all-clear box while something waits", () => {
    const html = renderToStaticMarkup(<DormTasksScreen waiting={1} />);

    expect(html).not.toContain("Semua tugas sudah beres.");
  });
});
