/*
 * How large a sent form may be, and whether a failed send was refused for
 * its size. Read by the forms in the browser, so nothing here may take
 * from the database code.
 */

/**
 * The largest sent form the app takes. The preview hosting refuses a
 * send of about 4.5 MB, its headers counted, before the app sees it; this
 * leaves room for the headers, so the campus server and the preview
 * refuse the same sends.
 */
export const SENT_FORM_MAX_BYTES = 4_400_000;

/** How the app's own refusal of a form over its limit begins. */
const APP_REFUSAL_START = "Body exceeded ";

const encoder = new TextEncoder();

function textBytes(text: string): number {
  return encoder.encode(text).length;
}

/**
 * About how many bytes a form takes when sent: its field names, texts and
 * files, without the few bytes that separate them.
 */
export function formBytes(form: FormData): number {
  let bytes = 0;
  for (const [name, value] of form) {
    bytes += textBytes(name);
    bytes += typeof value === "string" ? textBytes(value) : value.size;
  }
  return bytes;
}

/**
 * Whether a send failed because the form was too large. The browser is
 * not told the answer's status: the hosting's refusal arrives as an
 * unexpected answer, like any other, and the app's own refusal names
 * itself only while the app is developed. So a failed form over the limit
 * counts as refused for its size, whatever the browser was told.
 */
export function isRefusedForSize(error: unknown, form: FormData): boolean {
  if (formBytes(form) > SENT_FORM_MAX_BYTES) return true;
  if (!(error instanceof Error)) return false;
  return error.message.startsWith(APP_REFUSAL_START);
}
