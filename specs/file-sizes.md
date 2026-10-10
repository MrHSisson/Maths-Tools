# Tool Spec: File Sizes

**Status:** implemented (dev-gated, `enabled: false`). Tool: `src/tools/Binary/FileSizes.tsx` · shared `src/shared/fileSizeRecipe.ts`, `components/FileSizeRecipe.tsx`, `dataUnits.ts`, `components/UnitLadder.tsx` · tests `src/tests/fileSizes.test.ts`.

Save as `specs/file-sizes.md`. Closest existing tool: **Data Units** (`specs/data-units.md`,
`src/tools/Binary/DataUnits.tsx`): same category, same ToolShell procedural-CS pattern, and this tool
reuses its ladder.

---

## 1. Overview

| Field | Value |
|---|---|
| Tool name | File Sizes |
| Tool id / URL path | `/file-sizes` |
| Category | Binary & Number Bases (Computer Science), dev-gated (`enabled: false`) like Data Units until tested in class |
| Card description | Calculate the storage needed for text, images and sound: one calculation, many files. |
| Defaults | `numQuestions: 12` (worded questions are long), `numColumns: 2`, otherwise standard. Worksheet cells are text only, so no `fixedColumns`. |

**Pedagogical intent.** After a lesson built on this tool a student can calculate the size of a text, image or
sound file from its parameters, convert the answer along the storage ladder, and reason backwards to a missing
parameter. It follows Data Units (the ladder) and Binary Operations / Number Bases (2ⁿ, states of n bits), and
comes before compression (J277 1.2.5).

**The one idea.** *File size (bits) = number of things × bits per thing.* Text: characters × bits per character.
Image: pixels × bits per pixel. Sound: samples × bits per sample, where samples = sample rate × duration. Every
sub-tool shows the same working: a **recipe** (three or four boxes joined by × and =) and then the **ladder** for
the units. The recipe is the main representation.

**Spec tags.** OCR J277 1.2.4 (text, images, sound, file size calculations) and 1.2.5 (units only, via the shared
ladder). No compression content.

---

## 2. Sub-tools

| Key | Tab label | Kind | Instruction line |
|---|---|---|---|
| `text` | Text | worded | — |
| `images` | Images | worded | — |
| `sound` | Sound | worded | — |

Colour depth (bits ↔ number of colours) lives inside Images as question types, so the "fewest bits for N colours"
trap is practised on its own at Levels 1–2 and then combined with image sizes at Level 3.

All three sub-tools are `worded`: the question is a self-contained sentence or two. Messages to count are shown in
monospace in quotation marks.

---

## 3. Sub-tool detail

### Common to the three size sub-tools (Text, Images, Sound)

- **Units.** House style is **KB** (capital K, as Data Units), **×1000** between named multiples (OCR). ×1024 is
  never mentioned in questions; the ladder's bracketed ×1024 labels (from Data Units) stay.
- **Answer house style.** Every answer is shown with its unit (`240 KB`, `6,400 bits`). Whole numbers use thousands
  separators. A KB or MB answer is a whole number or **one decimal place at most**: the generator rejects anything
  that would need more.
- **No calculator.** Paper 1 is non-calculator, so parameters come from designed sets (below) chosen so the
  arithmetic is hand-friendly. At 8 bits per pixel / per sample / per character the ÷ 8 cancels, and the generator
  should offer these often.
- **Bits per character / pixel / sample are always stated in the question** (students use the number given).
- **Exact arithmetic.** Use the same exact-value approach as Data Units (BigInt tenths); never floating point.
- **Working scaffold (`workingScaffold`, Whiteboard).** The empty recipe boxes (labels visible, values blank, e.g.
  `characters × bits per character = bits`) plus the Data Units ladder, centred in the working box. **Show Answer**
  fills the boxes and lights the ladder path from bits to the asked unit. A QO switch (variable) "Scaffold: recipe
  only" hides the ladder for Level 1, where the answer is in bits. Default on; the shared hide/show toggle applies.
