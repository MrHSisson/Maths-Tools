import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Find the perimeter and area of shapes, from counting squares to compound shapes and algebra.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "askFor": "What the question asks you to find.",
    "given": "Whether the perimeter or the area is given.",
    "shapes": "Which shapes can come up.",
    "units": "Whether all the lengths are in the same unit or you must convert.",
    "scale": "How long one square on the grid is.",
    "sidesGiven": "Whether every side is labelled.",
    "perimeterMethod": "How the perimeter is worked out in the working.",
    "areaMethod": "How the area is worked out in the working.",
    "showSplit": "Whether the dashed lines for the area method are drawn on the question.",
    "questionTypes": "The kind of algebra question.",
  },
  tools: {
    grid: {
      purpose: "Count the length round a shape and the squares inside it.",
      levels: [
        "Rectangles and squares on a grid",
        "L, T and staircase shapes on a grid",
        "A scale on the grid: one square is 2 cm or 5 cm",
      ],
    },
    shapes: {
      purpose: "Use side lengths and heights to find perimeter and area, or to find a missing length.",
      levels: [
        "Rectangles, squares and regular polygons",
        "Triangles, parallelograms and trapezia, with the extra lengths shown",
        "Find a missing length from the perimeter or area",
      ],
    },
    compound: {
      purpose: "Find the perimeter and area of shapes made from rectangles.",
      levels: [
        "L, T and staircase shapes with every side given",
        "Some sides missing: find them from the opposite sides",
        "Notches and holes, where the inside edge counts",
      ],
    },
    algebraic: {
      purpose: "Write and use perimeter and area with sides in terms of x.",
      levels: [
        "Write and simplify the perimeter",
        "Solve for x from a given perimeter",
        "Expand areas and find the perimeter of an L-shape",
      ],
    },
  },
};
