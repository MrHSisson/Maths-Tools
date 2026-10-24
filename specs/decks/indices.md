# Teach Deck Spec: Indices

**Status:** draft (built so far: four decks in `src/tools/Number/IndicesTeach.ts` — Laws of indices, Laws with coefficients, Zero and negative powers, Negative laws — wired into two lessons in `IndicesLessons.ts`; Powers & Roots and Common Base decks still to build) <!-- redesigned: a deck is now the teacher's initial input, one lesson per SoL topic. Needs the build items in §5. -->

Deck for the **Indices** tool (`specs/indices.md`, `src/tools/Number/Indices.tsx` once built), paired with the Depth bank
(`specs/depth/indices.md`). **Parked-gated** like every deck today (`parkedMode`, `?parked=1`); the tool never *needs* it —
its worked examples stand alone.

---

## 0. As built (2026-10-13) — read this first

The deck-per-SoL-topic plan below was reshaped while building. What exists:

| Deck (`TEACH_LESSONS`) | Tab it opens on | Content |
|---|---|---|
| `laws` | Index Laws | repeated doubling hook, what an index tells you, multiply / divide / power of a power as tiles, three laws, write each as a single power, hand-off |
| `coefficients` | Index Laws | a coefficient and a power, multiplying / dividing / power of a bracket with coefficients (tiles reshuffle), do the two jobs, hand-off |
| `negatives` | Zero & negative powers | equal powers, bottom bigger, what a negative index means, pattern check, same with numbers, write as a fraction, hand-off |

Decks have **no Teach tab**: they open from a lesson step (`kind: "teach"`). Two lessons (`IndicesLessons.ts`): **Laws of indices (no negatives)** — laws deck,
practise, set, coefficients deck, practise, set, extend — and **Zero and negative powers** — a Depth bridge, negatives deck, practise, set, two extends.
Structure rules and learnings: `docs/design/LESSONS.md`. Checks are Depth slides and never open a deck.

---

## 1. What a deck is for (the redesigned role)

A Teach deck is **the teacher's initial input**: the part of the lesson that used to be a hand-made PowerPoint. It is not practice and it is
not reasoning practice — the other modes do those jobs, and the deck hands over to them.

| Mode | Job in the lesson |
|---|---|
| **Teach deck** | Hook (only if there is a true one) · explanation · initial model · a guided we-do · diagnostic checks · then a **hand-off** |
| **Whiteboard / Worked Example** | Retrieval, repeated practice, the live "I do" with fresh numbers |
| **Worksheet** | The "You do" — independent, differentiated practice |
| **Depth** | Reasoning and explanation: diagnose, explain, extend |

**Design rules**
- **A hook only if it is genuine.** If there is no obvious, true hook for a lesson, the lesson opens on the explanation. Never force a context or a representation that isn't honest to the maths.
- **One lesson per SoL topic = one tab.** The deck menu lists lessons (not Concepts / True or False / Spot the Mistake). True/False and Spot-the-Mistake material lives in Depth (`specs/depth/indices.md`); nothing is duplicated here.
- **One coherent example per lesson**, built beat by beat (the existing deck rules: hand-authored, misconception-driven, no generators, no emoji, sized for the back of the room).
- **Diagnostics come from Depth, not a copy.** A `check` slide *references* a Depth item by id (question beat, then answer beat), so the bank stays the single source and the teacher can reuse the item in Depth later.
- **Every lesson ends with a hand-off** to Whiteboard, Worksheet and Depth, **pre-populated** with the Question Options and level that match what was just taught (§3).

---

## 2. The deck's lesson structure

A lesson is an ordered list of slides. The typical arc (any step may be absent):

1. **Hook** *(optional — only if genuine)*
2. **Check — before** *(optional)*: one Depth diagnose item, to surface what the class currently thinks.
3. **Explain**: the idea and vocabulary.
4. **Model (I do)**: the picture on one coherent example.
5. **We do**: a guided second example, the class predicts.
6. **Check — after** *(optional)*: a Depth diagnose item that tests whether the model landed.
7. **Hand-off**: where to go next, with presets.

