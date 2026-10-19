import { describe, expect, it } from "vitest";
import { addingAddress, readRoomsParams, roomsAddress } from "./rooms-address";

describe("readRoomsParams", () => {
  it("opens the first dorm on floor 1 with no search", () => {
    expect(readRoomsParams({})).toEqual({
      dorm: "wismantara_putra",
      floor: 1,
      query: "",
      adding: null,
    });
  });

  it("reads the dorm, the floor and the search", () => {
    const params = { asrama: "dana_rakca", lantai: "8", q: "  sari " };
    expect(readRoomsParams(params)).toEqual({
      dorm: "dana_rakca",
      floor: 8,
      query: "sari",
      adding: null,
    });
  });

  it.each(["0", "9", "2.5", "dua", "-1", "02"])(
    "opens floor 1 for the floor %s",
    (lantai) => {
      expect(readRoomsParams({ lantai }).floor).toBe(1);
    },
  );

  it("opens the first dorm for a dorm that does not exist", () => {
    expect(readRoomsParams({ asrama: "wismantara" }).dorm).toBe(
      "wismantara_putra",
    );
  });

  it("takes the first of a part that is given twice", () => {
    const params = { asrama: ["cipta_bakti", "dana_rakca"] };
    expect(readRoomsParams(params).dorm).toBe("cipta_bakti");
  });

  it("cuts a search that is too long", () => {
    expect(readRoomsParams({ q: "a".repeat(500) }).query).toHaveLength(100);
  });
});

describe("roomsAddress", () => {
  it("writes the dorm and the floor the way they are read", () => {
    const address = roomsAddress("dana_rakca", 3);
    expect(address).toBe("/asrama/kamar?asrama=dana_rakca&lantai=3");
    const query = new URLSearchParams(address.split("?")[1]);
    expect(readRoomsParams(Object.fromEntries(query))).toEqual({
      dorm: "dana_rakca",
      floor: 3,
      query: "",
      adding: null,
    });
  });
});

describe("addingAddress", () => {
  it("opens Tambah penghuni with no search, and reads the search given", () => {
    const address = addingAddress("dana_rakca", 3);
    const query = new URLSearchParams(address.split("?")[1]);
    expect(readRoomsParams(Object.fromEntries(query)).adding).toBe("");
    query.set("cari", "  sari ");
    expect(readRoomsParams(Object.fromEntries(query)).adding).toBe("sari");
  });

  it("keeps Tambah penghuni closed for any other value", () => {
    expect(readRoomsParams({ tambah: "ya", cari: "sari" }).adding).toBeNull();
  });
});
