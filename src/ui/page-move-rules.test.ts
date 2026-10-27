import { describe, expect, it } from "vitest";
import {
  chosenPath,
  isChosen,
  type LinkMovePress,
  linkMoveAddress,
  movesAway,
  opensPath,
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

describe("the tab or menu item shown as chosen", () => {
  it("is the one open while no move runs", () => {
    expect(isChosen(true, "/asrama/kamar", null)).toBe(true);
    expect(isChosen(false, "/asrama/kesehatan", null)).toBe(false);
  });

  it("is the one pressed while its page loads, in place of the one open", () => {
    expect(isChosen(true, "/asrama/kamar", "/asrama/kesehatan")).toBe(false);
    expect(isChosen(false, "/asrama/kesehatan", "/asrama/kesehatan")).toBe(
      true,
    );
  });

  it("is the menu item of the page a pressed tab of it loads", () => {
    expect(isChosen(false, "/asrama", "/asrama/kesehatan")).toBe(true);
    expect(isChosen(false, "/as", "/asrama/kesehatan")).toBe(false);
  });
});

describe("the path being moved to that a tab or menu item shows", () => {
  it("is none while a filter of the page open loads", () => {
    expect(chosenPath("/asrama/kamar", "/asrama/kamar")).toBeNull();
  });

  it("is the path of another page that loads", () => {
    expect(chosenPath("/asrama/kesehatan", "/asrama/kamar")).toBe(
      "/asrama/kesehatan",
    );
  });

  it("is none while no move runs", () => {
    expect(chosenPath(null, "/asrama/kamar")).toBeNull();
  });
});

describe("whether a path is within a page", () => {
  it("holds the page itself and every page under it", () => {
    expect(opensPath("/asrama", "/asrama")).toBe(true);
    expect(opensPath("/asrama/kamar", "/asrama")).toBe(true);
    expect(opensPath("/asramax", "/asrama")).toBe(false);
  });
});
