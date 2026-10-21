import { describe, expect, it } from "vitest";
import type { Parsed } from "@/parsed";
import type { FormState } from "@/ui/form-message";
import { PhotoSenderView } from "./photo-sender-view";
import {
  createPhotoUpload,
  SEND_FAILED,
  type UploadEdges,
} from "./photo-upload";
import {
  type Drawn,
  draw,
  isPressable,
  offered,
  pickFile,
  press,
} from "./test-press";

/*
 * No browser runs these checks. The upload is drawn by calling its view
 * with the state of a real upload, and its buttons are pressed by
 * calling what the view ties to them. Only the two edges are stood in:
 * the browser's making a picture smaller and showing it, and the send
 * to the server.
 */

const SCHEDULE_ID = "00000000-0000-4000-8000-0000000000c1";
const PREVIEW = "blob:pratinjau-uji";
const PICKING = ["Ambil foto", "Pilih gambar", "Batal"];
const READY = ["Kirim presensi", "Ulangi", "Batal"];
const KEPT = {
  ok: true,
  value: "Foto kehadiran terunggah. Menunggu verifikasi Pegawai UPK.",
} as const;
const MEGABYTE = 1024 * 1024;

function picture(byteCount = 2000, type = "image/png"): File {
  return new File([new Uint8Array(byteCount)], "gambar-uji.png", { type });
}

/** A promise the check ends when it chooses, to look at what waits for it. */
function held<Value>() {
  let end: (value: Value) => void = () => {};
  let fail: (error: Error) => void = () => {};
  const promise = new Promise<Value>((resolve, reject) => {
    end = resolve;
    fail = reject;
  });
  return { promise, end, fail };
}

