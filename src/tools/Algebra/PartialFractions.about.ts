import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Split an algebraic fraction into partial fractions.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "denomShown": "Whether the bottom is shown factorised, or expanded so you must factorise it first.",
    "constants": "Whether the constants in the answer are whole numbers or can be fractions.",
    "negX": "Switch on to allow a negative x term in the top.",
    "method": "How much working is shown.",
  },
  tools: {
    two: {
      purpose: "Split a fraction with two brackets on the bottom.",
      levels: [
        "Two different brackets (x + a)(x + b), or one is x",
        "A bracket with a coefficient, like (px + q), or a negative x term, like (a − bx)",
        "A repeated bracket, such as (x + a)² or (px + q)²",
      ],
      options: {
        "denomForm@1": "Two different brackets, (x + a)(x + b), or one bracket is just x.",
        "denomForm@2": "A bracket with a coefficient of x, such as (px + q)(x + a) or (px + q)(rx + s), or a negative x term, such as (a − bx)(cx + d).",
        "denomForm@3": "A repeated bracket.",
      },
    },
    three: {
      purpose: "Split a fraction with three brackets on the bottom.",
      levels: [
        "Three different brackets, or two and x",
        "One bracket with a coefficient, or a negative x term",
        "One repeated bracket, like (x + a)(x + b)²",
      ],
      options: {
        "denomForm@1": "Three different brackets, or two brackets and x.",
        "denomForm@2": "One bracket with a coefficient of x, or a negative x term, alongside plain brackets.",
        "denomForm@3": "A repeated bracket in a product of three, such as (x + a)(x + b)², (px + q)(x + a)² or (x + a)(b − cx)².",
      },
    },
    divide: {
      purpose: "Divide first when the top is too big, then split what is left.",
      levels: [
        "Quadratic over quadratic: the quotient is a number",
        "Cubic over quadratic: the quotient is linear, and the bottom is shown expanded",
        "Cubic bottom, or a repeated bracket",
      ],
      options: {
        "denomForm@2": "Quadratic over quadratic (the quotient is a number), or cubic over quadratic (the quotient is linear).",
        "denomForm@3": "A cubic bottom (the quotient is a number or linear), or a repeated bracket with a linear quotient.",
      },
    },
  },
};