### Lesson menu

| Lesson (= SoL topic = tab) | Hook | New scene needed |
|---|---|---|
| 1. Powers, roots and index notation (`powersRoots`) | None obvious that is *true*. Squared/cubed *as* area and volume is the origin of the words, so it goes in the **explanation**, not a hook | `indexExpand` law `expand` (below) |
| 2. Laws of indices (`indexLaws`) | **Yes — repeated doubling** (cell division); genuinely the same maths | `indexExpand` laws `multiply` / `divide` / `power` |
| 3. Negative and fractional powers (`specialPowers`) | **Yes — metric prefixes** (milli, micro); genuinely 10⁻³ and 10⁻⁶ | none (reuses `divide`) |
| 4. Common base (`commonBase`) | None. Goes straight to the model | none (reuses `factorTree`) |

Hooks are proposals for the author to accept or drop; the SoL's own notes feed them (real life context lines) so they stay the teacher's own.

---

## 3. Hand-offs and embedded checks

### Hand-off = a link in the shareable-URL format

The shell already mirrors setup into the URL (`mode`, `tool`, `level`, `dd`, `vars`, `ms`, `n`, `cols`, `diff`, `item` — see `CLAUDE.md` → "Shareable links").
A hand-off is exactly that setup, so it is pre-populated Question Options for free, can be copied as a link, and is validated against the tool's real config.

```ts
{ t: "handoff", label: string, to: {
    mode: "whiteboard" | "example" | "worksheet" | "depth",
    tool?: string; level?: 1 | 2 | 3;
    ms?: string;      // e.g. "multiply,divide,-powerOfPower,algebraic"
    dd?: string; vars?: string; n?: number; cols?: number; diff?: boolean;
    item?: string;    // Depth item id (mode "depth")
} }
```

The deck gets an `onHandoff(to)` callback from ToolShell, which applies the same parse it uses on page load, in place (no reload).
A hand-off slide shows up to three buttons: **Practise it (Whiteboard)**, **Set it (Worksheet)**, **Reason about it (Depth)**.

**Correctness (tested):** every hand-off's `tool` is a real sub-tool, `level` is offered on it, every `ms` value is a real option of that sub-tool and level, and every `item` id exists in the Depth bank for that tool. Same discipline as the skills test for `[[skill-id|term]]`.

### Embedded check = a Depth item by id

```ts
{ kind: "check", item: "indices-il-a2-a3" }   // plays the question beat, then the answer beat, in the deck
```

Plays the item's two beats inline (speakers, options, working, Feathers). The answer beat offers **Open in Depth** (a hand-off with `mode: depth`, `item`).
If embedding the full Depth slide proves expensive, the **fallback** is a plain hand-off link to the item — the design still works, it just leaves the deck.

---

## 4. Lessons — content

### Shared scene: `indexExpand` (new)

**Representation** (closest core family: prime-factor tiles). One **factor tile** = one copy of the base: numeric primes use the existing `tileColor`, composite and
letter bases use a navy tile with the base. Same base, same tile — always. Groups are marked by a labelled bracket underneath. Power-of-a-power is an **n × m array**, the area-model picture students meet later. Standing scene contract: beat count derived from the scene, space reserved up front (opacity, not mounting), animate only opacity/transform. ≤ 8 tiles in a row, ≤ 12 in total.

```ts
| { type: "indexExpand"; law: "multiply" | "divide" | "power" | "expand";
    base: string | number; m: number; n?: number;
    predict?: boolean }   // inserts a beat before the count where the result stays "?" while the class decides, like `split`
```

