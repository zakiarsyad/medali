import { describe, expect, it } from "vitest";
import { fileFault } from "@/files/file-check";
import {
  PHOTO_FAULTS,
  PHOTO_FILE_NAME,
  PHOTO_RULE,
  pickedPhotoFault,
  SENT_PHOTO_MAX_BYTES,
} from "./attendance-photo";
import { testPhoto } from "./test-photo";

describe("pickedPhotoFault", () => {
  it.each(["image/jpeg", "image/png", "image/heic", "image/webp"])(
    "takes a picked %s of up to 8 MB",
    (type) => {
      expect(pickedPhotoFault(type, 1)).toBeNull();
      expect(pickedPhotoFault(type, 8 * 1024 * 1024)).toBeNull();
    },
  );

  it.each(["application/pdf", "text/csv", "video/mp4", ""])(
    'says "Berkas harus berupa gambar." for a picked file of kind "%s"',
    (type) => {
      expect(pickedPhotoFault(type, 1000)).toBe("Berkas harus berupa gambar.");
    },
  );

  it('says "Ukuran foto maksimal 8 MB." for a picture one byte over', () => {
    expect(pickedPhotoFault("image/jpeg", 8 * 1024 * 1024 + 1)).toBe(
      "Ukuran foto maksimal 8 MB.",
    );
  });

  it("refuses an empty file", () => {
    expect(pickedPhotoFault("image/jpeg", 0)).toBe(
      "Berkas harus berupa gambar.",
    );
  });
});

describe("what the server takes as a photo", () => {
  function faultOf(bytes: Uint8Array, name = PHOTO_FILE_NAME): string | null {
    const fault = fileFault({ name, bytes }, PHOTO_RULE);
    return fault === null ? null : PHOTO_FAULTS[fault];
  }

  it("takes a JPEG picture of up to 4 MB", () => {
    expect(SENT_PHOTO_MAX_BYTES).toBe(4 * 1024 * 1024);
    expect(faultOf(testPhoto())).toBeNull();
    expect(faultOf(testPhoto(SENT_PHOTO_MAX_BYTES))).toBeNull();
  });

  it("refuses a picture one byte over 4 MB", () => {
    expect(faultOf(testPhoto(SENT_PHOTO_MAX_BYTES + 1))).toBe(
      "Foto terlalu besar. Pilih foto lain.",
    );
  });

  it("refuses what is not a picture, whatever its name says", () => {
    const text = new TextEncoder().encode("bukan gambar");

    expect(faultOf(text)).toBe("Berkas harus berupa gambar.");
    expect(faultOf(new Uint8Array())).toBe("Berkas harus berupa gambar.");
    expect(faultOf(testPhoto(), "foto.pdf")).toBe(
      "Berkas harus berupa gambar.",
    );
  });
});
