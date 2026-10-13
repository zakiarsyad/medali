import { describe, expect, it } from "vitest";
import { shrunkSize } from "./photo-size";

describe("shrunkSize", () => {
  it("keeps a picture that is small enough as it is", () => {
    expect(shrunkSize({ width: 640, height: 480 })).toEqual({
      width: 640,
      height: 480,
    });
    expect(shrunkSize({ width: 1280, height: 1280 })).toEqual({
      width: 1280,
      height: 1280,
    });
  });

  it("makes a wide picture 1280 wide, with its shape kept", () => {
    expect(shrunkSize({ width: 4000, height: 3000 })).toEqual({
      width: 1280,
      height: 960,
    });
  });

  it("makes a tall picture 1280 high, with its shape kept", () => {
    expect(shrunkSize({ width: 3000, height: 4000 })).toEqual({
      width: 960,
      height: 1280,
    });
  });

  it("never makes a side less than one dot", () => {
    expect(shrunkSize({ width: 10000, height: 2 })).toEqual({
      width: 1280,
      height: 1,
    });
  });
});
