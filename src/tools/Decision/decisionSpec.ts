// AQA Further Mathematics Discrete / Decision (DA–DG): the specification as data, for the Decision Maths space.
// Source of truth for the wording and the AS column: specs/exam/spec/aqa-discrete.md (AQA 7367 v1.1 and AS 7366 v1.2).
// This file adds the link back to the two legacy AQA modules (D1 and D2), the tools built for each chapter and the
// question banks found for it. The legacy mapping comes from the topics the AQA D1 and D2 papers actually use.

import type { SpecChapter, SpecResource, SpecStatement } from "../../shared/components/SpecLanding";

// ── Which generator sub-tools address which statement ───────────────────────────────────────────────────────────────────
// A sub-tool is named by its tool (a registry id), its key in that tool and the course and kind of practice that show it (Critical Path's
// course and practice switches). `label` is the name the tool gives it, so a test can check it still matches. `as` is whether it is part
// of the AS course (an A-level-only sub-tool is `as: false`). The hub turns each into a link that opens the tool on that sub-tool.
export interface SubToolRef { tool: string; sub: string; label: string; course: "as" | "a"; practice: "skills" | "exam"; as: boolean }
const cpa = (sub: string, label: string, course: "as" | "a", practice: "skills" | "exam" = "skills"): SubToolRef =>
  ({ tool: "critical-path", sub, label, course, practice, as: course === "as" });

const P = "https://pmt.physicsandmathstutor.com/download/Maths/A-level/";
const enc = (path: string) => P + path.split("/").map(encodeURIComponent).join("/");
const aqa = (mod: "D1" | "D2", name: string): SpecResource => ({ label: name, from: "AQA legacy", url: enc(`${mod}/Topic-Qs/AQA/${name}.pdf`) });
const edx = (mod: "D1" | "D2", name: string): SpecResource => ({ label: name, from: "Edexcel legacy", url: enc(`${mod}/Topic-Qs/Edexcel-Set-1/${name}.pdf`) });

/** One statement. `as` is whether it is in the AS spec; `legacy` is the module(s) the content came from. */
const st = (ref: string, text: string, as: boolean, legacy: string[], status: SpecStatement["status"], note?: string): SpecStatement =>
  ({ ref, text, as, legacy, status, ...(note ? { note } : {}) });

interface DecisionChapter extends Omit<SpecChapter, "tools"> {
  /** registry ids of the tools built for this chapter */
  toolIds: string[];
}

