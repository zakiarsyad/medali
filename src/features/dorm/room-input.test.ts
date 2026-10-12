import { describe, expect, it } from "vitest";
import {
  parseId,
  parseNewRoom,
  parseRoomDetails,
  type SentRoom,
} from "./room-input";

const SENT: SentRoom = {
  dorm: "dana_rakca",
  floor: "2",
  number: "201",
  capacity: "4",
};

function errorOf(sent: Partial<SentRoom>): string | null {
  const parsed = parseNewRoom({ ...SENT, ...sent });
  return parsed.ok ? null : parsed.error;
}

describe("parseNewRoom", () => {
  it("takes a room with nothing wrong in it", () => {
    expect(parseNewRoom(SENT)).toEqual({
      ok: true,
      value: { dorm: "dana_rakca", floor: 2, number: "201", capacity: 4 },
    });
  });

  it("keeps a number without spaces around it and in capital letters", () => {
    const parsed = parseNewRoom({ ...SENT, number: "  2a " });
    expect(parsed).toMatchObject({ ok: true, value: { number: "2A" } });
  });

  it.each(["", "wismantara", "DANA_RAKCA"])("refuses the dorm %j", (dorm) => {
    expect(errorOf({ dorm })).toBe("Pilih asrama.");
  });

  it.each(["0", "9", "", "dua", "1.5", "-1"])(
    "refuses the floor %j",
    (floor) => {
      expect(errorOf({ floor })).toBe("Pilih lantai 1 sampai 8.");
    },
  );

  it.each(["1", "8"])("takes the floor %s", (floor) => {
    expect(errorOf({ floor })).toBeNull();
  });

  it.each(["", "   "])("refuses the empty number %j", (number) => {
    expect(errorOf({ number })).toBe("Isi nomor kamar.");
  });

  it("refuses a number longer than 10 characters", () => {
    expect(errorOf({ number: "12345678901" })).toBe(
      "Nomor kamar paling panjang 10 karakter.",
    );
    expect(errorOf({ number: "1234567890" })).toBeNull();
  });

  it.each(["2/1", "<b>", "-1", "2_A", "kamar;"])(
    "refuses the number %j",
    (number) => {
      expect(errorOf({ number })).toContain("Nomor kamar hanya berisi");
    },
  );

  it.each(["0", "13", "", "empat", "4.5", "-2", "100"])(
    "refuses the kapasitas %j",
    (capacity) => {
      expect(errorOf({ capacity })).toBe("Kapasitas diisi angka 1 sampai 12.");
    },
  );

  it.each(["1", "12"])("takes the kapasitas %s", (capacity) => {
    expect(errorOf({ capacity })).toBeNull();
  });
});

describe("parseRoomDetails", () => {
  it("takes a number and a kapasitas", () => {
    expect(parseRoomDetails({ number: "3B", capacity: "6" })).toEqual({
      ok: true,
      value: { number: "3B", capacity: 6 },
    });
  });

  it("refuses a kapasitas out of range", () => {
    expect(parseRoomDetails({ number: "3B", capacity: "0" }).ok).toBe(false);
  });
});

describe("parseId", () => {
  it("takes a text with the shape of a row id", () => {
    const id = "00000000-0000-4000-8000-000000000001";
    expect(parseId(id)).toEqual({ ok: true, value: id });
  });

  it.each(["", "1", "bukan-id"])("refuses %j", (sent) => {
    expect(parseId(sent).ok).toBe(false);
  });
});
