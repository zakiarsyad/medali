import { describe, expect, it } from "vitest";
import { closesByGoingBack } from "./pressed-box";

const DETAIL = "/mahasiswa?hal=2&profil=one";

describe("closesByGoingBack", () => {
  it("goes back when a press opened the box that is shown", () => {
    expect(closesByGoingBack(DETAIL, DETAIL)).toBe(true);
  });

  it("does not go back when no press opened a box, as after a typed address or a reload", () => {
    expect(closesByGoingBack(null, DETAIL)).toBe(false);
  });

  it("does not go back when the press opened another box", () => {
    expect(closesByGoingBack("/mahasiswa?profil=two", DETAIL)).toBe(false);
  });
});
