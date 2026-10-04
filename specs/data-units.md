# Data Units

**Status:** implemented

**Route:** `/data-units` · `src/tools/Binary/DataUnits.tsx` · category Binary & Number Bases (Computer Science) · dev-gated (`enabled: false`)
**Build type:** ToolShell question generator (procedural CS skill, like Number Bases).

## Spec
OCR J277 1.2.4 units: bit, nibble (4 bits), byte (8 bits = 2 nibbles), KB, MB, GB, TB, PB. **×1000** between named multiples (OCR); **×1024 shown in brackets** wherever a hop is a ×1000 one.

## One ladder, levels = length of the walk
`bit ─×4─ nibble ─×2─ byte ─×1000─ KB ─×1000─ MB ─×1000─ GB ─×1000─ TB ─×1000─ PB`. Down the ladder multiplies, up divides.

| Level | Walk | Bytes & Above | Bits & Nibbles |
|---|---|---|---|
| 1 | one step | 40 000 KB → MB, 3 TB → GB | bit ↔ nibble, nibble ↔ byte |
| 2 | two steps | 5 GB → KB | bit ↔ byte, nibble ↔ KB |
| 3 | 3–5 steps | 2 PB → GB… (byte…PB) | bit ↔ KB, nibble ↔ MB, bit ↔ MB, nibble ↔ GB |

## Sub-tools
- **Bytes & Above** — byte → PB, every factor 1000. QOs: Direction (× / ÷), Numbers (whole / one decimal), Wording ("Convert … to …" / "How many … in …?").
- **Bits & Nibbles** — a bit or nibble at one end, so ×4 / ×2 hops appear. Different format: a short scenario ("A file is 3 KB in size. How many bits is this?"). QO: Direction.

## Representation
The scale (a vertical ladder, centred in the working box) is the whiteboard `workingScaffold`; a QO switch "Scale: only the relevant units" shows just the units from start to target (bigger type, no distractors) for scaffolding / visibility: start unit filled, target outlined; Show Answer lights the path. Every ×1000 hop labelled "×1000 (×1024)" / "÷1000 (÷1024)". Worked example = one line per hop with fragments (`40,000 ÷ 1000 = 40`) and the label carrying the bracketed 1024. Values are exact (BigInt tenths).

## Acceptance
`src/tests/dataUnits.test.ts` checks every generated answer against an independent bits-based conversion, the step count per level, and that Bytes & Above never reaches below a byte. 40 000 KB → 40 MB; 3 TB → 3 000 GB.

## Possible next
Evolving ladder as the worked-example picture (`stepVisualRenderer`); file-size calculations (image/sound, J277 1.2.4) built on the same ladder.
