// Diagram layout, part 4 of 4: see flowLayoutKit.ts (the check) — split over files so a run can use several cores.
import { layoutSuite } from "./flowLayoutKit";

layoutSuite("ladder10 and hub9", (all) => all.filter((t) => ["ladder10", "hub9"].includes(t.id)));
