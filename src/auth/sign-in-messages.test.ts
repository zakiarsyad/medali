import { describe, expect, it } from "vitest";
import { refusalAddress, refusalMessage } from "./sign-in-messages";

function messageAt(address: string): string | null {
  const code = new URL(address, "https://medali.example").searchParams.get(
    "pesan",
  );
  return refusalMessage(code ?? "");
}

describe("the message of a refused sign-in", () => {
  it.each([
    ["refused_outside_campus", "Gunakan akun Google kampus."],
    [
      "refused_no_account",
      "Akun Anda belum terdaftar. Hubungi Unit Pembangunan Karakter.",
    ],
    ["failed", "Masuk dengan Google gagal. Coba lagi."],
  ] as const)("for %s is shown on the sign-in page", (refusal, message) => {
    const address = refusalAddress(refusal);

    expect(address.startsWith("/masuk?")).toBe(true);
    expect(messageAt(address)).toBe(message);
  });

  it.each([
    [""],
    ["rahasia"],
    ["Gunakan akun lain."],
    ["<b>x</b>"],
    ["refused_outside_campus"],
    ["constructor"],
  ])("is nothing for the word %o, which is never shown", (code) => {
    expect(refusalMessage(code)).toBeNull();
  });
});
