import { describe, expect, it } from "vitest";
import {
  ONLY_PICTURES,
  PHOTO_TOO_LARGE,
  TOO_MANY_PHOTOS,
} from "./request-photo";
import { takenPicks } from "./request-picks";

const MEGABYTE = 1024 * 1024;

const jpg = { type: "image/jpeg", size: MEGABYTE };
const png = { type: "image/png", size: 2 * MEGABYTE };

describe("takenPicks", () => {
  it("takes JPG and PNG files of 5 MB at most", () => {
    const largest = { type: "image/jpeg", size: 5 * MEGABYTE };

    expect(takenPicks(0, [jpg, png, largest])).toEqual({
      taken: [jpg, png, largest],
      fault: null,
    });
  });

  it.each([
    ["a GIF", { type: "image/gif", size: MEGABYTE }],
    ["a HEIC picture", { type: "image/heic", size: MEGABYTE }],
    ["a PDF", { type: "application/pdf", size: MEGABYTE }],
    ["an empty file", { type: "image/jpeg", size: 0 }],
  ])("leaves out %s: only pictures are taken", (_what, file) => {
    expect(takenPicks(0, [file, jpg])).toEqual({
      taken: [jpg],
      fault: ONLY_PICTURES,
    });
  });

  it("leaves out a file larger than 5 MB", () => {
    const large = { type: "image/png", size: 5 * MEGABYTE + 1 };

    expect(takenPicks(0, [large])).toEqual({
      taken: [],
      fault: PHOTO_TOO_LARGE,
    });
  });

  it("takes no more than three photos in all, and says so", () => {
    expect(takenPicks(1, [jpg, png, jpg])).toEqual({
      taken: [jpg, png],
      fault: TOO_MANY_PHOTOS,
    });
    expect(takenPicks(3, [jpg])).toEqual({
      taken: [],
      fault: TOO_MANY_PHOTOS,
    });
  });

  it("says nothing when the third photo is taken and none is left out", () => {
    expect(takenPicks(2, [jpg])).toEqual({ taken: [jpg], fault: null });
  });

  it("says the first thing wrong", () => {
    const gif = { type: "image/gif", size: MEGABYTE };

    expect(takenPicks(3, [gif, jpg]).fault).toBe(ONLY_PICTURES);
  });
});
