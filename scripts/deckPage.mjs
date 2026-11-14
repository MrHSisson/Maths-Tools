// Shared by the deck browser scripts (layout check, print check, review, sheet).
// The app does not bundle decks any more (since 2026-11-11): a page can only draw a deck the shared service sends it. A script that checks a deck
// that exists only as a file (new, not pushed yet, or the live copy fetched to a temp file) has to play the service: serve that file.
import fs from "node:fs";

/** The deck file to draw: DECK_FILE (the live copy fetched by `deck check --live`, or a look-card build), else the repo's copy. */
export const deckFileFor = (id) => process.env.DECK_FILE ?? `src/decks/data/${id}.json`;
export const loadDeck = (id) => JSON.parse(fs.readFileSync(deckFileFor(id), "utf8"));

/** Answer the app's deck requests (on a page or a whole context) with this deck, newer than anything on the device so it is taken as the shared copy. */
export async function serveDeck(target, id, deck) {
  await target.route("**/api/decks*", (r) => {
    const stamp = "2099-01-01T00:00:00.000Z";
    const body = new URL(r.request().url()).searchParams.get("id")
      ? { ...deck, updatedAt: stamp }
      : { index: { decks: { [id]: { updatedAt: stamp } } }, questions: { questions: {} } };
    return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
}