- **Worked Example.** `stepVisualRenderer` with caption-only steps: one picture updates in place as steps advance.
  The recipe boxes fill left to right, then the ladder lights each hop. Steps are authored with `mStep`; a new
  shared snapshot type `fsStep(caption, recipe, ladder?)` (like `pvStep`) carries the picture.
- **Shared components (new).** `src/shared/fileSizeRecipe.ts` + `src/shared/components/FileSizeRecipe.tsx` (the
  recipe boxes, 3 or 4 slots, optional "?" slot for reverse questions), and an extraction of `UnitLadder` and the
  tenths-conversion helpers from `DataUnits.tsx` into `src/shared/dataUnits.ts` (Data Units imports them back, with
  no change in behaviour).
- **Worksheet.** Text only. Answers pages show the answer with unit only (never the working).
- **Smart Progressor weights.** Give the *task* options a `weight` (find size 0, compare / reverse higher) so
  worksheet questions ramp in difficulty.

### Sub-tool: Text (`text`)

#### 3.1 Question options (QO)

- **multiSelect** `task` — "Question Types":
  - `findSize` — "Find the file size" — defaultActive: true — weight 0
  - `compareSets` — "Compare ASCII and Unicode" — defaultActive: false — weight 1
  - `findChars` — "Find the number of characters" — defaultActive: false — weight 2
  - `findBits` — "Find the bits per character" — defaultActive: false — weight 2
- **multiSelect** `characters` — "Characters":
  - `given` — "Number of characters given" — defaultActive: true
  - `message` — "A message to count (spaces and punctuation count)" — defaultActive: false
- **multiSelect** `answerUnit` — "Answer in":
  - `bits`, `bytes`, `KB`, `MB` — defaultActive per level (below)
- **variables:** `scaffoldLadder` — "Scaffold: show the unit ladder" — default true
- **Per-level differences:**
  - Level 1: `task` = findSize; `characters` = given; `answerUnit` = bits
  - Level 2: `task` = findSize + compareSets; `characters` = given + message; `answerUnit` = bytes, KB
  - Level 3: `task` = all four; `characters` = given + message; `answerUnit` = KB, MB; `compareSets` and the
    reverse tasks come in

#### 3.2 Levels

**Level 1 (one multiplication, answer in bits):**
- Parameters: characters ∈ {10, 12, 15, 20, 24, 25, 30, 40, 50, 60, 100}; bits per character ∈ {7, 8, 16}; context
  (text message, email, note, caption, password).
- Constraints: answer < 2,000 bits; no unit conversion.
- Exclusions: characters equal to bits per character.
- Misconceptions targeted: adding instead of multiplying (chosen so characters + bits ≠ characters × bits, which is
  always true here); mixing up which number is characters and which is bits.

**Level 2 (the standard exam shape: calculate, then convert):**
- Parameters: characters ∈ {500, 1000, 2000, 2500, 4000, 5000, 8000, 10000} (or a 5–25 character message when
  `message` is active); bits ∈ {8, 16} (7 only when characters is a multiple of 8,000 or the message length × 7 is
  a multiple of 8). Compare: two sets stated in one question (e.g. ASCII 8 bits vs Unicode 16 bits), ask for both
  sizes or the difference.
- Constraints: answer in the chosen unit is whole or one decimal place; bytes answers are whole numbers.
- Exclusions: messages shorter than 5 or longer than 25 characters; a message that is only letters (it must
  contain at least one space or punctuation mark, so counting can go wrong).
- Misconceptions targeted: missing spaces and punctuation when counting a message; forgetting ÷ 8; dividing by
  1,000 only (bits → KB); treating bytes and bits as the same.

**Level 3 (stretch: reverse, compare, MB):**
- Parameters: findChars (size and bits given, find characters), findBits (size and characters given, find bits per
  character; answer ∈ {7, 8, 16}), compareSets with a KB/MB difference. Characters ∈ {3000, 5000, 6000, 8000,
  10000, 20000, 50000}.
