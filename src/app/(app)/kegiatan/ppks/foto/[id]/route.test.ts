import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OpenedPhoto } from "@/features/activities/open-attendance-photo";
import { GET } from "./route";

const ACCOUNT = { id: "account-1" };
const DB = { name: "database" };
const STORE = { name: "file storage" };

const opener = vi.hoisted(() => ({
  answer: null as OpenedPhoto | null,
  calls: [] as unknown[][],
}));

vi.mock("@/auth/current-account", () => ({
  currentAccount: async () => ACCOUNT,
}));
vi.mock("@/db/database", () => ({ database: () => DB }));
vi.mock("@/files/file-storage", () => ({ fileStorage: () => STORE }));
vi.mock("@/features/activities/open-attendance-photo", () => ({
  async openAttendancePhoto(...given: unknown[]) {
    opener.calls.push(given);
    if (!opener.answer) throw new Error("The check gave no answer.");
    return opener.answer;
  },
}));

const BYTES = new Uint8Array([0xff, 0xd8, 0xff]);

function opened(id: string): Promise<Response> {
  return GET(new Request(`http://localhost/kegiatan/ppks/foto/${id}`), {
    params: Promise.resolve({ id }),
  });
}

beforeEach(() => {
  opener.answer = null;
  opener.calls.length = 0;
});

describe("the photo of an attendance", () => {
  it("is shown in the browser tab, not downloaded, to whom the opener lets open it", async () => {
    opener.answer = {
      ok: true,
      file: { name: "foto.jpg", contentType: "image/jpeg", bytes: BYTES },
    };

    const answer = await opened("attendance-1");

    expect(opener.calls).toEqual([[DB, STORE, ACCOUNT, "attendance-1"]]);
    expect(answer.status).toBe(200);
    expect(answer.headers.get("Content-Disposition")).toMatch(/^inline; /);
    expect(answer.headers.get("Content-Type")).toBe("image/jpeg");
    expect(new Uint8Array(await answer.arrayBuffer())).toEqual(BYTES);
  });

  it("is refused as the opener says", async () => {
    opener.answer = { ok: false, refusal: "not-allowed" };

    const answer = await opened("attendance-1");

    expect(answer.status).toBe(403);
    expect(answer.headers.get("Content-Disposition")).toBeNull();
  });
});
