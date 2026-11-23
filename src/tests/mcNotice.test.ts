import { describe, expect, it, vi } from "vitest";
import { MC_NOTICE } from "../tools/FurtherMechanics/mcNotice";
import WorkDone from "../tools/FurtherMechanics/WorkDone";
import Energy from "../tools/FurtherMechanics/Energy";
import Power from "../tools/FurtherMechanics/Power";
import Elastic from "../tools/FurtherMechanics/Elastic";
import { ALL_TOOLS } from "../registry";

vi.mock("../devMode", () => ({ useDevMode: () => false }));

describe("the Work, Energy and Power tools are open to everyone with a 'still in development' banner", () => {
  it("each of the four tools carries the notice and is not dev-gated", () => {
    for (const [id, App] of [["work-done", WorkDone], ["energy", Energy], ["power", Power], ["elastic-strings", Elastic]] as const) {
      expect(App().props.config.devNotice, id).toBe(MC_NOTICE);
      expect(ALL_TOOLS.find((t) => t.id === id)?.enabled, id).not.toBe(false);
    }
    expect(MC_NOTICE).toMatch(/still being built/);
  });
});
