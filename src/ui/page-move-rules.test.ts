import { describe, expect, it } from "vitest";
import {
  type LinkMovePress,
  linkMoveAddress,
  movesAway,
} from "./page-move-rules";

const HERE = "https://medali.test/asrama/kamar?page=2";

function press(change: Partial<LinkMovePress> = {}): LinkMovePress {
  return {
    href: "/asrama/kesehatan",
    button: 0,
    withKey: false,
    target: "",
    download: false,
    takenByApp: true,
    ...change,
  };
}

describe("the address a press on a link moves to", () => {
  it("is the address of a link the app opens itself", () => {
    expect(linkMoveAddress(press(), HERE)).toBe("/asrama/kesehatan");
  });

  it("keeps what follows the ? of the link", () => {
    const pressed = press({ href: "/asrama/kamar?page=3" });

    expect(linkMoveAddress(pressed, HERE)).toBe("/asrama/kamar?page=3");
  });

  it("is none for a link the browser opens by itself, such as a file", () => {
    expect(linkMoveAddress(press({ takenByApp: false }), HERE)).toBeNull();
  });

  it("is none for a link opened in a new tab or window", () => {
    expect(linkMoveAddress(press({ target: "_blank" }), HERE)).toBeNull();
    expect(linkMoveAddress(press({ withKey: true }), HERE)).toBeNull();
    expect(linkMoveAddress(press({ button: 1 }), HERE)).toBeNull();
  });

  it("is none for a link that saves a file", () => {
    expect(linkMoveAddress(press({ download: true }), HERE)).toBeNull();
  });

  it("is none for a link to another site", () => {
    const pressed = press({ href: "https://example.com/asrama" });

    expect(linkMoveAddress(pressed, HERE)).toBeNull();
  });
});

describe("a move to an address", () => {
  it("moves away from another page, or the same page with other filters", () => {
    expect(movesAway("/asrama/kesehatan", HERE)).toBe(true);
    expect(movesAway("/asrama/kamar?page=3", HERE)).toBe(true);
  });

  it("does not move away to the page already open", () => {
    expect(movesAway("/asrama/kamar?page=2", HERE)).toBe(false);
  });

  it("does not move away to a part of the page already open", () => {
    expect(movesAway("/asrama/kamar?page=2#rooms", HERE)).toBe(false);
  });
});
