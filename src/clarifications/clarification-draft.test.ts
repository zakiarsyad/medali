import { describe, expect, it } from "vitest";
import type { Parsed } from "@/parsed";
import {
  type ClarificationDraft,
  draftOf,
  readyToSend,
  type SendEdges,
  sendDraft,
} from "./clarification-draft";

const SCHEDULE_ID = "00000000-0000-4000-8000-0000000000c1";
const EXPLANATION = "Demam sejak malam sebelum kegiatan.";
const TOO_SHORT = "Tulis penjelasan minimal satu kalimat.";
const MISSING = "Lampirkan dokumen pendukung.";
const WRONG_KIND = "Lampiran harus berupa PDF atau gambar.";
const SENT = { ok: true, value: "Klarifikasi terkirim." } as const;

function paper(): File {
  return new File(["%PDF-1.4"], "surat.pdf", { type: "application/pdf" });
}

function picture(name = "foto.png"): File {
  return new File([new Uint8Array(2000)], name, { type: "image/png" });
}

function draft(more: Partial<ClarificationDraft> = {}): ClarificationDraft {
  return {
    target: { scheduleId: SCHEDULE_ID },
    reason: "sick",
    explanation: EXPLANATION,
    file: paper(),
    ...more,
  };
}

/** The edges of a send, which note what goes through them. */
function edgesOf(more: Partial<SendEdges> = {}) {
  const shrunk: Blob[] = [];
  const sent: FormData[] = [];
  const rethrown: unknown[] = [];
  const edges: SendEdges = {
    async shrink(file) {
      shrunk.push(file);
      return new Blob(["gambar kecil"], { type: "image/jpeg" });
    },
    async send(form): Promise<Parsed<string>> {
      sent.push(form);
      return SENT;
    },
    rethrow: (error) => rethrown.push(error),
    ...more,
  };
  return { edges, shrunk, sent, rethrown };
}

describe("draftOf", () => {
  it("reads what the fields of the form hold, for the schedule of its row", () => {
    const form = new FormData();
    form.set("reason", "campus_duty");
    form.set("explanation", EXPLANATION);
    form.set("file", paper());
    form.set("scheduleId", "yang-lain");

    const read = draftOf({ scheduleId: SCHEDULE_ID }, form);

    expect(read).toMatchObject({
      target: { scheduleId: SCHEDULE_ID },
      reason: "campus_duty",
      explanation: EXPLANATION,
    });
    expect(read.file?.name).toBe("surat.pdf");
  });

  it("holds no file when none was picked: the browser sends an empty one", () => {
    const form = new FormData();
    form.set("file", new File([], ""));

    expect(draftOf({ scheduleId: SCHEDULE_ID }, form).file).toBeNull();
    expect(draftOf({ scheduleId: SCHEDULE_ID }, new FormData())).toEqual({
      target: { scheduleId: SCHEDULE_ID },
      reason: "",
      explanation: "",
      file: null,
    });
  });
});

