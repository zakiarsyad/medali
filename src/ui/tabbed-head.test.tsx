import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { sourceFilesEndingWith } from "./source-files";
import { TabbedHead, TabNote } from "./tabbed-head";

const kamar = { path: "kamar", title: "Kamar" };
const kesehatan = { path: "kesehatan", title: "Kesehatan" };
const twoTabs = { pagePath: "asrama", tabs: [kamar, kesehatan], open: "kamar" };
const oneTab = { pagePath: "asrama", tabs: [kesehatan], open: "kesehatan" };

function placesOf(html: string, parts: string[]): number[] {
  return parts.map((part) => html.indexOf(part));
}

describe("the head of a page with tabs", () => {
  it("puts the title, then the tab bar, then the open tab's description and its note", () => {
    const html = renderToStaticMarkup(
      <TabbedHead title="Asrama" tabs={twoTabs} lede="Penempatan penghuni.">
        <TabNote>Menu asrama dikelola oleh Pengelola Asrama.</TabNote>
      </TabbedHead>,
    );

    const places = placesOf(html, [
      "<h1",
      'aria-label="Bagian halaman"',
      "Penempatan penghuni.",
      "Menu asrama dikelola",
    ]);
    expect(places.every((place) => place >= 0)).toBe(true);
    expect([...places].sort((a, b) => a - b)).toEqual(places);
  });

  it("holds nothing of the open tab above the tab bar", () => {
    const html = renderToStaticMarkup(
      <TabbedHead title="Asrama" tabs={twoTabs} lede="Penempatan penghuni." />,
    );
    const aboveBar = html.slice(0, html.indexOf('aria-label="Bagian halaman"'));

    expect(aboveBar).toContain("Asrama");
    expect(aboveBar).not.toContain("Penempatan penghuni.");
  });

  it("shows the description under the title when the role has one tab, as a page without tabs does", () => {
    const html = renderToStaticMarkup(
      <TabbedHead title="Asrama" tabs={oneTab} lede="Catatan kesehatan." />,
    );

    expect(html).not.toContain("Bagian halaman");
    expect(html.indexOf("Catatan kesehatan.")).toBeGreaterThan(
      html.indexOf("<h1"),
    );
  });

  it("draws no note box when the tab has no note", () => {
    const html = renderToStaticMarkup(
      <TabbedHead title="Asrama" tabs={twoTabs}>
        {false}
      </TabbedHead>,
    );

    expect(html).not.toContain("<p");
  });
});

describe("every page with tabs", () => {
  it("draws its tab bar through the shared head only", () => {
    const drawing = sourceFilesEndingWith(".tsx")
      .filter((path) => !path.endsWith(".test.tsx"))
      .filter((path) => readFileSync(path, "utf8").includes("<TabLinks"));

    expect(drawing).toEqual(["src/ui/tabbed-head.tsx"]);
  });
});

describe("the spaces of the head", () => {
  const STYLES = readFileSync("src/ui/tabbed-head.module.css", "utf8");
  const BAR = readFileSync("src/ui/tab-links.module.css", "utf8");

  it("takes the shared space under the tab bar and under the description", () => {
    expect(BAR).toContain("margin: 0 0 var(--below-tabs);");
    expect(STYLES).toMatch(/\.lede \{[^}]*margin: 0 0 var\(--below-lede\);/);
    expect(STYLES).toMatch(/\.notes \{[^}]*margin: 0 0 var\(--below-lede\);/);
  });

  it("leaves the same space under the dashboard choice as under every tab bar", () => {
    const choice = readFileSync(
      "src/features/dashboard/dashboard-switch.tsx",
      "utf8",
    );

    expect(choice).toContain("<nav className={tabs.tabs}");
  });

  it("gives a note the shared note look", () => {
    const note = STYLES.slice(STYLES.indexOf(".note {"));
    for (const name of [
      "--note-padding",
      "--note-text",
      "--note-ink",
      "--note-line",
      "--note-line-colour",
    ]) {
      expect(note.slice(0, note.indexOf("}"))).toContain(`var(${name})`);
    }
  });
});