export const DECISION_CHAPTERS: DecisionChapter[] = [
  {
    id: "DA", name: "Graphs", toolIds: [], resources: [],
    statements: [
      st("DA1", "Understand and use the language of graphs including: vertex, edge, trail, cycle, connected, degree, subgraph, subdivision, multiple edge and loop.", true, ["D1"], "supported", "Graph vocabulary runs through the D1 papers."),
      st("DA2", "Identify or prove properties of a graph including that a graph is Eulerian, semi-Eulerian or Hamiltonian.", true, ["D1"], "supported", "Eulerian and Hamiltonian graphs appear in D1, alongside route inspection and the travelling salesperson."),
      st("DA3", "Understand and use Euler’s formula for connected planar graphs.", true, [], "unverified", "Planar graphs and Euler's formula were not found in the AQA D1 or D2 papers."),
      st("DA4", "Use Kuratowski’s Theorem to determine the planarity of graphs.", false, [], "unverified", "Not found in D1 or D2."),
      st("DA5", "Understand and use complete graphs and bipartite graphs, including adjacency matrices and the complement of a graph.", true, ["D1"], "supported", "Complete and bipartite graphs and adjacency matrices are in D1. The complement of a graph was not seen."),
      st("DA6", "Understand and use simple graphs, simple-connected graphs and trees.", true, ["D1"], "supported"),
      st("DA7", "Recognise and find isomorphism between graphs.", false, [], "unverified", "Not found in D1 or D2."),
    ],
  },
  {
    id: "DB", name: "Networks", toolIds: ["minimum-spanning-tree", "route-inspection", "travelling-salesperson"],
    resources: [
      aqa("D1", "D1 Minimum Spanning Tree"), aqa("D1", "D1 Route Inspection"), aqa("D1", "D1 Travelling Salesman"),
      edx("D1", "D1 Minimum connectors - Kruskal's"), edx("D1", "D1 Minimum connectors - Prim's"), edx("D1", "D1 Route inspection"), edx("D2", "D2 Travelling salesman problems"),
    ],
    statements: [
      st("DB1", "Understand and use the language of networks including: node, arc and weight.", true, ["D1"], "supported"),
      st("DB2", "Solve network optimisation problems using spanning trees.", true, ["D1"], "supported", "Kruskal's and Prim's are the most common D1 topic."),
      st("DB3", "Solve route inspection problems.", true, ["D1"], "supported"),
      st("DB4", "Find and interpret upper bounds and lower bounds for the travelling salesperson problem.", true, ["D1"], "supported", "Upper and lower bounds are in D1's travelling salesman questions."),
      st("DB5", "Evaluate, modify and refine models which use networks.", true, [], "unverified", "This is a skill that runs through the chapter, not a topic with its own legacy questions."),
    ],
  },
  {
    id: "DC", name: "Network flows", toolIds: ["network-flows"],
    resources: [aqa("D2", "D2 Network Flows"), aqa("D2", "D2 Network Flows MS"), edx("D2", "D2 Network Flow")],
    statements: [
      st("DC1", "Interpret flow problems represented by a network of directed arcs.", true, ["D2"], "supported"),
      st("DC2", "Find the value of a cut and understand its meaning.", true, ["D2"], "supported"),
      st("DC3", "Use and interpret the maximum flow-minimum cut theorem.", true, ["D2"], "supported"),
      st("DC4", "Introduce supersources and supersinks to a network.", true, ["D2"], "supported", "A few D2 questions use them."),
      st("DC5", "Augment flows and determine the maximum flow in a network", false, ["D2"], "supported", "Core to the legacy D2 network flows questions, but A2 only in this spec."),
      st("DC6", "Solve problems involving arcs with upper and lower capacities.", false, [], "unverified", "No questions with upper and lower capacities were found in the AQA D2 papers."),
      st("DC7", "Refine network flow problems including using nodes of restricted capacity.", false, [], "unverified", "No restricted-capacity nodes were found in the AQA D2 papers."),
    ],
  },
  {
    id: "DD", name: "Linear programming", toolIds: [],
    resources: [
      aqa("D1", "D1 Linear Programming"), aqa("D2", "D2 Simplex Algorithm"), aqa("D2", "D2 Simplex Algorithm MS"),
      edx("D1", "D1 Linear programming - Formation of problems"), edx("D1", "D1 Linear programming - Graphical"),
      edx("D2", "D2 Linear programming - Formation of problems"), edx("D2", "D2 Linear programming - Simplex algorithm"),
    ],
    statements: [
      st("DD1", "Formulate constrained optimisation problems.", true, ["D1", "D2"], "supported"),
      st("DD2", "Solve constrained optimisation problems via graphical methods.", true, ["D1"], "supported", "Graphical solutions are D1; many questions in the papers use a feasible region."),
      st("DD3", "Use the Simplex algorithm for optimising (maximising and minimising) an objective function including the use of slack variables.", false, ["D2"], "supported"),
      st("DD4", "Interpret a Simplex tableau.", false, ["D2"], "supported"),
    ],
  },
  {
    id: "DE", name: "Critical path analysis", toolIds: ["critical-path"],
    resources: [aqa("D2", "D2 Critical Path Analysis"), aqa("D2", "D2 Critical Path Analysis MS"), edx("D1", "D1 Critical Path Analysis")],
    statements: [
      st("DE1", "Construct, represent and interpret a precedence (activity) network using activity-on-node.", true, ["D2"], "supported", "The legacy papers' networks are drawn, so whether they are activity-on-arc or activity-on-node could not be read from the text. Check when converting a question."),
      st("DE2", "Determine earliest and latest start and finish times for an activity network.", true, ["D2"], "supported"),
      st("DE3", "Identify critical activities, critical paths and the float of non-critical activities.", true, ["D2"], "supported"),
      st("DE4", "Refine models and understand the implications of possible changes in the context of critical path analysis.", true, [], "unverified", "A skill within the chapter rather than a topic of its own."),
      st("DE5", "Construct and interpret Gantt (cascade) diagrams and resource histograms.", false, ["D2"], "supported", "Cascade diagrams and resource histograms are in the D2 papers."),
      st("DE6", "Carry out resource levelling (using heuristic procedures) and solve problems where resources are restricted.", false, ["D2"], "supported", "Resource levelling is in D2. Whether the heuristic wording matches was not checked."),
    ],
  },
  {
    id: "DF", name: "Game theory", toolIds: ["mixed-strategies"],
    resources: [aqa("D2", "D2 Game Theory"), aqa("D2", "D2 Game Theory MS"), edx("D2", "D2 Game Theory")],
    statements: [
      st("DF1", "Understand, interpret and construct pay-off matrices.", true, ["D2"], "supported"),
      st("DF2", "Find play-safe strategies and the value of the game.", true, ["D2"], "supported"),
      st("DF3", "Prove the existence or non-existence of a stable solution.", true, ["D2"], "supported"),
      st("DF4", "Identify and make use of dominated strategies.", true, [], "unverified", "No dominated-strategy questions were found in the AQA D2 papers."),
      st("DF5", "Find optimal mixed strategies for a game including use of graphical methods.", true, ["D2"], "supported", "Mixed strategies are in D2. Whether the legacy questions use the graphical method was not checked."),
      st("DF6", "Convert and solve higher order games to linear programming problems.", false, [], "unverified", "No game-to-linear-programming questions were found. New in this spec."),
    ],
  },
  {
    id: "DG", name: "Binary operations", toolIds: [], resources: [],
    statements: [
      st("DG1", "Understand and use binary operations including use of modular arithmetic and matrix multiplication.", true, [], "unverified", "Binary operations and groups are not in D1 or D2. Nothing was found in either."),
      st("DG2", "Understand, use and prove the commutativity of a binary operation.", true, [], "unverified"),
      st("DG3", "Understand, use and prove the associativity of a binary operation.", true, [], "unverified"),
      st("DG4", "Construct a Cayley table for a given set under a given binary operation.", true, [], "unverified"),
      st("DG5", "Understand and prove the existence of an identity element for a given set under a given binary operation.", true, [], "unverified"),
      st("DG6", "Find the inverse of an element belonging to a given set under a given binary operation.", true, [], "unverified"),
      st("DG7", "Understand and use the language of groups including: order, period, subgroup, proper, trivial, non-trivial.", false, [], "unverified"),
      st("DG8", "Understand and use the group axioms: closure, identity, inverses and associativity, including use of Cayley tables.", false, [], "unverified"),
      st("DG9", "Recognise and use finite and infinite groups and their subgroups, including: groups of symmetries of regular polygons, cyclic groups and abelian groups.", false, [], "unverified"),
      st("DG10", "Understand and use Lagrange’s theorem.", false, [], "unverified"),
      st("DG11", "Identify and use the generators of a group.", false, [], "unverified"),
      st("DG12", "Recognise and find isomorphism between groups of finite order.", false, [], "unverified"),
    ],
  },
];

