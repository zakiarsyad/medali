/** The refused outcome of a counselling save that threw, with its words. */
export function refusedOutcome(message: string): {
  kind: "refused";
  error: string;
} {
  return { kind: "refused", error: message };
}
