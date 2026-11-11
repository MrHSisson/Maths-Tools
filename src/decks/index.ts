// Data-only deck index. Decks are no longer bundled into the app: the shared (cloud) copy is the master and each device keeps what it
// has opened (store.ts). The repo's src/decks/data/<id>.json files are a backup and what the tests and scripts read (src/tests/snapshotDecks.ts).
import type { BankQuestion } from "./types";
import { ESTIMATION_BANK } from "./estimationBank";

export const BANK: BankQuestion[] = [...ESTIMATION_BANK];
