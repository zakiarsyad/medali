import type { Parsed } from "@/parsed";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { FILE_MISSING, FILE_WRONG_KIND } from "./clarification-file";
import {
  explanationFault,
  isPictureName,
  pickedFileFault,
  shrunkName,
} from "./clarification-input";

/*
 * What the form of a clarification does when it is sent, apart from how
 * it is drawn, so it can be checked without a browser. Read by the form
 * in the browser: nothing here may take from the database code.
 */

/** Said when the form did not reach the server, or no answer came back. */
export const CLARIFICATION_SEND_FAILED =
  "Klarifikasi tidak terkirim. Periksa koneksi internet, lalu tekan Kirim klarifikasi lagi.";

/** What the form holds when "Kirim klarifikasi" is pressed. */
export interface ClarificationDraft {
  scheduleId: string;
  reason: string;
  explanation: string;
  /** Null when no file was picked. */
  file: File | null;
}

/** What sending needs from the browser and from the server. */
export interface SendEdges {
  /** The picture made smaller, or null when the browser cannot read it as one. */
  shrink: (file: Blob) => Promise<Blob | null>;
  send: (form: FormData) => Promise<Parsed<string>>;
  /** Throws again what is no failure, as an answer that leads elsewhere. */
  rethrow: (error: unknown) => void;
}

/** What the fields of the form of one schedule hold. A browser sends an empty file when none was picked. */
export function draftOf(
  scheduleId: string,
  form: FormData,
): ClarificationDraft {
  const file = form.get("file");
  return {
    scheduleId,
    reason: text(form, "reason"),
    explanation: text(form, "explanation"),
    file: file instanceof File && file.size > 0 ? file : null,
  };
}

function formOf(draft: ClarificationDraft, file: Blob, name: string): FormData {
  const form = new FormData();
  form.set("scheduleId", draft.scheduleId);
  form.set("reason", draft.reason);
  form.set("explanation", draft.explanation);
  form.set("file", file, name);
  return form;
}

/** A picture the browser fails on counts as one it cannot read. */
async function shrunk(file: File, edges: SendEdges): Promise<Blob | null> {
  try {
    return await edges.shrink(file);
  } catch (error) {
    console.error("A picked picture was not made smaller.", error);
    return null;
  }
}

/**
 * The form to send for a draft, or what is wrong with the draft. A
 * picture is made smaller first and goes as a JPEG; a PDF goes as it is.
 */
export async function readyToSend(
  draft: ClarificationDraft,
  edges: SendEdges,
): Promise<Parsed<FormData>> {
  const { file } = draft;
  const fault = explanationFault(draft.explanation) ?? pickedFileFault(file);
  if (fault !== null || file === null) {
    return { ok: false, error: fault ?? FILE_MISSING };
  }
  if (!isPictureName(file.name)) {
    return { ok: true, value: formOf(draft, file, file.name) };
  }
  const smaller = await shrunk(file, edges);
  if (smaller === null) return { ok: false, error: FILE_WRONG_KIND };
  return { ok: true, value: formOf(draft, smaller, shrunkName(file.name)) };
}

/**
 * Sends a draft and gives what the form says back: what is wrong with
 * the draft, what the server answered, or that it did not arrive. The
 * form itself is not touched, so what the student wrote and picked stays
 * to be sent again.
 */
export async function sendDraft(
  draft: ClarificationDraft,
  edges: SendEdges,
): Promise<FormState> {
  const ready = await readyToSend(draft, edges);
  if (!ready.ok) return { error: ready.error, done: null };
  try {
    const sent = await edges.send(ready.value);
    if (!sent.ok) return { error: sent.error, done: null };
    return { error: null, done: sent.value };
  } catch (error) {
    edges.rethrow(error);
    return { error: CLARIFICATION_SEND_FAILED, done: null };
  }
}
