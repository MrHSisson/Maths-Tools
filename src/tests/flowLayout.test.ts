// Diagram layout, part 1 of 4: see flowLayoutKit.ts (the check) — split over files so a run can use several cores.
import { layoutSuite } from "./flowLayoutKit";

layoutSuite("the standard and two-source templates", (all) => all.filter((t) => !["hexagon", "pipeline9", "ladder10", "hub9"].includes(t.id)));
