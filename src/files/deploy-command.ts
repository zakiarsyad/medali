import {
  currentStage,
  deployBranch,
  readFileStorageSettings,
} from "@/settings";
import { deployFiles } from "./deploy-files";
import { objectStore } from "./object-store";

/** The file storage step of a Vercel build. It fails loudly. */
async function deploy(): Promise<string> {
  const settings = readFileStorageSettings();
  const store = settings ? objectStore(settings) : null;
  return deployFiles(store, currentStage(), deployBranch());
}

deploy()
  .then((done) => console.log(done))
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