| law | what each press does (beats; `predict` adds one) |
|---|---|
| `multiply` `x^m × x^n` | 0 expression · 1 `x^m` as m tiles · 2 `x^n` as n tiles · 3 one bracket over all, counted · 4 `= x^{m+n}` (5) |
| `divide` `x^m ÷ x^n` | 0 fraction · 1 top as tiles · 2 bottom as tiles · 3 matching pairs cancel · 4 what is left (m−n top; nothing — a single 1 — if m=n; n−m on the bottom) · 5 result `x^{m−n}`, `1 = x^0`, or `1/x^{n−m} = x^{−(n−m)}` (6) |
| `power` `(x^m)^n` | 0 expression · 1 n copies of the bracket · 2 each opens to m tiles (n × m array) · 3 counted · 4 `= x^{m×n}` (5) |
| `expand` `a^m` | 0 `a^m` · 1 written as m tiles · 2 the tiles multiplied two at a time (a running product `a × a`, `a×a×a`…) · 3 the value (4) — covers numeric powers like 4³ = 64 |

The mock of this scene (and the deck chrome) is the preview artifact shared in the conversation.

### Lesson 2: Laws of indices — the fully worked lesson

One coherent example throughout: **base x, indices 3 and 5.**

1. **Hook** (static, *optional but genuine*): "A cell splits in two every minute. After 3 minutes there are 2³ cells. Keep going for 5 more minutes. How many doublings is that altogether?" Reveal: 8 doublings, so 2³ × 2⁵ = 2⁸ cells. (Tie-in: "Binary and memory sizes (powers of 2), repeated doubling such as cell division" from the SoL note.)
2. **Check — before:** `indices-il-a2-a3` (Jamal a⁶ vs Priya a⁵) — surfaces "multiply the indices".
3. **Explain** (static): "An index tells you how many copies of the base are multiplied. $x^3$ = three $x$'s. Base $x$, index (power) 3." Note: laws work only when the **base is the same**.
4. **Model — I do** (`indexExpand` `multiply`, x, 3, 5): captions:
   1. "Here is $x^3 \times x^5$. Two powers of the same base."
   2. "$x^3$ means three $x$'s multiplied: $x \times x \times x$."
   3. "$x^5$ means five $x$'s multiplied."
   4. "Join them. How many $x$'s are being multiplied altogether? Count: 8."
   5. "So $x^3 \times x^5 = x^8$. The indices were **added**: $3 + 5 = 8$."
5. **We do — divide** (`indexExpand` `divide`, x, 8, 3): "Now undo it: $x^8 \div x^3$…" ⋯ "five $x$'s are left… The indices were **subtracted**: $8 - 3 = 5$." (6 captions as the existing draft.)
6. **We do — power of a power** (`indexExpand` `power`, x, 3, 2, `predict`): "$(x^3)^2$ means two lots of $x^3$." → write them → open the brackets → "**Predict:** how many $x$'s altogether?" → "Count: 6." → "So $(x^3)^2 = x^6$: multiplied, $3 \times 2 = 6$."
7. **Check — after:** `indices-il-bases-multiplied` ($2^3 \times 2^4$ — tests that the tile stays the same) and, if time, `indices-il-two-then-three` ($2^3 \times 3^2$ — two different tiles).
8. **Hand-off:**
   - **Practise it** → `{ mode: "whiteboard", tool: "indexLaws", level: 1, ms: "multiply,divide,-powerOfPower,algebraic,-numeric" }` (letters, × and ÷ first).
   - **Set it** → `{ mode: "worksheet", tool: "indexLaws", level: 1, ms: "multiply,divide,powerOfPower,algebraic,numeric", n: 15 }`.
   - **Reason about it** → `{ mode: "depth", tool: "indexLaws", level: 1, item: "indices-il-a2-a3" }`.

### Lesson 3: Negative and fractional powers

