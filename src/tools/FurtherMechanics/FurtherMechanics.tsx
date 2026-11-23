import { SpecLanding, type SpecChapter, type SpecLink } from "../../shared/components/SpecLanding";
import { ALL_TOOLS } from "../../registry";
import { MC_NOTICE } from "./mcNotice";
import { CHAPTERS, GENERAL_RESOURCES, CHECK_NOTES, MECHANICS_TOOLS, MECHANICS_PAIRINGS, MECHANICS_PLANNED, MECHANICS_GROUPS, MECHANICS_EXAM, type MechSubRef } from "./mechanicsSpec";

// Further Mechanics: the landing page for the AQA 7367 mechanics option (MA–ME). The look and behaviour are the shared
// SpecLanding page (the same as Decision Maths); this file supplies the words and reads each chapter's tools from the registry,
// so whether one is live is never typed here. Open to everyone (`public`), as Decision Maths is: the live generators first, then the statements; the planning
// material (legacy papers, notes, tools still in development) stays in Developing-tools mode.

/** a sub-tool as a link that opens its tool on that sub-tool (and kind of practice, for a tool that has the switch) */
const linkOf = (r: MechSubRef): SpecLink[] => {
  const t = ALL_TOOLS.find((x) => x.id === r.tool);
  return t ? [{ label: r.label, href: `${t.path}?tool=${r.sub}${r.practice ? `&o_practice=${r.practice}` : ""}`, live: t.enabled !== false, as: !r.a2 }] : [];
};

const chapters: SpecChapter[] = CHAPTERS.map((c) => ({
  ...c,
  notice: c.id === "MC" ? MC_NOTICE : undefined,
  statements: c.statements.map((s) => ({
    ...s,
    links: [
      ...(s.links ?? []), ...(MECHANICS_PAIRINGS[s.ref] ?? []).flatMap(linkOf),
      // sub-tools still to be built: greyed out, so a teacher can see what is coming
      ...(MECHANICS_PLANNED[s.ref] ?? []).map((p): SpecLink => ({ label: p.label, href: "", live: false, as: !p.a2, provisional: true })),
    ],
  })),
  tools: [...c.tools, ...(MECHANICS_TOOLS[c.id] ?? []).flatMap((id) => {
    const t = ALL_TOOLS.find((x) => x.id === id);
    return t ? [{ name: t.name, path: t.path, live: t.enabled !== false }] : [];
  })],
  groups: (MECHANICS_GROUPS[c.id] ?? []).filter((g) => !g.hidden).map((g) => ({ heading: g.heading, devOnly: g.devOnly, links: g.links.flatMap(linkOf) })),
  exam: MECHANICS_EXAM[c.id] ? (l => (l[0] ? { text: MECHANICS_EXAM[c.id].text, link: l[0] } : undefined))(linkOf(MECHANICS_EXAM[c.id].ref)) : undefined,
}));

// revision tools that belong to the whole option, not to one chapter: listed under the chapters on the hub (a visitor sees only the live ones)
const REVISION = ["further-maths-flashcards"].flatMap((id) => {
  const t = ALL_TOOLS.find((x) => x.id === id);
  return t ? [{ name: t.name, path: t.path, live: t.enabled !== false }] : [];
});

export default function FurtherMechanics() {
  return (
    <SpecLanding
      public
      title="Further Mechanics"
      subtitle="AQA A-level Further Mathematics"
      about="The mechanics option of AQA 7367 (sections MA to ME), planned chapter by chapter. Each chapter lists the whole course's specification statements, with anything beyond AS marked A2. Open a chapter to find its question generators and exam-style questions; Dimensional Analysis (MA) is the first built."
      chapters={chapters}
      generalResources={GENERAL_RESOURCES}
      papers={{ heading: "Older papers and question banks", intro: "The legacy AQA mechanics papers have a much deeper bank than the current spec.", cardText: "AQA M1–M3 papers and the checked legacy map" }}
      check={CHECK_NOTES}
      workspace={{ heading: "Revision", tools: REVISION }}
    />
  );
}
