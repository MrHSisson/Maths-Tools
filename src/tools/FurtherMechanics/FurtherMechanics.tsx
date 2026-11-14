import { SpecLanding, type SpecChapter, type SpecLink } from "../../shared/components/SpecLanding";
import { ALL_TOOLS } from "../../registry";
import { CHAPTERS, GENERAL_RESOURCES, CHECK_NOTES, MECHANICS_TOOLS, MECHANICS_PAIRINGS, MECHANICS_GROUPS, MECHANICS_EXAM, type MechSubRef } from "./mechanicsSpec";

// Further Mechanics: the landing page for the AQA 7367 mechanics option (MA–ME). The look and behaviour are the shared
// SpecLanding page (the same as Decision Maths); this file supplies the words and reads each chapter's tools from the registry,
// so whether one is live is never typed here. Developing-tools only (registry `enabled: false`, and the page asks for the password).

/** a sub-tool as a link that opens its tool on that sub-tool and kind of practice (every Mechanics tool so far is AS) */
const linkOf = (r: MechSubRef): SpecLink[] => {
  const t = ALL_TOOLS.find((x) => x.id === r.tool);
  return t ? [{ label: r.label, href: `${t.path}?tool=${r.sub}&o_practice=${r.practice}`, live: t.enabled !== false, as: true }] : [];
};

const chapters: SpecChapter[] = CHAPTERS.map((c) => ({
  ...c,
  statements: c.statements.map((s) => ({ ...s, links: [...(s.links ?? []), ...(MECHANICS_PAIRINGS[s.ref] ?? []).flatMap(linkOf)] })),
  tools: [...c.tools, ...(MECHANICS_TOOLS[c.id] ?? []).flatMap((id) => {
    const t = ALL_TOOLS.find((x) => x.id === id);
    return t ? [{ name: t.name, path: t.path, live: t.enabled !== false }] : [];
  })],
  groups: (MECHANICS_GROUPS[c.id] ?? []).map((g) => ({ heading: g.heading, devOnly: g.devOnly, links: g.links.flatMap(linkOf) })),
  exam: MECHANICS_EXAM[c.id] ? (l => (l[0] ? { text: MECHANICS_EXAM[c.id].text, link: l[0] } : undefined))(linkOf(MECHANICS_EXAM[c.id].ref)) : undefined,
}));

export default function FurtherMechanics() {
  return (
    <SpecLanding
      title="Further Mechanics"
      subtitle="AQA A-level Further Mathematics"
      about="The mechanics option of AQA 7367 (sections MA to ME), planned chapter by chapter. Each chapter lists the specification statements, which are in AS and which are A2 only, and the older AQA papers they draw on. Open a chapter to find its question generators and exam-style questions; Dimensional Analysis (MA) is the first built."
      chapters={chapters}
      generalResources={GENERAL_RESOURCES}
      papers={{ heading: "Older papers and question banks", intro: "The legacy AQA mechanics papers have a much deeper bank than the current spec.", cardText: "AQA M1–M3 papers and the checked legacy map" }}
      check={CHECK_NOTES}
    />
  );
}