- Constraints: reverse answers are whole numbers; the given size is exact in its stated unit.
- Exclusions: reverse questions where the answer would be 1 character or a non-integer.
- Misconceptions targeted: using the formula the wrong way round (dividing the wrong pair); forgetting to convert
  KB back to bits before dividing.

#### 3.3 Worked example script

**Level 2 example — question: `A document has 4,000 characters. Each character uses 8 bits. Calculate the file size in KB.`**
1. `mStep("Characters × bits per character:", "4000 \\times 8 = 32000", "bits")`
2. `mStep("Bits to bytes (÷ 8):", "32000 \\div 8 = 4000", "bytes")`
3. `mStep("Bytes to KB (÷ 1000):", "4000 \\div 1000 = 4", "KB")`
4. `mStep("Answer:", "4", "KB")`

Recipe picture: boxes `4,000 | 8 | 32,000 bits`; then the ladder lights bit → byte → KB.

**Level 1:** steps 1 and 4 only (answer in bits). **Level 3 reverse** (`24,000 bits, 8 bits each, find characters`):
1. `mStep("Bits ÷ bits per character:", "24000 \\div 8 = 3000", "characters")` 2. `mStep("Answer:", "3000", "characters")`.
For a KB-given reverse question, step 0 is KB → bytes → bits (× 1000, × 8). Compare questions repeat steps 1–3 for
each set, then `mStep("Difference:", ...)`.

#### 3.4 Sample questions (acceptance set)

| Level | Question as displayed | Answer | Working (one line) |
|---|---|---|---|
| 1 | A text file has 40 characters. Each character uses 8 bits. Calculate the file size in bits. | 320 bits | 40 × 8 |
| 1 | A message has 25 characters. Each character uses 16 bits. Calculate the file size in bits. | 400 bits | 25 × 16 |
| 1 | A text file has 60 characters. Each character uses 7 bits. Calculate the file size in bits. | 420 bits | 60 × 7 |
| 2 | A document has 4,000 characters. Each character uses 8 bits. Calculate the file size in KB. | 4 KB | 32,000 bits → 4,000 bytes → 4 KB |
| 2 | Each character uses 8 bits. How many bytes is the message `See you soon!`? | 13 bytes | 13 characters × 8 = 104 bits ÷ 8 |
| 2 | A file has 2,000 characters. Each character uses 16 bits. Calculate the file size in bytes. | 4,000 bytes | 32,000 bits ÷ 8 |
| 3 | A document has 6,000 characters. In ASCII each character uses 8 bits and in Unicode 16 bits. How many KB larger is the Unicode file? | 6 KB | ASCII 6 KB, Unicode 12 KB |
| 3 | A text file is 24,000 bits. Each character uses 8 bits. How many characters does it contain? | 3,000 characters | 24,000 ÷ 8 |
| 3 | A file of 5,000 characters is 10 KB. How many bits does each character use? | 16 bits | 10 KB = 80,000 bits ÷ 5,000 |

#### 3.5 Uniqueness

Key parameters: task, characters (or the message string), bits per character (both sets for compare), answer unit.
**Pool size:** Level 1 has 11 × 3 × 5 contexts = 165 keys; Level 2 about 80 once the unit and message options are
counted; Level 3 widened by the four tasks. All comfortably exceed 24.

### Sub-tool: Images (`images`)

#### 3.1 Question options (QO)

- **multiSelect** `task` — "Question Types":
  - `findSize` — "Find the file size" — defaultActive: true — weight 0
  - `coloursFromBits` — "How many colours do n bits give?" — defaultActive: true — weight 0
  - `fewestBits` — "Fewest bits for N colours" — defaultActive: false — weight 1
  - `canStore` — "Can n bits store N colours? (yes / no)" — defaultActive: false — weight 2
  - `logo` — "Colours given: fewest bits, then size" — defaultActive: false — weight 2
  - `several` — "Several identical images (total size)" — defaultActive: false — weight 2
  - `findDepth` — "Find the colour depth" — defaultActive: false — weight 3
  - `findPixels` — "Find the number of pixels / width" — defaultActive: false — weight 3
