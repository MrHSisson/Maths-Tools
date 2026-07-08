import type { SkillDef } from "./index";

// LCM from prime factors — the variant for larger numbers, where listing
// multiples takes too long. Prime factor tiles representation: factor trees
// build each factorisation one split per press, then a Venn diagram places
// each prime one per press (shared primes to the middle) and the LCM is the
// product of everything in the diagram. Exemplars 12 & 18: small enough that
// every tree and region stays readable, big enough that the factor structure
// is visible.

export const LCM_PRIME_FACTORS_SKILL: SkillDef = {
  id: "lcm-prime-factors",
  title: "Lowest Common Multiple",
  method: "From prime factors",
  description: "Write each number as a product of primes, place them in a Venn diagram, and multiply everything. Best for larger numbers.",
  category: "Number",
  slides: [
    {
      category: "concept",
      title: "LCM from prime factors",
      body: [
        { t: "text", s: "When the numbers get bigger, listing multiples takes too long. Instead, write each number as a **product of primes**." },
        { t: "text", s: "Shared primes go in the **middle** of a Venn diagram; leftover primes go on their own side. The LCM is the product of **everything** in the diagram." },
      ],
    },
    {
      kind: "anim", category: "concept",
      title: "Factor tree for $12$",
      scene: { type: "factorTree", n: 12 },
      steps: [
        "First, write $12$ as a product of primes using a factor tree.",
        "Split $12$ into $2 \\times 6$. $2$ is prime — circle it.",
        "Split $6$ into $2 \\times 3$. Both prime — circle them.",
        "Multiply the circled primes: $12 = 2 \\times 2 \\times 3$.",
      ],
    },
    {
      kind: "anim", category: "concept",
      title: "Factor tree for $18$",
      scene: { type: "factorTree", n: 18 },
      steps: [
        "Now $18$ — the same method.",
        "Split $18$ into $2 \\times 9$. Circle the $2$.",
        "Split $9$ into $3 \\times 3$. Both prime.",
        "So $18 = 2 \\times 3 \\times 3$.",
      ],
    },
    {
      kind: "anim", category: "concept",
      title: "Build the LCM of $12$ and $18$",
      scene: { type: "primeVenn", a: 12, b: 18 },
      steps: [
        "Place the primes in a Venn diagram — shared primes go in the middle.",
        "Both numbers have a $2$ — it goes in the middle.",
        "Both have a $3$ — in the middle too.",
        "$12$ still has a spare $2$ — it goes on $12$'s side.",
        "$18$ still has a spare $3$ — on $18$'s side.",
        "The LCM is the product of **everything** in the diagram: $2 \\times 2 \\times 3 \\times 3 = 36$.",
      ],
    },
  ],
};
