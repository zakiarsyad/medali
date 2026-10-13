import { connect } from "@/db/connect";
import { noteFilesEmptied, startWaitsForFiles } from "@/db/deploy-start";
import { samplePhotosAdded } from "@/db/seed-attendance-photos";
import {
  currentStage,
  deployBranch,
  readFileStorageSettings,
  readSetting,
} from "@/settings";
import { deployFiles } from "./deploy-files";
import { fileStorage } from "./file-storage";
import { objectStore } from "./object-store";

/** The file storage step of a Vercel build. It fails loudly. */
async function deploy(): Promise<string> {
  const settings = readFileStorageSettings();
  const store = settings ? objectStore(settings) : null;
  const connection = connect(readSetting("DATABASE_URL"));
  try {
    const emptied = await deployFiles(store, currentStage(), deployBranch(), {
      waitsForFiles: () => startWaitsForFiles(connection.db),
      noteFilesEmptied: () => noteFilesEmptied(connection.db),
    });
    // Only after the step above, which refuses anywhere but a preview: the
    // sample attendance of a database that was started over has no photo
    // yet, and one that kept its data has none left without.
    const photos = await samplePhotosAdded(connection.db, fileStorage());
    return `${emptied}\n${photos}`;
  } finally {
    await connection.close();
  }
}

deploy()
  .then((done) => console.log(done))
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
