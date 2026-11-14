import { SpecLanding, type SpecChapter, type SpecLink } from "../../shared/components/SpecLanding";
import { ALL_TOOLS } from "../../registry";
import { DECISION_CHAPTERS, DECISION_GENERAL_RESOURCES, DECISION_OUT_OF_SPEC, DECISION_CHECK_NOTES, DECISION_PAIRINGS, DECISION_GROUPS, DECISION_EXAM, type SubToolRef } from "./decisionSpec";

// Decision Maths: the hub for the AQA 7367 Discrete option (DA–DG), and where every Decision tool is opened from (the landing page shows this
// one card for the strand). The look and behaviour are the shared SpecLanding page; the tools listed under each chapter are read from the
// registry, so whether each is live is never typed here. Open to everyone with the live generators; the planning material (legacy D1 and D2
// links, notes, question banks, tools still in development) is Developing-tools mode only.

/** a sub-tool as a link that opens its tool on that sub-tool, with the course and kind of practice that show it */
const linkOf = (r: SubToolRef): SpecLink[] => {
  const t = ALL_TOOLS.find(x => x.id === r.tool);
  return t ? [{ label: r.label.replace(/\s*\*$/, ""), href: `${t.path}?tool=${r.sub}&o_course=${r.course}&o_practice=${r.practice}`, live: t.enabled !== false, as: r.as }] : [];
};

const chapters: SpecChapter[] = DECISION_CHAPTERS.map(({ toolIds, ...c }) => ({
  ...c,
  statements: c.statements.map(s => ({ ...s, links: (DECISION_PAIRINGS[s.ref] ?? []).flatMap(linkOf) })),
  groups: (DECISION_GROUPS[c.id] ?? []).map(g => ({ heading: g.heading, devOnly: g.devOnly, links: g.links.flatMap(linkOf) })),
  exam: DECISION_EXAM[c.id] ? (l => l[0] ? { text: DECISION_EXAM[c.id].text, link: l[0] } : undefined)(linkOf(DECISION_EXAM[c.id].ref)) : undefined,
  tools: toolIds.flatMap(id => {
    const t = ALL_TOOLS.find(x => x.id === id);
    return t ? [{ name: t.name, path: t.path, live: t.enabled !== false }] : [];
  }),
}));

export default function DecisionOverview() {
  return (
    <SpecLanding
      public
      title="Decision Maths"
      subtitle="AQA A-level Further Mathematics (Discrete)"
      about="The Discrete option of AQA 7367, sections DA to DG. Open a part of the specification to find its question generators and the specification statements it covers, with which are in AS and which are A2 only. In Developing-tools mode each statement also shows the older AQA D1 and D2 content it draws on."
      chapters={chapters}
      generalResources={DECISION_GENERAL_RESOURCES}
      papers={{ heading: "Older papers and question banks", intro: "The legacy course was two modules, D1 and D2, with a much deeper bank than the current spec.", cardText: "AQA D1 and D2 papers, what is no longer in the spec, and the checked legacy map" }}
      check={DECISION_CHECK_NOTES}
      outOfSpec={{ heading: "Not in the current spec", items: DECISION_OUT_OF_SPEC }}
    />
  );
}
