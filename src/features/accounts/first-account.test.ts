import { describe, expect, it } from "vitest";
import { parseFirstAccount } from "./first-account";

const ENDING = "@kampus.example";

function refusalOf(args: string[], ending = ENDING): string {
  const parsed = parseFirstAccount(args, ending);
  if (parsed.ok) throw new Error("The first account was let through.");
  return parsed.error;
}

describe("parseFirstAccount", () => {
  it("takes a name and a campus address", () => {
    const parsed = parseFirstAccount(
      ["Kepala Uji Pertama", "kepala.uji@kampus.example"],
      ENDING,
    );

    expect(parsed).toEqual({
      ok: true,
      value: { name: "Kepala Uji Pertama", email: "kepala.uji@kampus.example" },
    });
  });

  it("keeps the address in small letters and the name without spaces around it", () => {
    const parsed = parseFirstAccount(
      ["  Kepala Uji Pertama ", "Kepala.Uji@Kampus.Example"],
      ENDING,
    );

    expect(parsed).toEqual({
      ok: true,
      value: { name: "Kepala Uji Pertama", email: "kepala.uji@kampus.example" },
    });
  });

  it.each([
    [[]],
    [["Kepala Uji Pertama"]],
    [["Kepala", "Uji", "kepala.uji@kampus.example"]],
  ])("refuses %o and says what to give", (args) => {
    expect(refusalOf(args)).toContain("a name and a campus address");
  });

  it.each(["", "  ", "Ke"])("refuses the name %o", (name) => {
    expect(refusalOf([name, "kepala.uji@kampus.example"])).toContain("name");
  });

  it.each(["", "kepala.uji", "kepala uji@kampus.example", "@kampus.example"])(
    "refuses the malformed address %o",
    (email) => {
      expect(refusalOf(["Kepala Uji Pertama", email])).toContain("address");
    },
  );

  it.each([
    "kepala.uji@contoh.example",
    "kepala.uji@mail.kampus.example",
    "kepala.uji@bukankampus.example",
  ])("refuses %s: it does not end with the campus address ending", (email) => {
    const refusal = refusalOf(["Kepala Uji Pertama", email]);

    expect(refusal).toContain("does not end with the campus address ending");
  });

  it("refuses every address while the campus address ending is empty", () => {
    const refusal = refusalOf(
      ["Kepala Uji Pertama", "kepala.uji@kampus.example"],
      "",
    );

    expect(refusal).toContain("CAMPUS_EMAIL_ENDING");
  });
});