- **multiSelect** `colours` — "Numbers of colours (colour questions)":
  - `powers` — "Powers of two (2, 4, 8, 16 …)" — defaultActive: true
  - `notPowers` — "Not powers of two (5, 9, 100 …)" — defaultActive: false
- **multiSelect** `resolution` — "Resolution given as":
  - `wh` — "Width × height" — defaultActive: true
  - `pixels` — "Total number of pixels" — defaultActive: false
- **multiSelect** `answerUnit` — "Answer in": `bits`, `bytes`, `KB`, `MB` (per-level defaults)
- **variables:** `scaffoldLadder` — "Scaffold: show the unit ladder" — default true
- **Per-level differences:**
  - Level 1: `task` = findSize + coloursFromBits; `colours` = powers; `resolution` = wh + pixels; answer in bits
  - Level 2: `task` = findSize + fewestBits; `colours` = powers; `resolution` = wh; answer bytes, KB, MB
  - Level 3: `task` = all; `colours` = powers + notPowers; `resolution` = wh + pixels; answer KB, MB

The colour questions (`coloursFromBits`, `fewestBits`, `canStore`) show a **doubling chain** in the working box
instead of the recipe boxes (1 bit → 2, 2 bits → 4, 3 bits → 8 …, with the target count marked); the size tasks
show the recipe boxes and the ladder. `logo` and `several` show both.

#### 3.2 Levels

**Level 1 (pixels × depth in bits, and colours from bits):**
- Size parameters: width, height ∈ {4, 5, 8, 10, 16, 20, 25, 30, 32} (or total pixels ∈ {100, 200, 400, 640});
  colour depth ∈ {1, 2, 3, 4} bits; context (icon, logo, sprite, emoji). Answer < 3,000 bits.
- Colour parameters: n ∈ {1, 2, 3, 4, 5, 6, 8}; answer 2ⁿ colours.
- Exclusions: width = height only half the time (so "W + H" and "W × W" slips are exposed); depth never 1 for more
  than a third of size questions.
- Misconceptions targeted: adding width and height; forgetting to multiply by the depth; n bits give n (or 2 × n)
  colours.

**Level 2 (the exam shape: pixels, depth, units, and bits from colours):**
- Size parameters: width × height ∈ {(600, 400), (640, 480), (800, 600), (1000, 500), (300, 200), (400, 250),
  (500, 400), (1000, 1000), (1200, 800)}; depth ∈ {4, 8, 16, 24}; context (photo, screenshot, poster, drawing).
- Colour parameters: `fewestBits` with colours ∈ {2, 4, 8, 16, 32, 64, 128, 256}; answer the exponent.
- Constraints: size answers whole or one decimal place in the asked unit. Offer depth = 8 often (bytes = pixels).
- Exclusions: depth = 24 with unfriendly resolutions (reject unless the answer fits the one-decimal rule).
- Misconceptions targeted: forgetting ÷ 8; ÷ 1,000 only; treating the pixel count as the byte count when depth
  ≠ 8; using the number of colours as the number of bits (256 colours → "256 bits").

**Level 3 (stretch: the trap, reverse and combined questions):**
- Colour parameters: `fewestBits` and `logo` with colours ∈ {3, 5, 6, 9, 10, 17, 30, 100, 200} (not powers of
  two); `canStore` pairs a bit count and a colour count that straddle a power of two (3 bits with 9 colours,
  7 bits with 100 colours), with "yes" and "no" in roughly equal numbers.
- Size parameters: `logo` (width × height small, e.g. 8 × 4), `several` (count ∈ {10, 12, 20, 25, 30}, each image
  from Level 2 sets), `findDepth` (size in bytes, width, height given; depth ∈ {1, 2, 4, 8, 16}), `findPixels`
  (size and depth given; asks for the total pixels).
