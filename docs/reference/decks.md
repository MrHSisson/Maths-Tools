# Decks — whole lessons on their own page

**Read when:** Building or changing a deck, a hand-picked question bank, a deck slide type, or the deck player.

A **deck** is one combined, directed lesson for the projector: an ordered list of slide configs, played at `/decks/<id>` (`/decks` lists them). It wraps what the site already has (generators, banks, representations) so a lesson stays in one place. It does not replace the tool pages, and it is the intended successor to the per-tool Teach deck and Lessons modes (which are retired once decks cover their content). Brief: the "Teach Deck Slide Library" brief (kept in the planner); plan: `docs/PROJECTS.md` → Decks.

## Where things live

| What | File |
|---|---|
| Types, slide families and accents | `src/decks/types.ts` |
| The data-only index (`DECKS`, `BANK`, `decksForPath`) — the shell reads this, so it imports no player code | `src/decks/index.ts` |
| One deck per tool | `src/decks/<tool>.ts` |
| Hand-picked questions | `src/decks/<tool>Bank.ts` |
| Generator loaders (the tool's own `__test.generateQuestion`) | `src/decks/generators.ts` |
| The player and the deck list | `src/decks/DeckPage.tsx` (lazy route in `App.tsx`) |
| The misconception vocabulary | `src/shared/misconceptions.ts` |

A deck is reached from its tool's burger menu ("Deck: <title>", Developing-tools mode only, through `decksForPath(window.location.pathname)`) and from the landing page's Developing-tools menu ("Decks"). Add a deck by writing the config and listing it in `src/decks/index.ts`; adding a slide to a lesson needs no UI code.

## Slides

A slide is a config object; its **family** comes from its `type` (`FAMILY_OF`), each family has one accent (`FAMILY_STYLE`; none is green, yellow or red, which are the level colours).

| Family | Types (built) | What it does |
|---|---|---|
| Structure | `title` · `objective` · `divider` · `plenary` | frames the lesson |
| Language | `vocab` · `definition` | shared meaning, in formal non-contracted wording |
| Teach | `board` | a table the teacher writes on; `fill` sets how much shows |
| Practice | `practice` | one targeted question; hand-picked bank first, generator second |

Planned, not built: Depth (referencing a Depth item), Retrieval, Discussion (split slide), representation slides on the eight core pictures. Add a type only when a lesson needs it, and check no existing type in the family does the job.

**Board and fill modes.** A `board` has a grid (`head`, `rows`, `given`). The corner control switches **Filled in** (all cells), **Structure only** (the first `given` columns) and **Blank** (empty boxes). Cells keep a fixed height, so the table does not resize between modes. The mode is kept per slide while the deck is open.

**Practice.** `intention` is a misconception id; `bank` lists hand-picked question ids, each written against that same tag (a test checks it). The slide opens on the first bank question and "Another question" moves through the bank, then to the generator (`generator`: level and the tool's Question Options, every option listed). The answer, the working and the teacher notes (the misconception it catches, where the question came from) are separate reveals. Keys: `a` answer, `w` working, `r` another question, `t` teacher notes.

**Keys and ink.** Arrow keys, Page Up/Down and Space move; Home and End jump; `j` opens the jump list. Ink is the site's one overlay (`InkOverlay`, mounted in `App.tsx`; decks pass through `/decks/<id>`); the deck sends `mt-ink-clear` on a slide change, so annotations belong to a slide and survive a fill-mode change. Freeze/Esc is the ink on-off.

## The question bank and Depth

A `BankQuestion` (`id`, `tool`, `level`, `tag`, `latex`, `answer`, `working`) is written against one tag in `src/shared/misconceptions.ts` (`<tool>-<slug>`). The tag is the shared vocabulary: Depth options name a misconception in free text today, and move onto these ids as Depth and the banks are balanced together. Banks are by tool but any deck may reference any id.

## Tests

`src/tests/decks.test.ts`: unique ids; every bank tag exists; every KaTeX string renders; a bank question's last step ends on its answer; a deck's practice slides name a known intention, a bank written against it, and a generator preset that runs at that level; board grids are rectangular.
