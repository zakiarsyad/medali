import { afterEach, describe, expect, it, vi } from "vitest";
import { shrinkPhoto } from "./shrink-photo";

/*
 * No browser runs these checks, so the browser's own parts are stood in:
 * the picture it reads from a file, and the canvas it draws on. What is
 * checked is what the code asks of them.
 */

const ADDRESS = "blob:berkas-uji";

interface DrawnPicture {
  width: number;
  height: number;
  drawn: unknown[][];
  kind: string | undefined;
  quality: number | undefined;
}

/** What the stand-in browser is like for one check. */
interface Browser {
  /** The size of the picture a file holds, or null when it holds none. */
  picture: { width: number; height: number } | null;
  /** Whether the browser gives a canvas something to draw with. */
  canDraw: boolean;
}

function standIn(browser: Browser) {
  const canvases: DrawnPicture[] = [];
  const released: string[] = [];

  class Picture {
    naturalWidth = browser.picture?.width ?? 0;
    naturalHeight = browser.picture?.height ?? 0;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_address: string) {
      // As in a browser, the picture is read after the code has gone on.
      queueMicrotask(() =>
        browser.picture === null ? this.onerror?.() : this.onload?.(),
      );
    }
  }

  function canvas() {
    const made: DrawnPicture = {
      width: 0,
      height: 0,
      drawn: [],
      kind: undefined,
      quality: undefined,
    };
    canvases.push(made);
    return Object.assign(made, {
      getContext: () =>
        browser.canDraw
          ? { drawImage: (...asked: unknown[]) => made.drawn.push(asked) }
          : null,
      toBlob(give: (blob: Blob) => void, kind: string, quality: number) {
        made.kind = kind;
        made.quality = quality;
        give(new Blob(["foto kecil"], { type: kind }));
      },
    });
  }

  vi.stubGlobal("Image", Picture);
  vi.stubGlobal("document", { createElement: canvas });
  vi.spyOn(URL, "createObjectURL").mockReturnValue(ADDRESS);
  vi.spyOn(URL, "revokeObjectURL").mockImplementation((address) => {
    released.push(address);
  });
  return { canvases, released };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const FILE = new Blob(["gambar besar"], { type: "image/png" });

describe("shrinkPhoto", () => {
  it("draws a large picture 1,280 dots on its longest side, shape kept, and gives a JPEG", async () => {
    const { canvases } = standIn({
      picture: { width: 4000, height: 3000 },
      canDraw: true,
    });

    const photo = await shrinkPhoto(FILE);

    expect(canvases).toHaveLength(1);
    expect(canvases[0]).toMatchObject({ width: 1280, height: 960 });
    expect(canvases[0]?.drawn).toEqual([
      [expect.objectContaining({ naturalWidth: 4000 }), 0, 0, 1280, 960],
    ]);
    expect(canvases[0]?.kind).toBe("image/jpeg");
    expect(photo?.type).toBe("image/jpeg");
    expect(await photo?.text()).toBe("foto kecil");
  });

  it("makes a tall picture 1,280 dots high", async () => {
    const { canvases } = standIn({
      picture: { width: 3000, height: 4000 },
      canDraw: true,
    });

    await shrinkPhoto(FILE);

    expect(canvases[0]).toMatchObject({ width: 960, height: 1280 });
  });

  it("draws a small copy as small as asked", async () => {
    const { canvases } = standIn({
      picture: { width: 4000, height: 3000 },
      canDraw: true,
    });

    const photo = await shrinkPhoto(FILE, 240);

    expect(canvases[0]).toMatchObject({ width: 240, height: 180 });
    expect(photo?.type).toBe("image/jpeg");
  });

  it("keeps the size of a small picture, and still gives a JPEG that keeps part of the detail", async () => {
    const { canvases } = standIn({
      picture: { width: 640, height: 480 },
      canDraw: true,
    });

    const photo = await shrinkPhoto(FILE);

    expect(canvases[0]).toMatchObject({ width: 640, height: 480 });
    expect(canvases[0]?.quality).toBeGreaterThan(0.5);
    expect(canvases[0]?.quality).toBeLessThan(1);
    expect(photo?.type).toBe("image/jpeg");
  });

  it("gives nothing for a file the browser cannot read as a picture, and draws nothing", async () => {
    const { canvases } = standIn({ picture: null, canDraw: true });

    expect(await shrinkPhoto(FILE)).toBeNull();
    expect(canvases).toEqual([]);
  });

  it("gives nothing when the browser has nothing to draw with", async () => {
    standIn({ picture: { width: 4000, height: 3000 }, canDraw: false });

    expect(await shrinkPhoto(FILE)).toBeNull();
  });

  it.each([
    ["was made smaller", { width: 4000, height: 3000 }],
    ["could not be read", null],
  ])(
    "lets go of the file it read once the picture %s",
    async (_what, picture) => {
      const { released } = standIn({ picture, canDraw: true });

      await shrinkPhoto(FILE);

      expect(URL.createObjectURL).toHaveBeenCalledWith(FILE);
      expect(released).toEqual([ADDRESS]);
    },
  );
});
