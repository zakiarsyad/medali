import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MenuLinks } from "./menu-links";

vi.mock("next/navigation", () => ({ usePathname: () => "/tugas" }));

describe("the menu", () => {
  it("shows how many items wait beside a page that counts them", () => {
    const html = renderToStaticMarkup(
      <MenuLinks menu={[{ path: "tugas", title: "Tugas saya", count: 3 }]} />,
    );

    expect(html).toMatch(/Tugas saya<span class="[^"]*count[^"]*">3<\/span>/);
  });

  it("shows no number when nothing waits, or for a page that counts nothing", () => {
    const html = renderToStaticMarkup(
      <MenuLinks
        menu={[
          { path: "tugas", title: "Tugas saya", count: 0 },
          { path: "asrama", title: "Asrama" },
        ]}
      />,
    );

    expect(html).not.toContain("count");
  });
});
