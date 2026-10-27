import { afterEach, describe, expect, it, vi } from "vitest";
import { isWithin, markedPath, pageOpening, watchOpening } from "./page-change";

const TABS = ["/asrama/kamar", "/asrama/kesehatan"];

describe("the marked tab or menu item", () => {
  it("follows the page that is open while none is opening", () => {
    expect(markedPath(TABS, null, "/asrama/kamar")).toBe("/asrama/kamar");
  });

  it("moves at once to a tab pressed, before its page arrives", () => {
    expect(markedPath(TABS, "/asrama/kesehatan", "/asrama/kamar")).toBe(
      "/asrama/kesehatan",
    );
  });

  it("stays where it is while a page that is not one of them opens", () => {
    expect(markedPath(TABS, "/asrama", "/asrama/kesehatan")).toBe(
      "/asrama/kesehatan",
    );
    expect(markedPath(TABS, "/mahasiswa", "/asrama/kamar")).toBe(
      "/asrama/kamar",
    );
  });

  it("counts a page under an address as within it, but not a look-alike", () => {
    expect(isWithin("/asrama", "/asrama")).toBe(true);
    expect(isWithin("/asrama/kamar", "/asrama")).toBe(true);
    expect(isWithin("/asrama-baru", "/asrama")).toBe(false);
  });
});

describe("a page opening", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is shown by its path, whatever address it is opened by", () => {
    vi.stubGlobal("location", { href: "http://localhost/asrama/kamar" });
    const show = vi.fn();
    const stop = watchOpening(show);

    pageOpening("/mahasiswa?cari=budi&halaman=2");
    pageOpening("http://localhost/asrama/kesehatan");
    stop();

    expect(show.mock.calls).toEqual([["/mahasiswa"], ["/asrama/kesehatan"]]);
  });

  it("shows nothing once the screen stopped watching", () => {
    vi.stubGlobal("location", { href: "http://localhost/asrama/kamar" });
    const show = vi.fn();
    watchOpening(show)();

    pageOpening("/mahasiswa");

    expect(show).not.toHaveBeenCalled();
  });
});
