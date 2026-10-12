import { describe, expect, it } from "vitest";
import { sourceFilesEndingWith } from "@/ui/source-files";
import { pageAt } from "./pages";

/**
 * Screens that are not menu pages. The sign-in page is open to anyone;
 * the others are open to every account.
 */
const OUTSIDE_THE_MENU = ["", "[page]", "[page]/[tab]", "ganti-peran", "masuk"];

/** A folder in brackets only groups screens; it is not in the address. */
const GROUP_FOLDER = /\([^/]+\)\//g;

function addressOf(path: string, fileName: RegExp): string {
  return path
    .replace(/^src\/app\//, "")
    .replace(GROUP_FOLDER, "")
    .replace(fileName, "");
}

function screenAddresses(): string[] {
  return sourceFilesEndingWith("page.tsx")
    .filter((path) => path.startsWith("src/app/"))
    .map((path) => addressOf(path, /\/?page\.tsx$/))
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
    .map((path) => addressOf(path, /\/route\.ts$/));
}

/**
 * The addresses of sign-in itself. They are below no page, because
 * someone who is not signed in must reach them.
 */
const SIGN_IN_ANSWERS = ["masuk/google/kembali"];

function isSignInAnswer(address: string): boolean {
  return SIGN_IN_ANSWERS.includes(address);
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
    "/%s is below a page or tab in the list, or is part of sign-in",
    (address) => {
      expect(isBelowListed(address) || isSignInAnswer(address)).toBe(true);
    },
  );

  it("takes only the addresses of sign-in as part of sign-in", () => {
    expect(isSignInAnswer("masuk/google/kembali")).toBe(true);
    expect(isSignInAnswer("masuk/google")).toBe(false);
    expect(isSignInAnswer("masuk/rahasia")).toBe(false);
    expect(isSignInAnswer("rahasia/berkas")).toBe(false);
  });

  it("finds the addresses of sign-in", () => {
    for (const address of SIGN_IN_ANSWERS) {
      expect(answerAddresses()).toContain(address);
    }
  });

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

  it("finds the screens inside a group folder, by their address", () => {
    expect(addressOf("src/app/(app)/page.tsx", /\/?page\.tsx$/)).toBe("");
    expect(screenAddresses()).toContain("kurikulum");
    expect(screenAddresses()).toContain("pengaturan/pengguna");
  });

  it("finds a screen that is not in the list", () => {
    expect(isListed("rahasia")).toBe(false);
    expect(isListed("pengaturan/rahasia")).toBe(false);
  });
});
