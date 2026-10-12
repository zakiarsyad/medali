import { currentStage, readFileStorageSettings } from "@/settings";
import { ensureBucket } from "./object-store";

/** Makes the place for files in the local file storage, and fails loudly. */
async function prepare(): Promise<string> {
  const stage = currentStage();
  if (stage !== "local") {
    throw new Error(
      `The place for files is made only on a local computer, not in ${stage}.`,
    );
  }
  const settings = readFileStorageSettings();
  if (!settings) throw new Error("The file storage settings are empty.");
  const made = await ensureBucket(settings);
  if (made === "already-there") return "The place for files is already there.";
  return "The place for files was made.";
}

prepare()
  .then((done) => console.log(done))
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
