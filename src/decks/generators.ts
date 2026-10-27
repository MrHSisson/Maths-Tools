// The generator behind a practice slide's backup: the SAME function the tool page uses (its `__test` export), loaded on demand.
import type { AnyQuestion, DifficultyLevel } from "../shared";

type Generate = (tool: string, level: DifficultyLevel, variables: Record<string, boolean>, dropdown: string, multiSelect?: Record<string, boolean>) => AnyQuestion;
const LOADERS: Record<string, () => Promise<{ __test: { generateQuestion: Generate } }>> = {
  estimation: () => import("../tools/Number/Estimation"),
};

export const loadGenerator = async (tool: string): Promise<Generate | null> => {
  const load = LOADERS[tool];
  return load ? (await load()).__test.generateQuestion : null;
};