- Constraints: the colour answer is the smallest n with 2ⁿ ≥ N; reverse answers are whole numbers and valid
  depths; several: total in KB or MB, whole or one decimal.
- Exclusions: findDepth answers of 3 or 5 bits; `logo` where the colour count is a power of two (Level 3 stays on
  the trap).
- Misconceptions targeted: rounding down (9 colours → 3 bits because 8 is "nearly 9"); 2 colours → 2 bits; using
  the number of colours as the depth; forgetting the number of images; dividing the wrong way round.

#### 3.3 Worked example script

**Level 3 example — `An image is 300 × 200 pixels and uses 16 colours. Calculate the file size in KB.`**
1. `mStep("Colours to bits (2^4 = 16):", "4", "bits per pixel")`
2. `mStep("Width × height:", "300 \\times 200 = 60000", "pixels")`
3. `mStep("Pixels × bits per pixel:", "60000 \\times 4 = 240000", "bits")`
4. `mStep("Bits to bytes (÷ 8):", "240000 \\div 8 = 30000", "bytes")`
5. `mStep("Bytes to KB (÷ 1000):", "30000 \\div 1000 = 30", "KB")`
6. `mStep("Answer:", "30", "KB")`

**Level 2 (size):** steps 2–6 (colour depth given). **Level 1 (size):** steps 2, 3 and the answer in bits. Recipe
boxes read `pixels | colour depth | file size`; the pixels box expands to `width × height` first.

**Colour question, Level 3 — `An image uses 9 colours. State the fewest bits needed for each pixel.`**
1. `mStep("Powers of two:", "2^3 = 8,\\ 2^4 = 16")`
2. `mStep("8 is less than 9, 16 is at least 9:", "n = 4")`
3. `mStep("Answer:", "4", "bits")`

Picture: the doubling chain with the target colour count marked. **Level 1 colours:**
`mStep("Colours = 2^n:", "2^3 = 8")` then the answer.

#### 3.4 Sample questions (acceptance set)

| Level | Question as displayed | Answer | Working (one line) |
|---|---|---|---|
| 1 | An image is 10 × 10 pixels with a colour depth of 3 bits. Calculate the file size in bits. | 300 bits | 100 × 3 |
| 1 | An image is 20 pixels wide and 8 pixels high with a colour depth of 4 bits. Calculate the file size in bits. | 640 bits | 160 × 4 |
| 1 | How many colours can 3 bits store? | 8 colours | 2³ |
| 1 | An image has 400 pixels and a colour depth of 2 bits. Calculate the file size in bits. | 800 bits | 400 × 2 |
| 2 | An image is 600 × 400 pixels with a colour depth of 8 bits. Calculate the file size in KB. | 240 KB | 240,000 pixels = 240,000 bytes |
| 2 | An image is 1,000 × 500 pixels with a colour depth of 16 bits. Calculate the file size in MB. | 1 MB | 8,000,000 bits → 1,000,000 bytes |
| 2 | An image is 300 × 200 pixels with a colour depth of 4 bits. Calculate the file size in bytes. | 30,000 bytes | 240,000 bits ÷ 8 |
| 2 | An image uses 64 colours. State the fewest bits for each pixel. | 6 bits | 2⁶ = 64 |
| 3 | An image is 300 × 200 pixels and uses 16 colours. Calculate the file size in KB. | 30 KB | 4 bits × 60,000 = 240,000 bits |
| 3 | An image uses 9 colours. State the fewest bits for each pixel. | 4 bits | 2³ = 8 < 9, 2⁴ = 16 |
| 3 | Can 3 bits store 10 colours? | No | 2³ = 8 < 10 |
| 3 | An image file is 120,000 bytes and is 400 × 300 pixels. State the colour depth. | 8 bits | 960,000 bits ÷ 120,000 pixels |
| 3 | 20 images are each 200 × 100 pixels with a colour depth of 8 bits. Calculate the total size in KB. | 400 KB | 20,000 bytes each × 20 |

