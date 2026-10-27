import { describe, expect, it, vi } from "vitest";
import { NO_REASON } from "./request-input";
import { NO_PHOTO } from "./request-photo";
import {
  REQUEST_SEND_FAILED,
  type ReadyPhoto,
  type RequestFields,
  requestFormData,
  type SendEdges,
  sendRequest,
} from "./request-send";

const TODAY = "2026-10-15";
const ID = "0b7a2c1e-5d4f-4a3b-9c8d-7e6f5a4b3c2d";

const FIELDS: RequestFields = {
  reason: "knowledge_sharing",
  day: "2026-10-14",
  report: "Mengisi sesi berbagi pengetahuan literasi keuangan.",
};

const PHOTO: ReadyPhoto = {
  photo: new Blob(["besar"], { type: "image/jpeg" }),
  thumb: new Blob(["kecil"], { type: "image/jpeg" }),
  preview: "blob:pratinjau",
};

function edges(send: SendEdges["send"]): SendEdges {
  return { send, rethrow: () => {} };
}

describe("requestFormData", () => {
  it("holds the key, the fields, and each photo with its small copy, in order", async () => {
    const form = requestFormData(ID, FIELDS, [PHOTO, PHOTO]);

    expect(form.get("id")).toBe(ID);
    expect(form.get("reason")).toBe("knowledge_sharing");
    expect(form.get("day")).toBe("2026-10-14");
    expect(form.get("report")).toBe(FIELDS.report);
    const photos = form.getAll("photo");
    const thumbs = form.getAll("thumb");
    expect(photos).toHaveLength(2);
    expect(thumbs).toHaveLength(2);
    expect(await (photos[0] as File).text()).toBe("besar");
    expect(await (thumbs[0] as File).text()).toBe("kecil");
    expect((photos[0] as File).name).toBe("foto-bukti-siku.jpg");
  });
});

describe("sendRequest", () => {
  it("sends nothing and says what is missing first", async () => {
    const send = vi.fn();

    const answer = await sendRequest(
      ID,
      { ...FIELDS, reason: "" },
      [],
      TODAY,
      edges(send),
    );

    expect(answer).toEqual({ error: NO_REASON, done: null });
    expect(send).not.toHaveBeenCalled();
  });

  it("sends nothing without a photo", async () => {
    const send = vi.fn();

    const answer = await sendRequest(ID, FIELDS, [], TODAY, edges(send));

    expect(answer).toEqual({ error: NO_PHOTO, done: null });
    expect(send).not.toHaveBeenCalled();
  });

  it("gives what the server answered", async () => {
    const sent = await sendRequest(
      ID,
      FIELDS,
      [PHOTO],
      TODAY,
      edges(async () => ({ ok: true, value: "Pengajuan terkirim." })),
    );
    const refused = await sendRequest(
      ID,
      FIELDS,
      [PHOTO],
      TODAY,
      edges(async () => ({ ok: false, error: "Ditolak." })),
    );

    expect(sent).toEqual({ error: null, done: "Pengajuan terkirim." });
    expect(refused).toEqual({ error: "Ditolak.", done: null });
  });

  it("says to try again when the request did not arrive", async () => {
    const answer = await sendRequest(
      ID,
      FIELDS,
      [PHOTO],
      TODAY,
      edges(async () => {
        throw new Error("Tidak ada koneksi.");
      }),
    );

    expect(answer).toEqual({ error: REQUEST_SEND_FAILED, done: null });
  });

  it("says a photo is too large when the request is refused for its size", async () => {
    const answer = await sendRequest(
      ID,
      FIELDS,
      [PHOTO],
      TODAY,
      edges(async () => {
        throw new Error("Body exceeded 4400000 limit.");
      }),
    );

    expect(answer).toEqual({
      error: "Foto terlalu besar. Pilih foto lain.",
      done: null,
    });
  });
});
