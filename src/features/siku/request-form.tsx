"use client";

import { unstable_rethrow } from "next/navigation";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { shrinkPhoto } from "@/ui/shrink-photo";
import { sendSikuRequestAction } from "./request-actions";
import { REPORT_MAX_LENGTH } from "./request-ids";
import { ONLY_PICTURES, THUMB_MAX_SIDE } from "./request-photo";
import { CHOOSER_KINDS, takenPicks } from "./request-picks";
import {
  type ReadyPhoto,
  type RequestFields,
  type SendEdges,
  sendRequest,
} from "./request-send";
import styles from "./siku.module.css";
import { GAIN_REASONS } from "./siku-ids";
import { REASON_WORDS } from "./siku-words";

const START: FormState = { error: null, done: null };

const EMPTY: RequestFields = { reason: "", day: "", report: "" };

const EDGES: SendEdges = {
  send: sendSikuRequestAction,
  rethrow: unstable_rethrow,
};

/**
 * A picked picture made smaller to send, and its small copy, which the
 * form shows. Null when the browser cannot read it as a picture.
 */
async function readyPhoto(file: File): Promise<ReadyPhoto | null> {
  try {
    const photo = await shrinkPhoto(file);
    const thumb = await shrinkPhoto(file, THUMB_MAX_SIDE);
    if (photo === null || thumb === null) return null;
    return { photo, thumb, preview: URL.createObjectURL(thumb) };
  } catch (error) {
    console.error("A picked picture was not made smaller.", error);
    return null;
  }
}

function letGo(photos: readonly ReadyPhoto[]): void {
  for (const photo of photos) URL.revokeObjectURL(photo.preview);
}

function PickedPhotos({
  photos,
  onDrop,
}: {
  photos: readonly ReadyPhoto[];
  onDrop: (at: number) => void;
}) {
  if (photos.length === 0) return null;
  return (
    <ul className={`${styles.thumbs} ${styles.full}`}>
      {photos.map((photo, at) => (
        <li key={photo.preview} className={styles.thumb}>
          {/* biome-ignore lint/performance/noImgElement: the picture is still in the browser, where the image optimiser of the server cannot reach it. */}
          <img src={photo.preview} alt={`Foto ${at + 1}`} />
          <button
            type="button"
            className={styles.dropPhoto}
            aria-label={`Hapus foto ${at + 1}`}
            onClick={() => onDrop(at)}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * "Ajukan penambahan SIKU": Kriteria penambahan, Tanggal kegiatan,
 * Keterangan and up to three proof photos, each made smaller in the
 * browser and shown small with × to take it out. What is typed stays when
 * something is wrong; after a request is sent the form starts again with
 * a new key. While it is sent nothing can be pressed, so a second press
 * sends nothing more. `newRequestId` is the key of the first request, and
 * `today` the day on campus.
 */
export function RequestForm({
  newRequestId,
  today,
}: {
  newRequestId: string;
  today: string;
}) {
  const [id, setId] = useState(newRequestId);
  const [fields, setFields] = useState(EMPTY);
  const [photos, setPhotos] = useState<ReadyPhoto[]>([]);
  const [answer, setAnswer] = useState(START);
  const [reading, setReading] = useState(false);
  const [sending, startSending] = useTransition();
  // Set at the press itself: `sending` is known only once the form is
  // drawn again, and a second press can come before that.
  const isOnItsWay = useRef(false);
  const held = useRef(photos);
  held.current = photos;

  // The previews are kept by the browser until they are let go of.
  useEffect(() => () => letGo(held.current), []);

  function change(field: keyof RequestFields, value: string) {
    setFields((before) => ({ ...before, [field]: value }));
  }

  async function pick(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    // The same file can then be picked again after it was taken out.
    event.target.value = "";
    if (reading || sending) return;
    const { taken, fault } = takenPicks(photos.length, files);
    setReading(true);
    const ready: ReadyPhoto[] = [];
    let unread = false;
    for (const file of taken) {
      const photo = await readyPhoto(file);
      if (photo === null) unread = true;
      else ready.push(photo);
    }
    setReading(false);
    setPhotos((before) => [...before, ...ready]);
    const error = fault ?? (unread ? ONLY_PICTURES : null);
    setAnswer({ error, done: null });
  }

  function drop(at: number) {
    const dropped = photos[at];
    if (dropped === undefined || sending) return;
    letGo([dropped]);
    setPhotos(photos.filter((_photo, place) => place !== at));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isOnItsWay.current || reading) return;
    isOnItsWay.current = true;
    startSending(async () => {
      try {
        const sent = await sendRequest(id, fields, photos, today, EDGES);
        setAnswer(sent);
        if (sent.done === null) return;
        letGo(photos);
        setPhotos([]);
        setFields(EMPTY);
        setId(crypto.randomUUID());
      } finally {
        isOnItsWay.current = false;
      }
    });
  }

  return (
    <form className={shared.form} onSubmit={submit} noValidate>
      <label className={`${shared.field} ${styles.full}`}>
        Kriteria penambahan
        <select
          className={shared.input}
          value={fields.reason}
          onChange={(event) => change("reason", event.target.value)}
        >
          <option value="">Pilih kriteria</option>
          {GAIN_REASONS.map((reason) => (
            <option key={reason} value={reason}>
              {REASON_WORDS[reason]}
            </option>
          ))}
        </select>
      </label>
      <label className={`${shared.field} ${styles.full}`}>
        Tanggal kegiatan
        <input
          type="date"
          className={shared.input}
          max={today}
          value={fields.day}
          onChange={(event) => change("day", event.target.value)}
        />
      </label>
      <label className={`${shared.field} ${styles.full}`}>
        Keterangan (laporan kegiatan)
        <textarea
          className={shared.input}
          rows={4}
          maxLength={REPORT_MAX_LENGTH}
          placeholder="Jelaskan kegiatan yang Anda lakukan: apa, di mana, untuk siapa, dan peran Anda."
          value={fields.report}
          onChange={(event) => change("report", event.target.value)}
        />
      </label>
      <label className={`${shared.field} ${styles.full}`}>
        Foto bukti kegiatan (gambar, maks. 3 foto, 5 MB per foto)
        <input
          type="file"
          className={shared.input}
          accept={CHOOSER_KINDS}
          multiple
          disabled={reading || sending}
          onChange={pick}
        />
      </label>
      <PickedPhotos photos={photos} onDrop={drop} />
      <div className={`${shared.actions} ${styles.full}`}>
        <button
          type="submit"
          className={shared.button}
          disabled={reading || sending}
        >
          {sending ? "Mengirim…" : "Kirim pengajuan"}
        </button>
      </div>
      <div className={styles.full}>
        <FormMessage state={answer} />
      </div>
    </form>
  );
}