#### 3.5 Uniqueness
Key parameters: task, width, height (or pixels), depth (or colours, or n), image count. **Pool size:** Level 1 size
questions have 9 × 9 × 4 combinations (reject W = H over half the time); Level 2 has 9 resolutions × 4 depths = 36
base combinations × 3 units. The colour tasks have small parameter sets (7 values of n at Level 1, 8 colour counts
at Level 2), so they are widened by two wordings ("A colour depth of n bits allows…" / "How many colours can n
bits store?"), by two image contexts (a logo, a photograph), and, for `coloursFromBits`, by adding n = 7 and n = 10
(128 and 1,024 colours) if a teacher selects that task alone at Level 1.

### Sub-tool: Sound (`sound`)

#### 3.1 Question options (QO)

- **multiSelect** `task` — "Question Types":
  - `findSize` — "Find the file size" — defaultActive: true — weight 0
  - `compare` — "Compare two recordings" — defaultActive: false — weight 2
  - `findDuration` — "Find the duration" — defaultActive: false — weight 3
  - `findDepth` — "Find the bit depth" — defaultActive: false — weight 3
  - `findRate` — "Find the sample rate" — defaultActive: false — weight 3
- **multiSelect** `inputs` — "Units in the question":
  - `plain` — "Hz and seconds" — defaultActive: true
  - `convert` — "kHz and minutes (convert first)" — defaultActive: false
- **multiSelect** `answerUnit` — "Answer in": `bits`, `bytes`, `KB`, `MB` (per-level defaults)
- **variables:** `scaffoldLadder` — "Scaffold: show the unit ladder" — default true
- **Per-level differences:** Level 1: findSize; `plain`; bits. Level 2: findSize; `plain`; bytes, KB. Level 3: all
  tasks; `plain` + `convert`; KB, MB.

#### 3.2 Levels

**Level 1 (three factors, answer in bits):**
- Parameters: sample rate ∈ {10, 20, 50, 100, 200}; duration ∈ {2, 4, 5, 10}; bit depth ∈ {4, 8, 16}; context
  (voice memo, ringtone, sound effect, doorbell).
- Constraints: answer < 20,000 bits. Exclusions: rate = duration; any factor equal to 1.
- Misconceptions targeted: forgetting the duration (rate × depth only); adding the three numbers.

**Level 2 (the exam shape):**
- Parameters: rate ∈ {400, 500, 1000, 2000, 4000}; duration ∈ {5, 10, 20, 30, 60}; depth ∈ {8, 16}.
- Constraints: answer whole or one decimal in the asked unit.
- Exclusions: bytes answers that are not whole numbers.
- Misconceptions targeted: forgetting ÷ 8; ÷ 1,000 only; confusing sample rate with bit depth.

**Level 3 (stretch):**
- Parameters: `convert` inputs (rate in kHz ∈ {1, 2, 3, 4}; duration in minutes ∈ {1, 2, 3}); `compare` (two
  recordings that differ in two parameters so one factor cancels, e.g. 1 kHz × 10 s × 8 bits vs 500 Hz × 20 s ×
  16 bits); `findDuration`, `findDepth`, `findRate` (size in bytes or KB given; answers whole: duration ∈ {10, 20,
  30, 60, 120} s, depth ∈ {8, 16}, rate ∈ {500, 1000, 2000}).
- Constraints: reverse answers are whole numbers and from the sets above. Compare asks "which is larger and by how
  many KB".
- Exclusions: none for compare. Equal-size pairs are deliberately included about 1 in 8 so the larger-looking
  file is not assumed larger.
- Misconceptions targeted: not converting minutes to seconds; not converting kHz to Hz; using minutes with Hz;
  dividing the wrong way round.

#### 3.3 Worked example script

**Level 3 example — `A recording lasts 2 minutes with a sample rate of 2 kHz and a bit depth of 8 bits. Calculate the file size in KB.`**
1. `mStep("Duration in seconds:", "2 \\times 60 = 120", "seconds")`
2. `mStep("Sample rate in Hz:", "2 \\times 1000 = 2000", "Hz")`
3. `mStep("Rate × duration × bit depth:", "2000 \\times 120 \\times 8 = 1920000", "bits")`
4. `mStep("Bits to bytes (÷ 8):", "1920000 \\div 8 = 240000", "bytes")`
5. `mStep("Bytes to KB (÷ 1000):", "240000 \\div 1000 = 240", "KB")`
6. `mStep("Answer:", "240", "KB")`

**Level 2:** steps 3–6. **Level 1:** step 3 and the answer in bits. Recipe boxes read
`sample rate | duration | bit depth | file size`.

#### 3.4 Sample questions (acceptance set)

| Level | Question as displayed | Answer | Working (one line) |
|---|---|---|---|
| 1 | A sound has a sample rate of 10 Hz, a duration of 5 seconds and a bit depth of 8 bits. Calculate the file size in bits. | 400 bits | 10 × 5 × 8 |
| 1 | A sound has a sample rate of 100 Hz, a duration of 4 seconds and a bit depth of 16 bits. Calculate the file size in bits. | 6,400 bits | 100 × 4 × 16 |
| 1 | A sound has a sample rate of 20 Hz, a duration of 10 seconds and a bit depth of 4 bits. Calculate the file size in bits. | 800 bits | 20 × 10 × 4 |
| 2 | A sound has a sample rate of 400 Hz, a duration of 10 seconds and a bit depth of 8 bits. Calculate the file size in bytes. | 4,000 bytes | 32,000 bits ÷ 8 |
| 2 | A sound has a sample rate of 1,000 Hz, a duration of 20 seconds and a bit depth of 16 bits. Calculate the file size in KB. | 40 KB | 320,000 bits → 40,000 bytes |
| 2 | A sound has a sample rate of 2,000 Hz, a duration of 30 seconds and a bit depth of 8 bits. Calculate the file size in KB. | 60 KB | 480,000 bits → 60,000 bytes |
| 3 | A recording lasts 2 minutes, with a sample rate of 2 kHz and a bit depth of 8 bits. Calculate the file size in KB. | 240 KB | 2,000 × 120 × 8 = 1,920,000 bits → 240,000 bytes |
| 3 | A recording is 120,000 bytes with a sample rate of 1,000 Hz and a bit depth of 8 bits. State the duration in seconds. | 120 seconds | 960,000 bits ÷ (1,000 × 8) |
| 3 | Sound A: 1 kHz for 10 seconds at 8 bits. Sound B: 500 Hz for 20 seconds at 16 bits. How many KB larger is the bigger file? | B, by 10 KB | A 10 KB, B 20 KB |

#### 3.5 Uniqueness
Key parameters: task, rate, duration, depth, answer unit, units mode. **Pool size:** Level 1 has 5 × 4 × 3 = 60
combinations before exclusions; Level 2 has 5 × 5 × 2 × 2 units = 100; Level 3 is widened by five tasks. All exceed
24.

---

## 4. Variety requirements

- **Contexts.** Text: text message, email, note, caption, password, poem. Images: icon, logo, sprite, photograph,
  screenshot, poster. Sound: voice memo, ringtone, sound effect, podcast clip, song clip. Rotate so no two
  consecutive questions share a context.
- **Names.** Use the standard pool from `RatioSharingTool.tsx` (Alice … Peter) in "X saves a …" framings. Not every
  question needs a name; keep about one in three plain.
- **Bits mix.** Across a worksheet, spread bits per character/pixel/sample over the allowed set; do not let 8 bits
  exceed about half the questions (8 should be common but not universal, or students stop reading the number).
- **Answer unit.** Spread across the active units; at Level 2 do not give more than three bits-to-KB questions in a
  row.
- **Message questions (Text).** Messages are drawn from a pool of 5–25 character strings, each with at least one
  space or punctuation mark; vary punctuation (full stop, !, ?, comma) and avoid digits-only strings.
- **Compare questions.** Include an "equal size" outcome roughly one in eight (see Sound, Level 3) so students do
  not assume the bigger-looking file is larger.

---

## 5. Info modal content

```
INFO_SECTIONS = [
  { title: "Text", icon: "📝", content: [
    { label: "Overview", detail: "Characters × bits per character gives the size in bits. Bits per character is always given in the question." },
    { label: "Level 1 — Green", detail: "One multiplication, answer in bits." },
    { label: "Level 2 — Amber", detail: "Answer in bytes or KB, with optional counting of a message (spaces and punctuation count)." },
    { label: "Level 3 — Red", detail: "Comparing ASCII and Unicode, and working back to the characters or bits per character." }
  ]},
  { title: "Images", icon: "🖼️", content: [
    { label: "Overview", detail: "Width × height × colour depth gives the size in bits; then convert to bytes, KB or MB. Also colour depth: n bits give 2ⁿ colours, and the fewest bits for N colours is the smallest n where 2ⁿ is at least N." },
    { label: "Level 1 — Green", detail: "Small images in bits, and colours from bits." },
    { label: "Level 2 — Amber", detail: "Exam-size images in bytes, KB or MB (depth 8 bits makes bytes equal pixels), and the fewest bits for a power-of-two colour count." },
    { label: "Level 3 — Red", detail: "Colours that are not powers of two (the trap), colours given before the size, several images, and reverse questions." }
  ]},
  { title: "Sound", icon: "🔊", content: [
    { label: "Overview", detail: "Sample rate × duration × bit depth gives the size in bits; then convert to bytes, KB or MB." },
    { label: "Level 1 — Green", detail: "Small recordings, answer in bits." },
    { label: "Level 2 — Amber", detail: "Hz and seconds, answer in bytes or KB." },
    { label: "Level 3 — Red", detail: "kHz and minutes to convert, comparing recordings, and reverse questions." }
  ]}
]
```
Teacher tip row (each section): "Mix levels in Differentiated mode for a class working on different parts of the
calculation. All numbers are chosen to be doable without a calculator."

---

## 6. Out of scope / future ideas

- **Diagram sub-tools (deferred, each needs agreement first).** *Pixel picture:* a small grid drawn from a colour
  key, asking the student to count the colours, state the fewest bits and calculate the size (OCR "logo"
  questions; reference `BasicAngleFacts.tsx` for SVG and print conventions). *Sampled wave:* a graph with sample
  points, asking for the sample rate or the bit depth from the plot. Both are real representation costs; v1 is
  text-only.
- **Teach deck.** A Teach-mode deck (`specs/decks/file-sizes.md`, TEACH_DECK_SPEC_TEMPLATE) for the slide sequence;
  the current Monday lesson PowerPoint is a lesson-specific deck and does not replace it.
- **Compression (1.2.5)** is a separate tool (ratios, lossy vs lossless).
- **Binary prefix units (KiB, MiB)** are not used in questions; the ladder's bracketed ×1024 labels remain.
- **Bits per character for Unicode beyond 16 bits** and **variable-width encodings** are out of scope.
- **Sample rates such as 44.1 kHz** are excluded because they break the no-calculator rule.

## 7. Acceptance (for Claude Code)

`src/tests/fileSizes.test.ts`:
- Every generated answer matches an independent bits-based calculation (size in bits ÷ 8 ÷ 1000 as needed) for
  1,000 random questions per sub-tool per level.
- Every KB and MB answer is whole or one decimal place; every bytes answer is a whole number.
- No Level 1 question needs a unit conversion; no Level 2 question needs an input conversion; every Level 3
  question needs at least two steps beyond a single multiplication.
- Images colour questions (`fewestBits`, `logo`, `canStore`) always give `n` where 2ⁿ ≥ N and 2ⁿ⁻¹ < N.
- Every acceptance-set row in 3.4 is reproducible by the generator's formulas.
- Reverse questions always produce an integer in the permitted set.
- Data Units tests still pass unchanged after the ladder extraction.
