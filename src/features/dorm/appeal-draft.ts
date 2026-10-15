import type { SendEdges } from "@/clarifications/clarification-draft";
import { FILE_WRONG_KIND } from "@/clarifications/clarification-file";
import {
  isPictureName,
  pickedFileFault,
  shrunkName,
} from "@/clarifications/clarification-input";
import type { Parsed } from "@/parsed";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { reasonFault } from "./appeal-rules";

/*
 * What the form of an appeal does when it is sent, apart from how it is
 * drawn, so it can be checked without a browser. Read by the form in the
 * browser: nothing here may take from the database code.
 */

/** Said when the form did not reach the server, or no answer came back. */
export const APPEAL_SEND_FAILED =
  "Advokasi tidak terkirim. Periksa koneksi internet, lalu tekan Kirim advokasi lagi.";

/** What the form holds when "Kirim advokasi" is pressed. */
export interface AppealDraft {
  violationId: string;
  reason: string;
  /** Null when no proof was picked. */
  file: File | null;
}

/** What the fields hold. A browser sends an empty file when none was picked. */
export function appealDraftOf(
  violationId: string,
  form: FormData,
): AppealDraft {
  const file = form.get("file");
  return {
    violationId,
    reason: text(form, "reason"),
    file: file instanceof File && file.size > 0 ? file : null,
  };
}

function formOf(draft: AppealDraft, file: Blob | null, name: string): FormData {
  const form = new FormData();
  form.set("violationId", draft.violationId);
  form.set("reason", draft.reason);
  if (file !== null) form.set("file", file, name);
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
 * The form to send for a draft, or what is wrong with it. The proof may
 * be left out. A picture is made smaller first and goes as a JPEG; a PDF
 * goes as it is.
 */
export async function readyAppeal(
  draft: AppealDraft,
  edges: SendEdges,
): Promise<Parsed<FormData>> {
  const wrongReason = reasonFault(draft.reason);
  if (wrongReason !== null) return { ok: false, error: wrongReason };
  const { file } = draft;
  if (file === null) return { ok: true, value: formOf(draft, null, "") };
  const wrongFile = pickedFileFault(file);
  if (wrongFile !== null) return { ok: false, error: wrongFile };
  if (!isPictureName(file.name)) {
    return { ok: true, value: formOf(draft, file, file.name) };
  }
  const smaller = await shrunk(file, edges);
  if (smaller === null) return { ok: false, error: FILE_WRONG_KIND };
  return { ok: true, value: formOf(draft, smaller, shrunkName(file.name)) };
}

/**
 * Sends a draft and gives what the form says back: what is wrong with
 * it, what the server answered, or that it did not arrive. The fields
 * are not touched, so what the resident wrote and picked stays.
 */
export async function sendAppealDraft(
  draft: AppealDraft,
  edges: SendEdges,
): Promise<FormState> {
  const ready = await readyAppeal(draft, edges);
  if (!ready.ok) return { error: ready.error, done: null };
  try {
    const sent = await edges.send(ready.value);
    if (!sent.ok) return { error: sent.error, done: null };
    return { error: null, done: sent.value };
  } catch (error) {
    edges.rethrow(error);
    return { error: APPEAL_SEND_FAILED, done: null };
  }
}
