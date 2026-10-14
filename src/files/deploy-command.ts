import { connect } from "@/db/connect";
import { noteFilesEmptied, startWaitsForFiles } from "@/db/deploy-start";
import { samplePhotosAdded } from "@/db/seed-attendance-photos";
import { samplePapersAdded } from "@/db/seed-clarification-papers";
import { sampleReturnPhotosAdded } from "@/db/seed-return-photos";
import { sampleRequestPhotosAdded } from "@/db/seed-siku-request-photos";
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
    // yet, and one that kept its data has none left without. The same
    // goes for the papers of the sample clarifications and the photos of
    // the sample reports of a return from leave and of the sample
    // requests for a SIKU gain.
    const photos = await samplePhotosAdded(connection.db, fileStorage());
    const papers = await samplePapersAdded(connection.db, fileStorage());
    const returns = await sampleReturnPhotosAdded(connection.db, fileStorage());
    const requests = await sampleRequestPhotosAdded(
      connection.db,
      fileStorage(),
    );
    return `${emptied}\n${photos}\n${papers}\n${returns}\n${requests}`;
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
