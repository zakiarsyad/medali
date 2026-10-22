import { describe, expect, it } from "vitest";
import {
  COACHING_ADDRESS,
  COACHING_START,
  coachingAddress,
  readCoachingParams,
} from "./coaching-address";

describe("readCoachingParams", () => {
  it("starts on the first page with the students not yet Selesai, of every level", () => {
    expect(readCoachingParams({})).toEqual(COACHING_START);
    expect(COACHING_START.status).toBe("open");
    expect(COACHING_START.level).toBe("all");
  });

  it("reads the search, the level, the status and the page", () => {
    expect(
      readCoachingParams({
        cari: " Gita ",
        tingkat: "intensif",
        status: "konseling",
        hal: "2",
      }),
    ).toEqual({
      query: "Gita",
      level: "intensive",
      status: "counselling",
      page: 2,
      profileId: null,
    });
    expect(readCoachingParams({ tingkat: "sedang" }).level).toBe("moderate");
    expect(readCoachingParams({ tingkat: "ringan" }).level).toBe("light");
    expect(readCoachingParams({ status: "semua" }).status).toBe("all");
    expect(readCoachingParams({ status: "teridentifikasi" }).status).toBe(
      "identified",
    );
    expect(readCoachingParams({ status: "pemantauan" }).status).toBe(
      "monitoring",
    );
    expect(readCoachingParams({ status: "selesai" }).status).toBe("done");
  });

  it("takes what it does not understand as not chosen", () => {
    expect(
      readCoachingParams({
        cari: "a".repeat(101),
        tingkat: "berat",
        status: "dijatuhkan",
        hal: "0",
        profil: "bukan-id",
      }),
    ).toEqual(COACHING_START);
  });
});

describe("coachingAddress", () => {
  it("leaves out what is not chosen, and the first page", () => {
    expect(coachingAddress(COACHING_START)).toBe(COACHING_ADDRESS);
  });

  it("names every choice the way the address reads it back", () => {
    const params = {
      query: "Gita",
      level: "moderate",
      status: "all",
      page: 3,
      profileId: "00000000-0000-4000-8000-000000000706",
    } as const;
    const address = coachingAddress(params);
    expect(address).toBe(
      "/pembinaan/karakter?cari=Gita&tingkat=sedang&status=semua&hal=3&profil=00000000-0000-4000-8000-000000000706",
    );
    const search = new URLSearchParams(address.split("?")[1]);
    expect(readCoachingParams(Object.fromEntries(search))).toEqual(params);
  });
});