/** Lets everything that waits for an answer already given go on. */
function settled(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function openUpload(more: Partial<UploadEdges> = {}) {
  const shrunk: Blob[] = [];
  const sent: FormData[] = [];
  const previewed: Blob[] = [];
  const dropped: string[] = [];
  const answers: FormState[] = [];
  const cancels: string[] = [];
  /** Every restart and every answer, in the order they were told. */
  const told: string[] = [];
  /** What was told by the time each send started. */
  const toldBeforeSend: string[][] = [];
  const sends: Promise<void>[] = [];
  const edges: UploadEdges = {
    async shrink(file) {
      shrunk.push(file);
      return new Blob(["foto kecil"], { type: "image/jpeg" });
    },
    showPreview(photo) {
      previewed.push(photo);
      return PREVIEW;
    },
    dropPreview: (address) => dropped.push(address),
    async send(form): Promise<Parsed<string>> {
      sent.push(form);
      return KEPT;
    },
    rethrow() {},
    ...more,
  };
  const upload = createPhotoUpload({
    scheduleId: SCHEDULE_ID,
    edges,
    startSend(run) {
      toldBeforeSend.push([...told]);
      sends.push(run());
    },
    onAnswer(answer) {
      answers.push(answer);
      told.push("answered");
    },
    onRestart: () => told.push("restarted"),
    onCancel: () => cancels.push("cancelled"),
  });
  function drawn(): Drawn {
    return draw(
      <PhotoSenderView
        state={upload.state()}
        onPick={upload.pick}
        onSend={upload.send}
        onRedo={upload.redo}
        onCancel={upload.cancel}
      />,
    );
  }
  /** Picks a file and waits until it is made smaller and shown. */
  async function pick(file: File, way = "Pilih gambar"): Promise<void> {
    pickFile(drawn(), way, file);
    await settled();
  }
  /** Presses "Kirim presensi" and waits until the send it started ends. */
  async function send(): Promise<void> {
    const sendCount = sends.length;
    press(drawn(), "Kirim presensi");
    await sends[sendCount];
  }
  return {
    drawn,
    pick,
    send,
    /** What the screen part does when the upload leaves the screen. */
    leave: upload.leave,
    /** And what it does when the upload is put on the screen. */
    enter: upload.enter,
    shrunk,
    sent,
    previewed,
    dropped,
    answers,
    cancels,
    told,
    toldBeforeSend,
  };
}

function previewOf(drawn: Drawn): unknown {
  return drawn.find(({ type }) => type === "img")?.props.src;
}

function alertOf(drawn: Drawn): unknown {
  return drawn.find(({ props }) => props.role === "alert")?.props.children;
}

function inputOf(drawn: Drawn, place: number) {
  return drawn.filter(({ type }) => type === "input")[place]?.props;
}

describe("the upload of a card, when it opens", () => {
  it('offers "Ambil foto", "Pilih gambar" and "Batal", and shows no photo', () => {
    const { drawn } = openUpload();

    expect(offered(drawn())).toEqual(PICKING);
    expect(previewOf(drawn())).toBeUndefined();
  });

  it("opens the front camera of a phone for Ambil foto, and the pictures for Pilih gambar", () => {
    const { drawn } = openUpload();

    expect(inputOf(drawn(), 0)).toMatchObject({
      type: "file",
      accept: "image/*",
      capture: "user",
    });
    expect(inputOf(drawn(), 1)).toMatchObject({
      type: "file",
      accept: "image/*",
      capture: undefined,
    });
  });

  it('closes on "Batal" with nothing sent', () => {
    const { drawn, cancels, sent, shrunk } = openUpload();

    press(drawn(), "Batal");

    expect(cancels).toEqual(["cancelled"]);
    expect(sent).toEqual([]);
    expect(shrunk).toEqual([]);
  });
});

describe("picking a picture", () => {
  it.each(["Ambil foto", "Pilih gambar"])(
    'with "%s" makes it smaller and shows it, with "Kirim presensi", "Ulangi" and "Batal"',
    async (way) => {
      const { drawn, pick, shrunk, sent } = openUpload();
      const file = picture();

      await pick(file, way);

      expect(shrunk).toEqual([file]);
      expect(previewOf(drawn())).toBe(PREVIEW);
      expect(offered(drawn())).toEqual(READY);
      expect(sent).toEqual([]);
    },
  );

  it("says it is preparing the photo, and takes no other press, until the picture is made smaller", async () => {
    const shrinking = held<Blob | null>();
    const { drawn, cancels } = openUpload({ shrink: () => shrinking.promise });

    pickFile(drawn(), "Pilih gambar", picture());
    const waiting = drawn();
    press(waiting, "Batal");
    pickFile(waiting, "Ambil foto", picture());

    expect(waiting.map(({ props }) => props.children)).toContain(
      "Menyiapkan foto…",
    );
    expect(isPressable(waiting, "Batal")).toBe(false);
    expect(cancels).toEqual([]);

    shrinking.end(new Blob(["foto kecil"]));
    await settled();

    expect(offered(drawn())).toEqual(READY);
  });

  it('returns to picking on "Ulangi", lets go of the photo, and sends nothing', async () => {
    const { drawn, pick, dropped, sent, cancels } = openUpload();
    await pick(picture());

    press(drawn(), "Ulangi");

    expect(offered(drawn())).toEqual(PICKING);
    expect(previewOf(drawn())).toBeUndefined();
    expect(dropped).toEqual([PREVIEW]);
    expect(sent).toEqual([]);
    expect(cancels).toEqual([]);
  });

  it('closes on "Batal" after a photo was picked, lets go of it, and sends nothing', async () => {
    const { drawn, pick, dropped, sent, cancels } = openUpload();
    await pick(picture());

    press(drawn(), "Batal");

    expect(cancels).toEqual(["cancelled"]);
    expect(dropped).toEqual([PREVIEW]);
    expect(sent).toEqual([]);
  });
});

describe("picking a file that cannot be a photo", () => {
  it.each([
    ["a PDF", new File(["%PDF"], "surat.pdf", { type: "application/pdf" })],
    ["a file of no known kind", new File(["x"], "berkas", { type: "" })],
  ])(
    'says "Berkas harus berupa gambar." for %s, and neither reads nor sends it',
    async (_kind, file) => {
      const { drawn, pick, shrunk, sent } = openUpload();

      await pick(file);

      expect(alertOf(drawn())).toBe("Berkas harus berupa gambar.");
      expect(offered(drawn())).toEqual(PICKING);
      expect(shrunk).toEqual([]);
      expect(sent).toEqual([]);
    },
  );

  it('says "Ukuran foto maksimal 8 MB." for a picture over 8 MB, and neither reads nor sends it', async () => {
    const { drawn, pick, shrunk, sent } = openUpload();

    await pick(picture(8 * MEGABYTE + 1));

    expect(alertOf(drawn())).toBe("Ukuran foto maksimal 8 MB.");
    expect(offered(drawn())).toEqual(PICKING);
    expect(shrunk).toEqual([]);
    expect(sent).toEqual([]);
  });

  it("takes a picture of exactly 8 MB", async () => {
    const { drawn, pick } = openUpload();

    await pick(picture(8 * MEGABYTE));

    expect(alertOf(drawn())).toBeUndefined();
    expect(offered(drawn())).toEqual(READY);
  });

  it('says "Berkas harus berupa gambar." for a file named a picture that the browser cannot read as one', async () => {
    const { drawn, pick, sent } = openUpload({ shrink: async () => null });

    await pick(picture());

    expect(alertOf(drawn())).toBe("Berkas harus berupa gambar.");
    expect(offered(drawn())).toEqual(PICKING);
    expect(sent).toEqual([]);
  });

  it('says "Berkas harus berupa gambar." when making the picture smaller fails, and can pick again', async () => {
    const { drawn, pick, sent } = openUpload({
      shrink: () => Promise.reject(new Error("The picture broke the canvas.")),
    });

    await pick(picture());

    expect(alertOf(drawn())).toBe("Berkas harus berupa gambar.");
    expect(offered(drawn())).toEqual(PICKING);
    expect(drawn().map(({ props }) => props.children)).not.toContain(
      "Menyiapkan foto…",
    );
    expect(sent).toEqual([]);
  });

  it("makes no preview for a picture that is ready only after the upload has left the screen", async () => {
    const shrinking = held<Blob | null>();
    const { drawn, leave, previewed, dropped } = openUpload({
      shrink: () => shrinking.promise,
    });
    pickFile(drawn(), "Pilih gambar", picture());

    leave();
    shrinking.end(new Blob(["foto kecil"]));
    await settled();

    expect(previewed).toEqual([]);
    expect(dropped).toEqual([]);
  });

  it("lets go of the preview when the upload leaves the screen with a photo shown", async () => {
    const { pick, leave, dropped } = openUpload();
    await pick(picture());

    leave();

    expect(dropped).toEqual([PREVIEW]);
  });

  it("shows a picked photo when the upload was taken off the screen and put on again before, as happens while the app is developed", async () => {
    const { drawn, pick, enter, leave } = openUpload();
    enter();
    leave();
    enter();

    await pick(picture());

    expect(previewOf(drawn())).toBe(PREVIEW);
  });

  it("drops the message once a real picture is picked", async () => {
    const { drawn, pick } = openUpload();
    await pick(new File(["x"], "surat.pdf", { type: "application/pdf" }));

    await pick(picture());

    expect(alertOf(drawn())).toBeUndefined();
    expect(offered(drawn())).toEqual(READY);
  });
});

describe('"Kirim presensi"', () => {
  it("sends the photo as it was made smaller, for the schedule of the card, and passes the answer on", async () => {
    const { pick, send, sent, answers } = openUpload();
    await pick(picture());

    await send();

    expect(sent).toHaveLength(1);
    const photo = sent[0]?.get("photo");
    expect(sent[0]?.get("scheduleId")).toBe(SCHEDULE_ID);
    expect(photo).toBeInstanceOf(File);
    expect(photo instanceof File && photo.name).toBe("foto-kehadiran.jpg");
    expect(photo instanceof File && (await photo.text())).toBe("foto kecil");
    expect(answers).toEqual([{ error: null, done: KEPT.value }]);
  });

  it("passes a refusal of the server on as it is, and can be pressed again", async () => {
    const refusal: Parsed<string> = {
      ok: false,
      error: "Masa unggah foto sudah ditutup.",
    };
    const { drawn, pick, send, answers } = openUpload({
      send: async () => refusal,
    });
    await pick(picture());

    await send();

    expect(answers).toEqual([
      { error: "Masa unggah foto sudah ditutup.", done: null },
    ]);
    expect(isPressable(drawn(), "Kirim presensi")).toBe(true);
  });

  it("says so when sending fails halfway, keeps the photo, and sends it on the next press", async () => {
    const sent: FormData[] = [];
    const { drawn, pick, send, answers, dropped } = openUpload({
      async send(form) {
        sent.push(form);
        if (sent.length === 1) throw new Error("The connection was lost.");
        return KEPT;
      },
    });
    await pick(picture());

    await send();

    expect(answers).toEqual([{ error: SEND_FAILED, done: null }]);
    expect(SEND_FAILED).toBe(
      "Foto tidak terkirim. Periksa koneksi internet, lalu tekan Kirim presensi lagi.",
    );
    expect(previewOf(drawn())).toBe(PREVIEW);
    expect(dropped).toEqual([]);
    expect(isPressable(drawn(), "Kirim presensi")).toBe(true);

    await send();

    expect(sent).toHaveLength(2);
    expect(answers[1]).toEqual({ error: null, done: KEPT.value });
  });

  it("does not take for a failure what leads the student elsewhere", async () => {
    const elsewhere = new Error("Leads elsewhere.");
    const { pick, send, answers } = openUpload({
      send: () => Promise.reject(elsewhere),
      rethrow(error) {
        throw error;
      },
    });
    await pick(picture());

    await expect(send()).rejects.toBe(elsewhere);
    expect(answers).toEqual([]);
  });

  it("sends once when it is pressed twice quickly, and is switched off while the photo is on its way", async () => {
    const sending = held<Parsed<string>>();
    const sent: FormData[] = [];
    const { drawn, pick, answers } = openUpload({
      send(form) {
        sent.push(form);
        return sending.promise;
      },
    });
    await pick(picture());
    const before = drawn();

    // Twice on the buttons as they were drawn before the first press.
    press(before, "Kirim presensi");
    press(before, "Kirim presensi");
    const during = drawn();
    press(during, "Ulangi");
    press(during, "Batal");

    expect(sent).toHaveLength(1);
    expect(offered(during)).toEqual(["Mengirim…", "Ulangi", "Batal"]);
    expect(isPressable(during, "Mengirim…")).toBe(false);
    expect(previewOf(drawn())).toBe(PREVIEW);

    sending.end(KEPT);
    await settled();

    expect(sent).toHaveLength(1);
    expect(answers).toEqual([{ error: null, done: KEPT.value }]);
  });
});

describe("trying again after a failed send", () => {
  /** An upload whose first send failed, and whose next send waits. */
  async function failedOnce() {
    const sending = held<Parsed<string>>();
    let sendCount = 0;
    const upload = openUpload({
      send() {
        sendCount += 1;
        if (sendCount === 1) return Promise.reject(new Error("Lost."));
        return sending.promise;
      },
    });
    await upload.pick(picture());
    await upload.send();
    upload.told.length = 0;
    return { ...upload, sending };
  }

  it('tells the cards to drop the old answer as soon as "Kirim presensi" is pressed again, before any new answer', async () => {
    const { drawn, told, sending } = await failedOnce();

    press(drawn(), "Kirim presensi");

    expect(told).toEqual(["restarted"]);
    expect(offered(drawn())).toEqual(["Mengirim…", "Ulangi", "Batal"]);
    sending.end(KEPT);
    await settled();
    expect(told).toEqual(["restarted", "answered"]);
  });

  it("tells the cards to drop the old answer before the send starts, since what is told inside a send waits until it ends", async () => {
    const { drawn, toldBeforeSend, sending } = await failedOnce();

    press(drawn(), "Kirim presensi");

    expect(toldBeforeSend).toHaveLength(2);
    expect(toldBeforeSend[1]).toEqual(["restarted"]);
    sending.end(KEPT);
    await settled();
  });

  it("says the send failed again when the new send fails too", async () => {
    const { drawn, answers, told, sending } = await failedOnce();

    press(drawn(), "Kirim presensi");
    sending.fail(new Error("Lost again."));
    await settled();

    expect(told).toEqual(["restarted", "answered"]);
    expect(answers).toEqual([
      { error: SEND_FAILED, done: null },
      { error: SEND_FAILED, done: null },
    ]);
  });

  it("tells the cards to drop the old answer when another photo is picked", async () => {
    const { drawn, pick, told } = await failedOnce();
    press(drawn(), "Ulangi");

    await pick(picture());

    expect(told).toEqual(["restarted"]);
  });

  it("tells the cards to drop the old answer when a wrong file is picked, and still says what is wrong with the file", async () => {
    const { drawn, pick, told } = await failedOnce();
    press(drawn(), "Ulangi");

    await pick(new File(["%PDF"], "surat.pdf", { type: "application/pdf" }));

    expect(told).toEqual(["restarted"]);
    expect(alertOf(drawn())).toBe("Berkas harus berupa gambar.");
  });

  it('does not tell the cards to drop the old answer on "Ulangi"', async () => {
    const { drawn, told } = await failedOnce();

    press(drawn(), "Ulangi");

    expect(told).toEqual([]);
  });

  it("tells nothing for a press left alone while the photo is on its way", async () => {
    const { drawn, told, sending } = await failedOnce();
    // Twice on the button as it was drawn before the first press.
    const before = drawn();

    press(before, "Kirim presensi");
    press(before, "Kirim presensi");

    expect(told).toEqual(["restarted"]);
    sending.end(KEPT);
    await settled();
  });

  it("tells nothing for a pick left alone while a picture is made smaller", async () => {
    const shrinking = held<Blob | null>();
    const { drawn, told } = openUpload({ shrink: () => shrinking.promise });
    // Twice on the ways to pick as they were drawn before the first pick.
    const before = drawn();

    pickFile(before, "Pilih gambar", picture());
    pickFile(before, "Ambil foto", picture());

    expect(told).toEqual(["restarted"]);
    shrinking.end(new Blob(["foto kecil"]));
    await settled();
  });
});