/** Whole-qualification resources, not tied to one chapter. */
export const DECISION_GENERAL_RESOURCES: SpecResource[] = [
  { label: "AQA D1 past papers, combined", from: "AQA legacy", url: enc("D1/Papers-AQA/Combined QP - D1 AQA.pdf") },
  { label: "AQA D2 past papers, combined", from: "AQA legacy", url: enc("D2/Papers-AQA/Combined QP - D2 AQA.pdf") },
  { label: "PMT: D1 by topic", from: "Other", url: "https://www.physicsandmathstutor.com/a-level-maths-papers/d1-by-topic/" },
  { label: "PMT: D2 by topic", from: "Other", url: "https://www.physicsandmathstutor.com/a-level-maths-papers/d2-by-topic/" },
  { label: "PMT: Decision 1 revision", from: "Other", url: "https://www.physicsandmathstutor.com/maths-revision/a-level-decision-1/" },
  { label: "PMT: Decision 2 revision", from: "Other", url: "https://www.physicsandmathstutor.com/maths-revision/a-level-decision-2/" },
];

/** Legacy D1 / D2 topics that the current spec does not ask for: skip these when practising from the old papers. */
export const DECISION_OUT_OF_SPEC = [
  { name: "Sorting algorithms and bin packing", legacy: "D1", note: "The 'Algorithms' packs." },
  { name: "Shortest path (Dijkstra)", legacy: "D1", note: "Planned as an extra for the Decision tools, but not an AQA 7367 statement." },
  { name: "Matchings", legacy: "D1", note: "Bipartite graphs are in DA5; matching is not." },
  { name: "Allocation (the Hungarian algorithm)", legacy: "D2" },
  { name: "Dynamic programming", legacy: "D2" },
];

