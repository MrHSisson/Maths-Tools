import type { SkillDef } from "./index";

// LCM from prime factors — the variant for larger numbers, where listing
// multiples takes too long. Prime factor tiles representation: factor trees
// produce each prime as a coloured tile, then a Venn diagram walkthrough
// crosses tiles off the factor lists as they're placed (shared pairs to the
// middle) and the LCM is the product of everything in the diagram.
//
// The examples cover the skill's distinct cases, not an arbitrary count:
//   12 & 18 — the base case: distinct spare primes on each side
//   8 & 12  — a REPEATED shared prime: both pairs of 2s go in the middle
//   9 & 18  — one number contained in the other: 9's region ends up empty,
//             so the LCM is just the bigger number

export const LCM_PRIME_FACTORS_SKILL: SkillDef = {
  id: "lcm-prime-factors",
  title: "Lowest Common Multiple",
  method: "From prime factors",
  description: "Write each number as a product of primes, place the tiles in a Venn diagram, and multiply everything. Best for larger numbers.",
  category: "Number",
  slides: [
    {
      category: "concept",
      title: "LCM from prime factors",
      body: [
        { t: "text", s: "When the numbers get bigger, listing multiples takes too long. Instead, write each number as a **product of primes**." },
        { t: "text", s: "Shared prime tiles pair up in the **middle** of a Venn diagram; leftover tiles go on their own side. The LCM is the product of **everything** in the diagram." },
      ],
    },
    {
      kind: "anim", category: "concept",
      title: "Factor tree for $12$",
      scene: { type: "factorTree", n: 12 },
      steps: [
        "First, write $12$ as a product of primes using a factor tree.",
        "Split $12$ into $2 \\times 6$. $2$ is prime — take it as a tile.",
        "Split $6$ into $2 \\times 3$. Both are prime — two more tiles.",
        "Multiply the tiles: $12 = 2 \\times 2 \\times 3$.",
      ],
    },
    {
      kind: "anim", category: "concept",
      title: "Factor tree for $18$",
      scene: { type: "factorTree", n: 18 },
      steps: [
        "Now $18$ — the same method.",
        "Split $18$ into $2 \\times 9$. Take the prime $2$ as a tile.",
        "Split $9$ into $3 \\times 3$. Both prime — two $3$ tiles.",
        "So $18 = 2 \\times 3 \\times 3$.",
      ],
    },
    {
      kind: "anim", category: "concept",
      title: "Build the LCM of $12$ and $18$",
      scene: { type: "primeVenn", a: 12, b: 18 },
      steps: [
        "Now place the tiles in a Venn diagram — shared tiles pair up in the middle.",
        "Both lists have a $2$ — cross one off each list, and one $2$ goes in the middle.",
        "Both lists have a $3$ — cross them off; a $3$ in the middle too.",
        "$12$ has a spare $2$ left — it goes on $12$'s side.",
        "$18$ has a spare $3$ — on $18$'s side.",
        "The LCM is the product of **everything** in the diagram: $2 \\times 2 \\times 3 \\times 3 = 36$.",
      ],
    },
    {
      // Case: a REPEATED shared prime — both pairs of 2s must go in the
      // middle, the classic misconception. Trees compressed to the stated
      // lists (the method was walked twice above).
      kind: "anim", category: "concept",
      title: "One more — the LCM of $8$ and $12$",
      scene: { type: "primeVenn", a: 8, b: 12 },
      steps: [
        "Another one. The factor trees give $8 = 2 \\times 2 \\times 2$ and $12 = 2 \\times 2 \\times 3$.",
        "Both lists have a $2$ — cross one off each; a $2$ in the middle.",
        "Both have a **second** $2$ — that pair goes in the middle too.",
        "$8$ still has one more $2$ — it goes on $8$'s side.",
        "$12$'s spare $3$ goes on $12$'s side.",
        "Multiply everything: $2 \\times 2 \\times 2 \\times 3 = 24$. The LCM of $8$ and $12$ is $24$.",
      ],
    },
    {
      // Case: one number contained in the other — every tile of 9 pairs into
      // the middle, 9's own region is empty, and the LCM is just 18.
      kind: "anim", category: "concept",
      title: "Last one — the LCM of $9$ and $18$",
      scene: { type: "primeVenn", a: 9, b: 18 },
      steps: [
        "Last one — $9$ and $18$: $9 = 3 \\times 3$ and $18 = 2 \\times 3 \\times 3$.",
        "Both lists have a $3$ — cross one off each; a $3$ in the middle.",
        "Both have a **second** $3$ — in the middle too. $9$'s list is now empty.",
        "Only $18$'s spare $2$ is left — it goes on $18$'s side.",
        "$9$'s own region is **empty** — $9$ fits inside $18$. Multiply everything: $2 \\times 3 \\times 3 = 18$, so the LCM is just $18$.",
      ],
    },
  ],
};
