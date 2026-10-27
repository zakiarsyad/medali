import { describe, expect, it } from "vitest";
import {
  PENALTIES_ADDRESS,
  PENALTIES_START,
  penaltiesAddress,
  penaltyFormAddress,
  pickedStudentOf,
  readPenaltiesParams,
} from "./penalty-address";

describe("readPenaltiesParams", () => {
  it("starts with nothing chosen on the first page", () => {
    expect(readPenaltiesParams({})).toEqual(PENALTIES_START);
  });

  it("reads the search, the Kategori, the status and the page", () => {
    expect(
      readPenaltiesParams({
        cari: " Mega ",
        kategori: "sedang",
        status: "ditetapkan",
        hal: "2",
      }),
    ).toEqual({
      query: "Mega",
      category: "medium",
      status: "set",
      page: 2,
      profileId: null,
    });
    expect(readPenaltiesParams({ kategori: "ringan" }).category).toBe("light");
    expect(readPenaltiesParams({ kategori: "berat" }).category).toBe("heavy");
    expect(readPenaltiesParams({ status: "dijatuhkan" }).status).toBe(
      "imposed",
    );
  });

  it("takes what it does not understand as not chosen", () => {
    expect(
      readPenaltiesParams({
        cari: "a".repeat(101),
        kategori: "semua",
        status: "selesai",
        hal: "0",
      }),
    ).toEqual(PENALTIES_START);
  });

  it("keeps a wrong student as given, so it is answered not found", () => {
    expect(readPenaltiesParams({ profil: "bukan-id" }).profileId).toBe(
      "bukan-id",
    );
  });
});

describe("penaltiesAddress", () => {
  it("leaves out what is not chosen, and the first page", () => {
    expect(penaltiesAddress(PENALTIES_START)).toBe(PENALTIES_ADDRESS);
  });

  it("names every choice the way the address reads it back", () => {
    const params = {
      query: "Mega",
      category: "heavy",
      status: "imposed",
      page: 3,
      profileId: "00000000-0000-4000-8000-000000000704",
    } as const;
    const address = penaltiesAddress(params);
    expect(address).toBe(
      "/pembinaan/disiplin?cari=Mega&kategori=berat&status=dijatuhkan&hal=3&profil=00000000-0000-4000-8000-000000000704",
    );
    const search = new URLSearchParams(address.split("?")[1]);
    expect(readPenaltiesParams(Object.fromEntries(search))).toEqual(params);
  });
});

describe("penaltyFormAddress", () => {
  it("names the student the form opens on, the way the address reads it back", () => {
    const id = "00000000-0000-4000-8000-000000000703";
    const address = penaltyFormAddress(id);
    expect(address).toBe(`/pembinaan/disiplin?mahasiswa=${id}`);
    const search = new URLSearchParams(address.split("?")[1]);
    expect(pickedStudentOf(Object.fromEntries(search))).toBe(id);
    expect(pickedStudentOf({})).toBe("");
  });
});
