# Tool Spec: Indices — evaluating all kinds of power, and the Negative & Zero and Fractional Indices tabs

**Status:** implemented 2026-10-19 (tabs, generators, Depth re-pointing and tests; lessons and decks only re-pointed as far as the tests need). Extends `specs/indices.md`. Branch `claude/network-flow-difficulty-style-ek2mn9`.

## Why
Zero, negative and fractional powers were one mixed tab ("Negative & Fractional") with thin numeric practice and almost no laws involving them. The tool now separates **evaluating numbers** (Powers & Roots) from **handling these powers in index laws** (two new algebra tabs). Lessons and decks are out of scope for this spec (they are re-pointed only as far as the tests need).

## Decisions (teacher, 2026-10-19)
- **Powers & Roots is the numbers tab:** L1 recap of what is known (squares, cubes, square and cube roots), L2 zero and negative powers, L3 fractional and negative fractional powers.
- A **Bases** selector (whole numbers · fractions · decimals) on every level; fraction and decimal bases are options, not separate question types.
- **Negative & Zero Indices** (algebra and laws) and **Fractional Indices** are two tabs.
- Index Laws (positive indices) and Common Base are unchanged.
- `x³ ÷ x⁵` (the bottom power bigger) belongs to Negative & Zero Indices.
- An **Answer form** option on the laws tabs: positive indices (default) or leave negatives.

## Powers & Roots (`powersRoots`)
| Level | Pool (Question Types) | Bases |
|---|---|---|
| 1 | Index notation · Squares & cubes · Roots · Combined * · Negative bases * | whole numbers (default) · fractions · decimals |
| 2 | Zero power · Negative powers · Write as a power | same |
| 3 | Roots as powers (1/n, up to 1/5 for whole numbers) · Fractional powers (m/n) · Negative fractional · Calculator * | same |

## Negative & Zero Indices (`specialPowers`, tab renamed)
| Level | Content |
|---|---|
| 1 | Write between forms (`x⁻³` ⇄ `1/x³`, `2x⁻²` ⇄ `2/x²`) · Zero index (`x⁰`, `3x⁰` against `(3x)⁰`, `x³ × x⁰`) · Divide to negative (`x³ ÷ x⁵`) · Laws with a negative index (`x³ × x⁻²`, `x³ ÷ x⁻²`, `x⁻³ × x⁻⁴`) |
| 2 | Power of a power (`(x⁻²)⁻⁴`, `(x⁻²)³`, `(x³)⁻²`) · Bracketed terms with a coefficient (`(2x⁻³)²`) · Multiply with coefficients (`4x⁻² × 3x⁵`) |
| 3 | Divide with coefficients (`12x³ ÷ 4x⁻²`) · Two letters (`(3x²y⁻¹)²`, `6x³y⁻¹ ÷ 2x⁻²y`) · Combined · Number bases (`2⁻³ × 2⁵`) |

Option **Answer form**: Positive indices (default) · Leave negatives. A negative outer power is only asked on a monomial with coefficient 1 (so no fractional coefficients arise).

## Fractional Indices (`fractionalIndices`, new tab)
| Level | Content |
|---|---|
| 1 | Write between forms: root ⇄ index form for square, cube, 4th and 5th roots (`√x` ⇄ `x^{1/2}`); `x^{m/n}` ⇄ `(ⁿ√x)ᵐ` ⇄ `ⁿ√(xᵐ)`; option **Negative indices** (`x^{-1/2}` ⇄ `1/√x`), off by default; letters and numbers |
| 2 | Index laws with fractional indices: multiply, divide, power of a power, option for unlike denominators and negatives |
| 3 | Laws with coefficients: `(8x⁶)^{1/3}`, `(27x³)^{2/3}`, `4x^{1/2} × 3x^{3/2}`; negative fractional at the top: `(16x⁴)^{-1/2}` |

## Correctness (tests check)
- Every numeric question carries its raw parameters (`_idx`); the test recomputes the result with independent exact rational arithmetic and compares it with the answer.
- Every algebra question carries its operands; the test evaluates operands and answer at numeric points and compares (so `x³ ÷ x⁻² = x⁵` is checked by arithmetic, not by the generator's own rule).
- Answer-form rules: no `x¹`, no `1x`, no zero index left, letters alphabetical, positive form has no negative index.
