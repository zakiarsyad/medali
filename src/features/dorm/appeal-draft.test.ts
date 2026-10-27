import { describe, expect, it } from "vitest";
import type { SendEdges } from "@/clarifications/clarification-draft";
import type { Parsed } from "@/parsed";
import {
  APPEAL_SEND_FAILED,
  type AppealDraft,
  appealDraftOf,
  sendAppealDraft,
} from "./appeal-draft";

const VIOLATION_ID = "00000000-0000-4000-8000-0000000000a1";
const REASON = "Saya sedang izin resmi pada jam tersebut.";
const SENT = {
  ok: true,
  value: "Advokasi terkirim. Badan Asrama Mahasiswa akan memeriksanya.",
} as const;

function draft(more: Partial<AppealDraft> = {}): AppealDraft {
  return { violationId: VIOLATION_ID, reason: REASON, file: null, ...more };
}

function edgesOf(more: Partial<SendEdges> = {}) {
  const sent: FormData[] = [];
  const edges: SendEdges = {
    shrink: async () => new Blob(["gambar kecil"], { type: "image/jpeg" }),
    async send(form): Promise<Parsed<string>> {
      sent.push(form);
      return SENT;
    },
    rethrow: () => undefined,
    ...more,
  };
  return { edges, sent };
}

describe("appealDraftOf", () => {
  it("takes an empty file as no proof", () => {
    const form = new FormData();
    form.set("reason", REASON);
    form.set("file", new File([], ""));

    expect(appealDraftOf(VIOLATION_ID, form)).toEqual(draft());
  });
});

describe("sendAppealDraft", () => {
  it("sends an appeal without a proof", async () => {
    const { edges, sent } = edgesOf();

    expect(await sendAppealDraft(draft(), edges)).toEqual({
      error: null,
      done: SENT.value,
    });
    expect(sent[0]?.get("violationId")).toBe(VIOLATION_ID);
    expect(sent[0]?.get("reason")).toBe(REASON);
    expect(sent[0]?.get("file")).toBeNull();
  });

  it("sends a picture made smaller, as a JPEG", async () => {
    const { edges, sent } = edgesOf();
    const picture = new File([new Uint8Array(2000)], "bukti.png");

    await sendAppealDraft(draft({ file: picture }), edges);

    const file = sent[0]?.get("file");
    expect(file instanceof File && file.name).toBe("bukti.jpg");
  });

  it("refuses a short reason and a proof of the wrong kind or too large, sending nothing", async () => {
    const { edges, sent } = edgesOf();
    const big = new File([new Uint8Array(4 * 1024 * 1024 + 1)], "bukti.pdf");

    expect(await sendAppealDraft(draft({ reason: "Izin" }), edges)).toEqual({
      error: "Alasan advokasi minimal 15 karakter.",
      done: null,
    });
    expect(
      (await sendAppealDraft(draft({ file: new File(["a"], "a.exe") }), edges))
        .error,
    ).toBe("Lampiran harus berupa PDF atau gambar.");
    expect((await sendAppealDraft(draft({ file: big }), edges)).error).toBe(
      "Ukuran lampiran maksimal 4 MB.",
    );
    expect(sent).toHaveLength(0);
  });

  it("says the appeal did not arrive when the send fails", async () => {
    const { edges } = edgesOf({
      send: async () => {
        throw new Error("offline");
      },
    });

    expect(await sendAppealDraft(draft(), edges)).toEqual({
      error: APPEAL_SEND_FAILED,
      done: null,
    });
  });
});
