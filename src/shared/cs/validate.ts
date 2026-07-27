// ─────────────────────────────────────────────────────────────────────────────
// CSTopic validator — the CS analog of the maths generator smoke test. It walks a
// topic's data and returns a list of authoring mistakes (empty = valid). Wired into
// the vitest suite (src/tests/cs-topics.test.ts) so authoring-as-data is safe: a bad
// spec tag, an out-of-range MCQ answer, a cloze slot with no matching word, a
// duplicate myth id, an unanswered predict beat or a lesson with no backing scene
// all fail at CI instead of shipping. See CS_SHELL_PLAN.md ("CI: a CSTopic validator").
// ─────────────────────────────────────────────────────────────────────────────

import type { CSTopic } from "./types";

// All slot tokens inside a cloze `text` — [word] marks a gap.
const clozeSlots = (text: string): string[] =>
  [...text.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]);

/**
 * Validate a single CSTopic. Returns a list of human-readable problems; an empty
 * array means the topic is well-formed. Each message is prefixed with the topic id
 * so failures over a whole suite point at the offending topic.
 */
export function validateTopic(topic: CSTopic): string[] {
  const errs: string[] = [];
  const at = (msg: string) => errs.push(`[${topic.id}] ${msg}`);

  const declaredTags = new Set(Object.keys(topic.specTags));
  const knownTag = (tag: string) => declaredTags.has(tag);

  // 1. Every card / exam / cloze specTag must be declared in specTags.
  for (const c of topic.cards)
    if (!knownTag(c.specTag)) at(`card ${c.id} has specTag "${c.specTag}" not declared in specTags`);
  for (const q of topic.exam)
    if (!knownTag(q.specTag)) at(`exam ${q.id} has specTag "${q.specTag}" not declared in specTags`);
  for (const cl of topic.cloze)
    if (!knownTag(cl.specTag)) at(`cloze ${cl.id} has specTag "${cl.specTag}" not declared in specTags`);

  // 2. MCQ questions: options present and answerIndex in range.
  for (const q of topic.exam) {
    if (q.format !== "mcq") continue;
    if (!q.options || q.options.length < 2) { at(`exam ${q.id} is an mcq but has no options`); continue; }
    if (q.answerIndex === undefined) { at(`exam ${q.id} is an mcq but has no answerIndex`); continue; }
    if (q.answerIndex < 0 || q.answerIndex >= q.options.length)
      at(`exam ${q.id} answerIndex ${q.answerIndex} is out of range (0..${q.options.length - 1})`);
  }

  // 3. Each cloze [slot] must have a matching word in the `words` pool.
  for (const cl of topic.cloze) {
    const pool = new Set(cl.words);
    const slots = clozeSlots(cl.text);
    if (slots.length === 0) at(`cloze ${cl.id} ("${cl.title}") has no [slots]`);
    for (const s of slots)
      if (!pool.has(s)) at(`cloze ${cl.id} ("${cl.title}") slot "${s}" is not in its word pool`);
  }

  // 4. Myth ids must be unique.
  const mythSeen = new Set<number>();
  for (const m of topic.myths) {
    if (mythSeen.has(m.id)) at(`duplicate myth id ${m.id}`);
    mythSeen.add(m.id);
  }
  // (cheap bonus: card / exam / cloze ids unique too — same class of authoring slip.)
  const dupCheck = <T>(items: T[], id: (x: T) => string | number, kind: string) => {
    const seen = new Set<string | number>();
    for (const it of items) {
      const k = id(it);
      if (seen.has(k)) at(`duplicate ${kind} id ${k}`);
      seen.add(k);
    }
  };
  dupCheck(topic.cards, (c) => c.id, "card");
  dupCheck(topic.exam, (q) => q.id, "exam");
  dupCheck(topic.cloze, (cl) => cl.id, "cloze");

  // 5. Predict lesson steps must carry both a `predict` question and answer `text`.
  for (const l of topic.lessons)
    l.steps.forEach((st, i) => {
      if (st.predict !== undefined && !st.text?.trim())
        at(`lesson "${l.id}" step ${i + 1} has a predict question but no answer text`);
    });

  // 6. Every lesson's kind must map to a provided scene:
  //    - trace   → scenes.trace must exist;
  //    - diagram → must resolve a schematic (its named scenes.schematics[scene], or
  //                the topic default scenes.schematic if no `scene` is named);
  //    - text    → deliberately diagram-free, no scene required.
  //    Also: any named `scene` must resolve (catches typos), whatever the kind.
  for (const l of topic.lessons) {
    const kind = l.kind ?? "diagram";
    const named = l.scene !== undefined ? topic.scenes.schematics?.[l.scene] : undefined;
    if (l.scene !== undefined && !named)
      at(`lesson "${l.id}" names scene "${l.scene}" which is not in scenes.schematics`);
    if (kind === "trace" && !topic.scenes.trace)
      at(`lesson "${l.id}" is a trace lesson but the topic provides no scenes.trace`);
    if (kind === "diagram") {
      const resolved = l.scene !== undefined ? named : topic.scenes.schematic;
      if (!resolved)
        at(`lesson "${l.id}" is a diagram lesson but resolves no schematic ` +
           `(no scenes.schematic default${l.scene !== undefined ? ` and scene "${l.scene}" is undefined` : ""}; mark it kind:"text" if it is meant to have no diagram)`);
    }
  }

  // 7. Synoptic questions: validate the per-tag markScheme attribution (NOT the
  //    top-level `specTags`, which may name bare sub-topic ids like "1.1.1" that are
  //    not requirement keys — see CS_SHELL_PLAN.md caveat). Each attributed tag must
  //    be declared, and each entry must carry at least one mark point.
  for (const sq of topic.synoptic)
    for (const entry of sq.markScheme) {
      if (!knownTag(entry.tag))
        at(`synoptic ${sq.id} attributes marks to tag "${entry.tag}" not declared in specTags`);
      if (!entry.points || entry.points.length === 0)
        at(`synoptic ${sq.id} has a markScheme entry for "${entry.tag}" with no points`);
    }

  return errs;
}
