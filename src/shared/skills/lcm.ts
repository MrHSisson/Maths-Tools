import type { SkillDef } from "./index";

// Lowest Common Multiple — a stand-alone taught walkthrough (the drill-down a
// student presses on mid-question). Each press writes the next multiple on the
// board, exactly as a teacher would list them; no practice phases. Exemplars
// are hand-picked model-friendly numbers (4 & 6, then 5 & 3) — the question
// that links here brings its own numbers to the worked example.

export const LCM_SKILL: SkillDef = {
  id: "lcm",
  title: "Lowest Common Multiple",
  description: "Find the LCM of two numbers by listing multiples until a number appears in both lists.",
  category: "Number",
  slides: [
    {
      category: "concept",
      title: "Lowest common multiple (LCM)",
      body: [
        { t: "text", s: "The **lowest common multiple** of two numbers is the smallest number that appears in **both** times tables." },
        { t: "text", s: "To find it, list the multiples of each number until one appears in both lists." },
      ],
    },
    {
      kind: "anim", category: "concept",
      title: "LCM of $4$ and $6$",
      scene: { type: "multiples", a: 4, b: 6 },
      steps: [
        "To find the LCM of $4$ and $6$, list the multiples of each number.",
        "Multiples of $4$: four…",
        "…eight…",
        "…twelve.",
        "Now the multiples of $6$: six…",
        "…twelve — there it is, in both lists.",
        "$12$ is the smallest number in both lists — the LCM of $4$ and $6$ is $12$.",
      ],
    },
    {
      kind: "anim", category: "concept",
      title: "LCM of $5$ and $3$",
      scene: { type: "multiples", a: 5, b: 3 },
      steps: [
        "Once more — the LCM of $5$ and $3$. List the multiples.",
        "Multiples of $5$: five…",
        "…ten…",
        "…fifteen.",
        "Now the multiples of $3$: three…",
        "…six…",
        "…nine…",
        "…twelve…",
        "…fifteen — in both lists.",
        "The LCM of $5$ and $3$ is $15$. When two numbers share no common factor, the LCM is simply their product: $5 \\times 3 = 15$.",
      ],
    },
  ],
};
