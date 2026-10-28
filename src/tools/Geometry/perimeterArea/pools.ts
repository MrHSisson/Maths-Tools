// Perimeter & Area — the Question Option pools, shared by the tool's config and its generators.
import type { ToolMultiSelect, ToolVariable } from "../../../shared";

const opt = (value: string, label: string, defaultActive: boolean, requires?: string[]) => ({ value, label, defaultActive, ...(requires ? { requires } : {}) });

export const ASK: ToolMultiSelect = { key: "askFor", tab: "questions", label: "Ask for", balanced: true, options: [opt("perimeter", "Perimeter", true), opt("area", "Area", true)] };
export const GIVEN: ToolMultiSelect = { key: "given", tab: "questions", label: "Given", balanced: true, options: [opt("perimeter", "Perimeter", true), opt("area", "Area", true)] };
export const SCALE: ToolMultiSelect = { key: "scale", tab: "numbers", label: "Scales", balanced: true, options: [opt("two", "1 Square = 2 cm", true), opt("five", "1 Square = 5 cm", false)] };
export const UNITS: ToolMultiSelect = { key: "units", tab: "numbers", label: "Units", exclusive: true, options: [opt("same", "Same Units", true), opt("mixed", "Mixed Units", false)] };

// Standard Shapes: which shapes come up, by level
export const SHAPES_1: ToolMultiSelect = { key: "shapes", tab: "questions", label: "Shape Types", balanced: true, options: [opt("rectangle", "Rectangle", true), opt("square", "Square", true), opt("regularPolygon", "Regular Polygon", true, ["perimeter"])] };
export const SHAPES_2: ToolMultiSelect = {
  key: "shapes", tab: "questions", label: "Shape Types", balanced: true,
  options: [opt("rightTriangle", "Right-Angled Triangle", true), opt("isoscelesTriangle", "Isosceles Triangle", true), opt("scaleneTriangle", "Scalene Triangle", true), opt("parallelogram", "Parallelogram", true), opt("trapezium", "Trapezium", true)],
};
export const SHAPES_3: ToolMultiSelect = {
  key: "shapes", tab: "questions", label: "Shape Types", balanced: true,
  options: [opt("rectangle", "Rectangle", true), opt("triangle", "Right-Angled Triangle", true), opt("isoscelesTriangle", "Isosceles Triangle", true), opt("scaleneTriangle", "Scalene Triangle", true), opt("parallelogram", "Parallelogram", true), opt("trapezium", "Trapezium", false)],
};

// Compound Shapes
const sides = (d: "all" | "missing"): ToolMultiSelect => ({
  key: "sidesGiven", tab: "questions", label: "Sides Given", exclusive: true,
  options: [opt("all", "All Sides", d === "all"), opt("missing", "Some Missing", d === "missing")],
});
export const SIDES_1 = sides("all"), SIDES_2 = sides("missing"), SIDES_3 = sides("missing");
/** Leave out the labels the drawing already implies (a side equal to the one opposite it; a rectangle's other two sides), as on an exam paper.
 *  Independent of Sides Given: with Some Missing on, the ? sides are then found by adding or taking away the sides that are shown or implied. */
export const reducedLabels = (on: boolean): ToolVariable => ({ key: "reducedLabels", tab: "display", label: "Reduced Labelling", defaultValue: on });
export const PERIMETER_METHOD: ToolMultiSelect = { key: "perimeterMethod", tab: "method", label: "Method for Perimeter", exclusive: true, displayOnly: true, options: [opt("addSides", "Add the Sides", true), opt("boundingRectangle", "Bounding Rectangle", false)] };
export const AREA_METHOD: ToolMultiSelect = { key: "areaMethod", tab: "method", label: "Method for Area", exclusive: true, displayOnly: true, options: [opt("split", "Split Up", true), opt("subtract", "Subtract", false)] };
export const showSplit = (on: boolean): ToolVariable => ({ key: "showSplit", tab: "method", label: "Show the Split on the Question", defaultValue: on, displayOnly: true });

// With Algebra
export const ALG_SHAPES: ToolMultiSelect = { key: "shapes", tab: "questions", label: "Shape Types", balanced: true, options: [opt("rectangle", "Rectangle", true), opt("triangle", "Triangle", true), opt("square", "Square", true)] };
export const ALG_TYPES: ToolMultiSelect = { key: "questionTypes", tab: "questions", label: "Question Types", balanced: true, options: [opt("areaExpression", "Area, Expanded", true), opt("lShapePerimeter", "L-Shape Perimeter", true)] };
