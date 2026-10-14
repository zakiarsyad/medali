import type { Parsed } from "@/parsed";
import type { FormState } from "@/ui/form-message";
import { parseRequest } from "./request-input";
import { REQUEST_PHOTO_FILE_NAME } from "./request-photo";

/*
 * What the form of a request does when it is sent, apart from how it is
 * drawn, so it can be checked without a browser. Read by the form in the
 * browser: nothing here may take from the database code.
 */

/** Said when the form did not reach the server, or no answer came back. */
export const REQUEST_SEND_FAILED =
  "Pengajuan tidak terkirim. Periksa koneksi internet, lalu tekan Kirim pengajuan lagi.";

/** What the fields of the form hold. */
export interface RequestFields {
  reason: string;
  day: string;
  report: string;
}

/** A picked photo made smaller, its small copy, and where its preview is shown from. */
export interface ReadyPhoto {
  photo: Blob;
  thumb: Blob;
  preview: string;
}

/** What sending needs from the server and the browser. */
export interface SendEdges {
  send: (form: FormData) => Promise<Parsed<string>>;
  /** Throws again what is no failure, as an answer that leads elsewhere. */
  rethrow: (error: unknown) => void;
}

/** The form that goes to the server, each photo with its small copy. */
export function requestFormData(
  id: string,
  fields: RequestFields,
  photos: readonly ReadyPhoto[],
): FormData {
  const form = new FormData();
  form.set("id", id);
  form.set("reason", fields.reason);
  form.set("day", fields.day);
  form.set("report", fields.report);
  for (const { photo, thumb } of photos) {
    form.append("photo", photo, REQUEST_PHOTO_FILE_NAME);
    form.append("thumb", thumb, REQUEST_PHOTO_FILE_NAME);
  }
  return form;
}

/**
 * Sends a request and gives what the form says back: what is missing or
 * wrong, checked here first so nothing is sent then, what the server
 * answered, or that it did not arrive. `today` is the day on campus.
 */
export async function sendRequest(
  id: string,
  fields: RequestFields,
  photos: readonly ReadyPhoto[],
  today: string,
  edges: SendEdges,
): Promise<FormState> {
  const draft = { ...fields, photoCount: photos.length };
  const checked = parseRequest(draft, today);
  if (!checked.ok) return { error: checked.error, done: null };
  try {
    const sent = await edges.send(requestFormData(id, fields, photos));
    if (!sent.ok) return { error: sent.error, done: null };
    return { error: null, done: sent.value };
  } catch (error) {
    edges.rethrow(error);
    return { error: REQUEST_SEND_FAILED, done: null };
  }
}
