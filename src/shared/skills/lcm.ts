import type { SkillDef } from "./index";

// Lowest Common Multiple — taught by listing multiples until the lists share a
// number. Exemplars are hand-picked model-friendly numbers (4 & 6, 5 & 3, 6 & 9);
// the questions that link here bring their own numbers to the worked example.

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
      category: "concept", phase: "iDo",
      title: "LCM of $4$ and $6$",
      body: [
        { t: "text", s: "List the multiples of each number:" },
        { t: "math", s: "4:\\;\\; 4,\\ 8,\\ \\mathbf{12},\\ 16,\\ 20,\\ 24" },
        { t: "math", s: "6:\\;\\; 6,\\ \\mathbf{12},\\ 18,\\ 24" },
      ],
      reveal: [
        { t: "note", tone: "good", label: "LCM", s: "$12$ is the first number in both lists — the LCM of $4$ and $6$ is $12$." },
      ],
      revealLabel: "Find the LCM",
    },
    {
      category: "concept", phase: "weDo",
      title: "LCM of $5$ and $3$",
      body: [
        { t: "text", s: "List the multiples together — which number appears first in **both** lists?" },
        { t: "math", s: "5:\\;\\; 5,\\ 10,\\ 15,\\ 20" },
        { t: "math", s: "3:\\;\\; 3,\\ 6,\\ 9,\\ 12,\\ 15" },
      ],
      reveal: [
        { t: "note", tone: "good", label: "LCM", s: "The LCM of $5$ and $3$ is $15$." },
        { t: "note", tone: "plain", label: "Shortcut", s: "When two numbers share no common factor, the LCM is simply their product: $5 \\times 3 = 15$." },
      ],
    },
    {
      category: "concept", phase: "youDo",
      title: "Your turn — LCM of $6$ and $9$",
      body: [
        { t: "text", s: "Write down the multiples of $6$ and of $9$, and find the LCM, before revealing." },
      ],
      reveal: [
        { t: "math", s: "6:\\;\\; 6,\\ 12,\\ \\mathbf{18} \\qquad\\quad 9:\\;\\; 9,\\ \\mathbf{18}" },
        { t: "note", tone: "good", label: "LCM", s: "The LCM of $6$ and $9$ is $18$ — not $54$. The product shortcut only works when the numbers share no common factor." },
      ],
    },
  ],
};
