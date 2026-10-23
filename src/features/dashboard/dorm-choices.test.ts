import { describe, expect, it } from "vitest";
import { heldByDormChoice } from "./dorm-choices";

describe("heldByDormChoice", () => {
  it("joins both Wismantara, sums the dorms into Semua asrama, and counts those in none as Non asrama", () => {
    const held = heldByDormChoice(
      new Map([
        ["wismantara_putra", 2],
        ["wismantara_putri", 3],
        ["dana_rakca", 7],
        [null, 11],
      ]),
    );

    expect(held).toEqual(
      new Map([
        ["semua", 12],
        ["wismantara", 5],
        ["dana_rakca", 7],
        ["cipta_bakti", 0],
        ["non", 11],
      ]),
    );
  });

  it("gives every choice none when nobody is counted", () => {
    const held = heldByDormChoice(new Map());

    expect([...held.values()]).toEqual([0, 0, 0, 0, 0]);
  });
});
