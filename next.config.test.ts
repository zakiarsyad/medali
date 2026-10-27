import { describe, expect, it } from "vitest";
import { CLARIFICATION_FILE_MAX_BYTES } from "@/clarifications/clarification-file";
import {
  EXPLANATION_MAX,
  FILE_NAME_MAX,
} from "@/clarifications/clarification-input";
import { PHOTOS_MAX, REPORT_MAX_LENGTH } from "@/features/siku/request-ids";
import {
  SENT_PHOTO_MAX_BYTES,
  SENT_THUMB_MAX_BYTES,
} from "@/features/siku/request-photo";
import nextConfig from "./next.config";

/** What the preview hosting takes in one send at most. */
const HOSTING_MAX_BYTES = 4_500_000;

function sentFormLimit(): number {
  const limit = nextConfig.experimental?.serverActions?.bodySizeLimit;
  if (typeof limit !== "number") throw new Error("The limit is no number.");
  return limit;
}

async function sizeOf(form: FormData): Promise<number> {
  const body = await new Response(form).arrayBuffer();
  return body.byteLength;
}

/** The longest text the form takes, each letter as wide as it can be sent. */
function longestText(letters: number): string {
  return "😀".repeat(letters);
}

describe("the largest sent form the app takes", () => {
  it("is no larger than what the preview hosting takes", () => {
    expect(sentFormLimit()).toBeLessThanOrEqual(HOSTING_MAX_BYTES);
  });

  it("fits a clarification with the largest file and the longest explanation", async () => {
    const form = new FormData();
    form.set("scheduleId", "a".repeat(36));
    form.set("reason", "campus_duty");
    form.set("explanation", longestText(EXPLANATION_MAX));
    form.set(
      "file",
      new Blob([new Uint8Array(CLARIFICATION_FILE_MAX_BYTES)]),
      "a".repeat(FILE_NAME_MAX),
    );

    expect(await sizeOf(form)).toBeLessThan(sentFormLimit());
  });

  it("fits a SIKU request with three of the largest photos and their small copies", async () => {
    const form = new FormData();
    form.set("report", longestText(REPORT_MAX_LENGTH));
    for (let photo = 0; photo < PHOTOS_MAX; photo += 1) {
      form.append("photo", new Blob([new Uint8Array(SENT_PHOTO_MAX_BYTES)]));
      form.append("thumb", new Blob([new Uint8Array(SENT_THUMB_MAX_BYTES)]));
    }

    expect(await sizeOf(form)).toBeLessThan(sentFormLimit());
  });
});
