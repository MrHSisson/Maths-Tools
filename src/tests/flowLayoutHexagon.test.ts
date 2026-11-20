// Diagram layout, part 2 of 4: see flowLayoutKit.ts (the check) — split over files so a run can use several cores.
import { layoutSuite } from "./flowLayoutKit";

layoutSuite("hexagon", (all) => all.filter((t) => t.id === "hexagon"));