1. **Hook** (static, *genuine*): "A millimetre is $\dfrac{1}{1000}$ of a metre. A micrometre is $\dfrac{1}{1000\,000}$." Reveal: so $10^{-3}$ and $10^{-6}$. (SoL: metric prefixes such as milli and micro.)
2. **Check — before:** `indices-sp-five-zero` (what is $5^0$?).
3. **Model — I do, zero** (`indexExpand` `divide`, x, 3, 3): everything cancels → 1; the law says $x^{3-3} = x^0$; so $x^0 = 1$.
4. **Model — I do, negative** (`indexExpand` `divide`, x, 3, 5): two $x$'s left on the bottom → $\dfrac{1}{x^2} = x^{-2}$: "one over", not a negative number.
5. **We do — fractional** (static, no new scene): "Half a power: $x^{\frac12} \times x^{\frac12} = x^1$, so $x^{\frac12}$ is the number that squares to $x$: the square root." → "$27^{\frac23}$: **root first** ($\sqrt[3]{27} = 3$), then the power ($3^2 = 9$)."
6. **Check — after:** `indices-sp-two-thirds-neg-two` ($(2/3)^{-2}$) at Level 2.
7. **Hand-off:** Whiteboard `specialPowers` L1 `ms: zero,negative,unitFraction`; Worksheet L1 same plus `diff: true`; Depth `indices-sp-zero-division`.

### Lesson 1: Powers, roots and index notation

No forced hook. Opens on the explanation.

1. **Explain** (static): vocabulary "base" and "power"; $4^3$ does not mean $4 \times 3$. Squared and cubed as area and volume: a square of side 4 has area $4^2$, a cube of side 4 has volume $4^3$.
2. **Check — before:** `indices-pr-four-cubed`.
3. **Model — I do** (`indexExpand` `expand`, 4, 3): $4^3$ as three tiles, multiplied two at a time → 16 → 64.
4. **We do** (static): roots as the undoing: $\sqrt{81}$, "which number times itself?"; one cube root.
5. **Check — after:** `indices-pr-sq-vs-double`.
6. **Hand-off:** Whiteboard `powersRoots` L1 `ms: notation,power,root`; Worksheet L1; Depth `indices-pr-four-cubed`.

*Future (not this build):* an area/cube-array scene (`squareArray`) for squares and cubes; pattern table.

### Lesson 4: Common base

No hook. Opens on the model.

1. **Check — before:** `indices-cb-two-to-x-32` (Ben x = 16 vs Amara x = 5).
2. **Model — I do** (existing `factorTree`, n = 8, then 32): "8 is three 2-tiles: $8 = 2^3$" — **reuses the prime factor tiles scene**, no new build.
3. **We do** (static, one coherent example): "Plan first: write every number with the same base." Walk $2^5 \times 4^3 \div 8^2$ → $2^{5+6-6} = 2^5 = 32$. A powers-of-2/3/5/10 table visible (SoL: "keep a table of powers visible").
4. **We do — solve** (static): $4^x = 8$ → both to base 2 → $2^{2x} = 2^3$ → $x = \dfrac32$.
5. **Check — after:** `indices-cb-four-to-x-eight`.
6. **Hand-off:** Whiteboard `commonBase` L1 `ms: writeAsPower,solveIndex`; Worksheet L2 `diff: true`; Depth `indices-cb-eight-is-two-four`.

*Future:* a `rewriteBase` scene (two 2-tiles collapsing into a 4 tile).

---

## 5. Build work this adds (all behind the parked gate)

1. **`indexExpand` scene** (+ `expand` law): `TeachScene` union, `sceneMaxStep`, `SceneView` component; beat-count tests like the other scenes.
2. **Lesson model:** a deck prop for lessons (`teachingLessons: TeachLesson[]`, each `{ id, title, tool, slides }`), with the menu listing lessons. The existing category deck (Fractions +/−) keeps working unchanged until it is moved over.
3. **`check` slide kind** that plays a Depth item by id (needs the Depth slide view exported for reuse; **fallback** = link only).
4. **`handoff` block** and `onHandoff` in ToolShell, applying the same parse used for URL setup, in place.
5. **Tests:** handoffs resolve to real sub-tool / level / option values / Depth item; `check` ids exist; scene beats; every `$...$` renders.

## 6. Out of scope

- Rewriting the Fractions +/− deck into the lesson model (it still works as categories).
- Skills-library drill-downs from deck slides.
- The Depth "Write it out" scaffold (it reuses the tile component; separate follow-up, see `specs/depth/indices.md`).
- Coming out from behind the parked gate: needs the bar decided in `docs/BACKBENCH.md`.
