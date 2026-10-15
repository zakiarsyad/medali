import { describe, expect, it, vi } from "vitest";
import { sendUndo, UNDO_NOT_SENT } from "./undo-send";

const ID = "00000000-0000-4000-8000-0000000000a1";

describe("sendUndo", () => {
  it("gives back what the server answered", async () => {
    const answer = { error: null, done: "Pengurangan dibatalkan." };
    const send = vi.fn(async () => answer);

    expect(await sendUndo(ID, { send, rethrow: vi.fn() })).toEqual(answer);
    expect(send).toHaveBeenCalledWith(ID);
  });

  it("says the undoing was not sent when the connection drops, instead of throwing", async () => {
    const lost = new TypeError("Failed to fetch");
    const rethrow = vi.fn();
    const send = vi.fn(async () => {
      throw lost;
    });

    expect(await sendUndo(ID, { send, rethrow })).toEqual({
      error: UNDO_NOT_SENT,
      done: null,
    });
    expect(rethrow).toHaveBeenCalledWith(lost);
  });

  it("lets the framework's own errors through", async () => {
    const redirect = new Error("NEXT_REDIRECT");
    const send = vi.fn(async () => {
      throw redirect;
    });
    const rethrow = (error: unknown) => {
      throw error;
    };

    await expect(sendUndo(ID, { send, rethrow })).rejects.toBe(redirect);
  });
});
