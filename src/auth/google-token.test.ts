import { generateKeyPair, type JWTPayload, SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { readGoogleToken } from "./google-token";

const CLIENT_ID = "nomor-uji";
const NONCE = "nonce-uji";
const EXPECTED = { clientId: CLIENT_ID, nonce: NONCE };
const CLAIMS = {
  iss: "https://accounts.google.com",
  aud: CLIENT_ID,
  nonce: NONCE,
  email: "Budi@Kampus.Example",
  email_verified: true,
};

const google = await generateKeyPair("RS256");
const stranger = await generateKeyPair("RS256");
const googleKeys = async () => google.publicKey;

async function signed(
  claims: JWTPayload,
  expires: string | null = "5 minutes",
  key = google.privateKey,
): Promise<string> {
  const token = new SignJWT(claims).setProtectedHeader({ alg: "RS256" });
  if (expires) token.setExpirationTime(expires);
  return token.sign(key);
}

describe("readGoogleToken", () => {
  it("reads the address of an answer signed by Google, in small letters", async () => {
    const token = await signed(CLAIMS);

    expect(await readGoogleToken(token, googleKeys, EXPECTED)).toEqual({
      email: "budi@kampus.example",
      verified: true,
    });
  });

  it("takes Google's other way of writing its own name", async () => {
    const token = await signed({ ...CLAIMS, iss: "accounts.google.com" });

    expect(await readGoogleToken(token, googleKeys, EXPECTED)).not.toBeNull();
  });

  it.each([
    ["made for another app", { aud: "aplikasi-lain" }],
    ["made for another press of the button", { nonce: "nonce-lain" }],
    ["with no nonce", { nonce: undefined }],
    ["from another sender", { iss: "https://accounts.luar.example" }],
    ["with no address", { email: undefined }],
    ["with an address that is not text", { email: 7 }],
  ])("refuses an answer %s", async (_kind, change) => {
    const token = await signed({ ...CLAIMS, ...change });

    expect(await readGoogleToken(token, googleKeys, EXPECTED)).toBeNull();
  });

  it("refuses an answer that has expired", async () => {
    const token = await signed(CLAIMS, "-1 minute");

    expect(await readGoogleToken(token, googleKeys, EXPECTED)).toBeNull();
  });

  it("refuses an answer that never expires", async () => {
    const token = await signed(CLAIMS, null);

    expect(await readGoogleToken(token, googleKeys, EXPECTED)).toBeNull();
  });

  it("refuses an answer signed by someone else", async () => {
    const token = await signed(CLAIMS, "5 minutes", stranger.privateKey);

    expect(await readGoogleToken(token, googleKeys, EXPECTED)).toBeNull();
  });

  it("refuses an answer that is not signed at all", async () => {
    const [head = "", body = ""] = (await signed(CLAIMS)).split(".");

    expect(
      await readGoogleToken(`${head}.${body}.`, googleKeys, EXPECTED),
    ).toBeNull();
    expect(await readGoogleToken("bukan token", googleKeys, EXPECTED)).toBe(
      null,
    );
  });

  it.each([[false], [undefined], ["true"]])(
    "says the address is not verified when Google says %o",
    async (verified) => {
      const token = await signed({ ...CLAIMS, email_verified: verified });

      expect(await readGoogleToken(token, googleKeys, EXPECTED)).toEqual({
        email: "budi@kampus.example",
        verified: false,
      });
    },
  );
});
