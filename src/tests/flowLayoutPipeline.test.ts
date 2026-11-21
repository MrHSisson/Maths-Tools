// Diagram layout, part 3 of 4: see flowLayoutKit.ts (the check) — split over files so a run can use several cores.
import { layoutSuite } from "./flowLayoutKit";

layoutSuite("pipeline9", (all) => all.filter((t) => t.id === "pipeline9"));