describe("readyToSend", () => {
  it("asks for the explanation first, then for the file", async () => {
    const { edges } = edgesOf();
    const neither = draft({ explanation: "pendek", file: null });

    expect(await readyToSend(neither, edges)).toEqual({
      ok: false,
      error: TOO_SHORT,
    });
    expect(await readyToSend(draft({ file: null }), edges)).toEqual({
      ok: false,
      error: MISSING,
    });
  });

  it("refuses a file of another kind without reading it", async () => {
    const { edges, shrunk } = edgesOf();
    const file = new File(["<svg/>"], "gambar.svg", { type: "image/svg+xml" });

    expect(await readyToSend(draft({ file }), edges)).toEqual({
      ok: false,
      error: WRONG_KIND,
    });
    expect(shrunk).toEqual([]);
  });

  it("refuses a file over 4 MB before it is sent, with the limit in MB", async () => {
    const { edges, sent } = edgesOf();
    const file = new File([new Uint8Array(4 * 1024 * 1024 + 1)], "surat.pdf");

    expect(await sendDraft(draft({ file }), edges)).toEqual({
      error: "Ukuran lampiran maksimal 4 MB.",
      done: null,
    });
    expect(sent).toEqual([]);
  });

  it("sends a PDF as it is, with what the form holds", async () => {
    const { edges, shrunk } = edgesOf();

    const ready = await readyToSend(draft(), edges);

    if (!ready.ok) throw new Error(ready.error);
    const sent = ready.value.get("file") as File;
    expect(ready.value.get("scheduleId")).toBe(SCHEDULE_ID);
    expect(ready.value.get("reason")).toBe("sick");
    expect(ready.value.get("explanation")).toBe(EXPLANATION);
    expect(sent.name).toBe("surat.pdf");
    expect(await sent.text()).toBe("%PDF-1.4");
    expect(shrunk).toEqual([]);
  });

  it("makes a picture smaller and sends it as a JPEG", async () => {
    const { edges, shrunk } = edgesOf();
    const file = picture("surat dokter.png");

    const ready = await readyToSend(draft({ file }), edges);

    if (!ready.ok) throw new Error(ready.error);
    const sent = ready.value.get("file") as File;
    expect(shrunk).toEqual([file]);
    expect(sent.name).toBe("surat dokter.jpg");
    expect(await sent.text()).toBe("gambar kecil");
  });

  it("says the file is no picture when the browser cannot read it as one, or fails on it", async () => {
    const unreadable = edgesOf({ shrink: async () => null });
    const failing = edgesOf({
      async shrink() {
        throw new Error("The canvas is out of memory.");
      },
    });
    const sent = draft({ file: picture() });

    expect(await readyToSend(sent, unreadable.edges)).toEqual({
      ok: false,
      error: WRONG_KIND,
    });
    expect(await readyToSend(sent, failing.edges)).toEqual({
      ok: false,
      error: WRONG_KIND,
    });
  });
});

describe("sendDraft", () => {
  it("sends nothing while something is wrong, and says what", async () => {
    const { edges, sent } = edgesOf();

    const said = await sendDraft(draft({ explanation: " terlalu  " }), edges);

    expect(said).toEqual({ error: TOO_SHORT, done: null });
    expect(sent).toEqual([]);
  });

  it("sends the form once and says what the server answered", async () => {
    const { edges, sent } = edgesOf();

    const said = await sendDraft(draft(), edges);

    expect(said).toEqual({ error: null, done: "Klarifikasi terkirim." });
    expect(sent).toHaveLength(1);
  });

  it("says what the server refused", async () => {
    const error = "Batas klarifikasi sudah lewat.";
    const { edges } = edgesOf({ send: async () => ({ ok: false, error }) });

    expect(await sendDraft(draft(), edges)).toEqual({ error, done: null });
  });

  it("says so when the form did not arrive, and can be sent again", async () => {
    const lost = new Error("Failed to fetch");
    let tries = 0;
    const { edges, rethrown } = edgesOf({
      async send() {
        tries += 1;
        if (tries === 1) throw lost;
        return SENT;
      },
    });
    const kept = draft();

    const first = await sendDraft(kept, edges);
    const second = await sendDraft(kept, edges);

    expect(first).toEqual({
      error:
        "Klarifikasi tidak terkirim. Periksa koneksi internet, lalu tekan Kirim klarifikasi lagi.",
      done: null,
    });
    expect(rethrown).toEqual([lost]);
    expect(second).toEqual({ error: null, done: "Klarifikasi terkirim." });
  });

  it("says the file is too large when the send is refused for its size", async () => {
    const { edges } = edgesOf({
      async send() {
        throw new Error("Body exceeded 4400000 limit.");
      },
    });

    expect(await sendDraft(draft(), edges)).toEqual({
      error: "Ukuran lampiran maksimal 4 MB.",
      done: null,
    });
  });

  it("passes on an answer that leads elsewhere, as when the student was signed out", async () => {
    const elsewhere = new Error("NEXT_REDIRECT");
    const { edges } = edgesOf({
      async send() {
        throw elsewhere;
      },
      rethrow(error) {
        throw error;
      },
    });

    await expect(sendDraft(draft(), edges)).rejects.toBe(elsewhere);
  });
});
