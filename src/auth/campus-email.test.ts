import { describe, expect, it } from "vitest";
import { isCampusEmail } from "./campus-email";

const ENDING = "@kampus.example";

describe("isCampusEmail", () => {
  it.each([["budi@kampus.example"], ["Budi.Contoh@Kampus.Example"]])(
    "takes %s as a campus address",
    (email) => {
      expect(isCampusEmail(email, ENDING)).toBe(true);
    },
  );

  it.each([
    ["an address outside the campus", "orang@luar.example"],
    ["an address at a longer ending", "budi@mail.kampus.example"],
    ["an address at a name that only ends alike", "budi@evilkampus.example"],
    ["an address with the ending in its name", "kampus.example@luar.example"],
    ["the ending alone", "@kampus.example"],
    ["no address", ""],
  ])("refuses %s", (_kind, email) => {
    expect(isCampusEmail(email, ENDING)).toBe(false);
  });

  it("takes no address at all while the ending is empty", () => {
    expect(isCampusEmail("budi@kampus.example", "")).toBe(false);
  });
});
