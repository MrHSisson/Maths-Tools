import { SpecLanding, type SpecChapter } from "../../shared/components/SpecLanding";
import { ALL_TOOLS } from "../../registry";
import { DECISION_CHAPTERS, DECISION_GENERAL_RESOURCES, DECISION_OUT_OF_SPEC, DECISION_CHECK_NOTES } from "./decisionSpec";

// Decision Maths: the landing page for the AQA 7367 Discrete option (DA–DG). The look and behaviour are the shared
// SpecLanding page; the tools listed under each chapter are read from the registry, so whether each is live is never typed here.
// Developing-tools only (registry `enabled: false`, and the page asks for the password).

const chapters: SpecChapter[] = DECISION_CHAPTERS.map(({ toolIds, ...c }) => ({
  ...c,
  tools: toolIds.flatMap(id => {
    const t = ALL_TOOLS.find(x => x.id === id);
    return t ? [{ name: t.name, path: t.path, live: t.enabled !== false }] : [];
  }),
}));

export default function DecisionOverview() {
  return (
    <SpecLanding
      title="Decision Maths"
      subtitle="AQA A-level Further Mathematics (Discrete)"
      about="The Discrete option of AQA 7367 (sections DA to DG), planned chapter by chapter. Each chapter lists the specification statements, which are in AS and which are A2 only, the older AQA D1 and D2 content they draw on, and the tools built so far."
      chapters={chapters}
      generalResources={DECISION_GENERAL_RESOURCES}
      papers={{ heading: "Older papers and question banks", intro: "The legacy course was two modules, D1 and D2, with a much deeper bank than the current spec.", cardText: "AQA D1 and D2 papers, what is no longer in the spec, and the checked legacy map" }}
      check={DECISION_CHECK_NOTES}
      outOfSpec={{ heading: "Not in the current spec", items: DECISION_OUT_OF_SPEC }}
    />
  );
}