/** What the legacy check found, in plain words. Dated, because the evidence is what was on PMT that day. */
export const DECISION_CHECK_NOTES = {
  date: "2026-11-07",
  method: "Read the AQA legacy D1 and D2 combined past papers on PMT and counted the topic words their questions use (keyword counts, not a question-by-question read), opened PMT's D1 and D2 topic pages for the AQA and Edexcel packs, and opened every link here.",
  findings: [
    "The old course is two modules. D1 holds graphs, minimum spanning trees, route inspection, the travelling salesperson bounds and graphical linear programming. D2 holds simplex, critical path analysis with cascade diagrams and resource histograms, network flows and game theory.",
    "Not found in D1 or D2: planar graphs, Euler's formula and Kuratowski (DA3, DA4), graph isomorphism (DA7), dominated strategies (DF4), converting a game to a linear programme (DF6), arcs with upper and lower capacities and restricted nodes (DC6, DC7), and the whole of binary operations and groups (DG). These are new to the 7367 course, so there are no old AQA questions to draw from.",
    "D1 and D2 also hold content the spec no longer asks for: sorting and bin packing, Dijkstra, matchings, allocation and dynamic programming (listed under 'Not in the current spec').",
    "Content that was core in D2 (network flow augmentation, simplex, Gantt diagrams, resource levelling) is A2 only in this spec, so an AS class should be set only the statements marked AS.",
    "The AQA D1 and D2 combined papers and topic packs are the best bank; PMT's other packs for these modules are Edexcel and are labelled that way.",
    "PMT has no AQA Discrete (current spec) cheat sheets at the address that works for the mechanics ones, so none are linked.",
  ],
};

/** The sub-tools that address each statement (by statement ref). Each sub-tool is listed under one statement only. */
export const DECISION_PAIRINGS: Record<string, SubToolRef[]> = {
  DE1: [cpa("network", "Network from a table", "as"), cpa("table", "Table from a network", "as")],
  // DE2 asks for earliest and latest times: Forward pass is the earliest, Backward pass the latest (Missing time uses both)
  DE2: [cpa("forward", "Forward pass", "as"), cpa("backward", "Backward pass", "as"), cpa("unknown", "Missing time", "as")],
  // Full analysis does both passes and then finds the critical path, which is DE3
  DE3: [cpa("full", "Full analysis", "as"), cpa("floatPaths", "Float and critical paths", "as")],
  DE4: [cpa("change", "Delays and changes", "as"), cpa("reason", "Explain and justify", "as"), cpa("shorten", "Which to shorten", "a"), cpa("reasonA", "Limits of the model", "a")],
  DE5: [cpa("cascade", "Cascade/Gantt chart", "a"), cpa("histogram", "Resource histogram", "a")],
  DE6: [cpa("level", "Resource levelling", "a")],
};

/** Sub-tools that belong to a chapter but to no single statement: exam-style questions span several, and some come from the older papers only. */
export const DECISION_GROUPS: Record<string, { heading: string; links: SubToolRef[]; devOnly?: boolean }[]> = {
  DE: [
    {
      // the public page offers the one mixed exam question (DECISION_EXAM); these particular kinds stay in the tool and in Developing-tools mode
      heading: "Particular kinds of exam question",
      devOnly: true,
      links: [
        cpa("exAsAny", "Any AS exam question", "as", "exam"), cpa("exBuild", "Network, then a change or a claim", "as", "exam"), cpa("exClaim", "Times and Glyn's claim", "as", "exam"),
        cpa("exChange", "Effect of a change", "as", "exam"), cpa("exClock", "Clock times and a second project", "as", "exam"),
        cpa("exCascade", "Times and a cascade/Gantt chart", "a", "exam"), cpa("exTable", "Table, histogram and levelling", "a", "exam"),
        cpa("exHist", "Histogram and levelling", "a", "exam"), cpa("exShorten", "Which to shorten and a limitation", "a", "exam"),
      ],
    },
    { heading: "From the older papers only (not in the current specification)", devOnly: true, links: [cpa("alloc", "Worker allocation *", "a"), cpa("exAlloc", "Levelling and worker allocation *", "a", "exam")] },
  ],
};

/** A chapter's exam-style practice: the one mixed generator its page opens from the exam card (placed nowhere else, like every sub-tool). */
export const DECISION_EXAM: Record<string, { text: string; ref: SubToolRef }> = {
  DE: { text: "Multi-part questions in the style of the paper, mixing everything in the chapter: build the network, find the times, then a change or a claim.", ref: cpa("exAlAny", "Any A-level exam question", "a", "exam") },
};
