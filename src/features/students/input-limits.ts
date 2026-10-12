/** The lengths a student form holds to, in the browser and on the server. */
export const NIM_LENGTH = 10;
export const NAME_MIN_LENGTH = 3;
export const NAME_MAX_LENGTH = 100;
export const CLASS_MAX_LENGTH = 20;
/** The longest address a mailbox can have. */
export const EMAIL_MAX_LENGTH = 254;

const DIGITS_ONLY = /^\d+$/;

export function isNim(text: string): boolean {
  return text.length === NIM_LENGTH && DIGITS_ONLY.test(text);
}
