import { existsSync } from "node:fs";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Account } from "@/auth/accounts";
import type { Stage } from "@/settings";
import UnknownAddress from "./(app)/[page]/[tab]/[...rest]/page";
import InsideTheApp from "./(app)/not-found";
import OutsideTheApp from "./not-found";

const asked = vi.hoisted(() => ({
  account: null as Account | null,
  stage: "campus" as Stage,
}));

vi.mock("@/auth/current-account", () => ({
  currentAccount: async () => asked.account,
}));

vi.mock("@/settings", () => ({ currentStage: () => asked.stage }));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("not found");
  },
  redirect: (to: string) => {
    throw new Error(`redirect ${to}`);
  },
}));

const SIGNED_IN: Account = {
  id: "account-1",
  name: "Contoh Kepala Unit",
  title: null,
  unit: null,
  roles: ["head_of_unit"],
  studyProgramId: null,
  studentId: null,
  studentProgram: null,
};

const IN_THE_MENU = "Alamat ini tidak ada. Pilih halaman lain dari menu.";
const WAY_HOME =
  /Alamat ini tidak ada\. <a href="\/"[^>]*>Kembali ke halaman utama\.<\/a>/;

async function shown(screen: () => Promise<ReactElement>): Promise<string> {
  return renderToStaticMarkup(await screen());
}

beforeEach(() => {
  asked.account = null;
  asked.stage = "campus";
});

describe("an unknown address of three parts or more", () => {
  it("is answered by one screen, however long the address", () => {
    expect(existsSync("src/app/(app)/[page]/[tab]/[...rest]/page.tsx")).toBe(
      true,
    );
  });

  it("answers that it is not found, inside the menu's frame", async () => {
    await expect(UnknownAddress()).rejects.toThrow("not found");
  });
});

describe("Halaman tidak ditemukan inside the menu's frame", () => {
  it("tells a signed-in person to pick another page from the menu", async () => {
    asked.account = SIGNED_IN;

    const html = await shown(InsideTheApp);

    expect(html).toContain("Halaman tidak ditemukan");
    expect(html).toContain(IN_THE_MENU);
  });

  it("sends a signed-out person to the sign-in page where that is the way in", async () => {
    await expect(InsideTheApp()).rejects.toThrow("redirect /masuk");
  });

  it("shows a signed-out person the card's words, with no menu to point at", async () => {
    asked.stage = "local";

    const html = await shown(InsideTheApp);

    expect(html).toContain("Halaman tidak ditemukan");
    expect(html).toMatch(WAY_HOME);
    expect(html).not.toContain(IN_THE_MENU);
  });
});

describe("Halaman tidak ditemukan outside the app", () => {
  it("shows a signed-out person the same words in a card", async () => {
    asked.stage = "local";

    const html = await shown(OutsideTheApp);

    expect(html).toContain("Halaman tidak ditemukan");
    expect(html).toMatch(WAY_HOME);
  });

  it("sends a signed-out person to the sign-in page where that is the way in", async () => {
    await expect(OutsideTheApp()).rejects.toThrow("redirect /masuk");
  });
});
