import type { DifficultyLevel } from "./types";

export const LV_COLORS: Record<DifficultyLevel, { bg: string; border: string; text: string; fill: string }> = {
  level1: { bg: "bg-green-50",  border: "border-green-500",  text: "text-green-700",  fill: "#dcfce7" },
  level2: { bg: "bg-yellow-50", border: "border-yellow-500", text: "text-yellow-700", fill: "#fef9c3" },
  level3: { bg: "bg-red-50",    border: "border-red-500",    text: "text-red-700",    fill: "#fee2e2" },
};

export const LV_LABELS: Record<string, string> = {
  level1: "Level 1",
  level2: "Level 2",
  level3: "Level 3",
};

export const LV_HEADER_COLORS: Record<string, string> = {
  level1: "text-green-600",
  level2: "text-yellow-500",
  level3: "text-red-600",
};

export const getQuestionBg = (cs: string) =>
  ({ blue: "#D1E7F8", pink: "#F8D1E7", yellow: "#F8F4D1" }[cs] ?? "#ffffff");

export const getStepBg = (cs: string) =>
  ({ blue: "#B3D9F2", pink: "#F2B3D9", yellow: "#F2EBB3" }[cs] ?? "#f3f4f6");
