/** One field of a sent form as text. A missing field or a file is empty. */
export function text(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

/** Every value of a field that may be sent more than once, such as ticks. */
export function texts(form: FormData, name: string): string[] {
  return form.getAll(name).filter((value) => typeof value === "string");
}
