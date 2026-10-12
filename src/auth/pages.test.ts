import { describe, expect, it } from "vitest";
import { sourceFilesEndingWith } from "@/ui/source-files";
import { pageAt } from "./pages";

/** Screens that are not menu pages, and are open to every account. */
const OUTSIDE_THE_MENU = ["", "[page]", "[page]/[tab]", "ganti-peran"];

function screenAddresses(): string[] {
  return sourceFilesEndingWith("page.tsx")
    .filter((path) => path.startsWith("src/app/"))
    .map((path) =>
      path.replace(/^src\/app\/?/, "").replace(/\/?page\.tsx$/, ""),
    )
    .filter((address) => !OUTSIDE_THE_MENU.includes(address));
}

function isListed(address: string): boolean {
  const [pagePath = "", tabPath, ...rest] = address.split("/");
  const page = pageAt(pagePath);
  if (!page || rest.length > 0) return false;
  if (tabPath === undefined) return true;
  return "tabs" in page && page.tabs.some((tab) => tab.path === tabPath);
}

/** The addresses the server answers itself, without a screen. */
function answerAddresses(): string[] {
  return sourceFilesEndingWith("/route.ts")
    .filter((path) => path.startsWith("src/app/"))
    .map((path) => path.replace(/^src\/app\//, "").replace(/\/route\.ts$/, ""));
}

/** Whether an address sits below a page, or a tab of a tabbed page. */
function isBelowListed(address: string): boolean {
  const [pagePath = "", tabPath, ...rest] = address.split("/");
  const page = pageAt(pagePath);
  if (!page) return false;
  if (!("tabs" in page)) return tabPath !== undefined;
  return rest.length > 0 && isListed(`${pagePath}/${tabPath}`);
}

describe("every address the server answers itself", () => {
  it.each(answerAddresses())(
    "/%s is below a page or tab in the list",
    (address) => {
      expect(isBelowListed(address)).toBe(true);
    },
  );

  it("finds the download of a kept student file", () => {
    expect(answerAddresses()).toContain("pengaturan/mahasiswa/berkas/[id]");
  });

  it("finds an address that is below nothing in the list", () => {
    expect(isBelowListed("rahasia/berkas")).toBe(false);
    expect(isBelowListed("pengaturan/rahasia/berkas")).toBe(false);
    expect(isBelowListed("pengaturan/mahasiswa")).toBe(false);
  });
});

describe("every screen", () => {
  it.each(screenAddresses())("/%s is a page or tab in the list", (address) => {
    expect(isListed(address)).toBe(true);
  });

  it("finds a screen that is not in the list", () => {
    expect(isListed("rahasia")).toBe(false);
    expect(isListed("pengaturan/rahasia")).toBe(false);
  });
});
