import type { ShellOption, ShellWhen } from "./types";

/** Whether a group belongs to this sub-tool and level, before its conditional course/practice filters. */
export function offeredAt(o: ShellOption, level: number, sub: string): boolean {
  return (o.top || !o.forSubTools || o.forSubTools.includes(sub)) && (!o.forLevels || o.forLevels.includes(level))
    && (!o.forSubToolLevels?.[sub] || o.forSubToolLevels[sub].includes(level));
}

/** The choices a level actually offers, used by controls, guides and generator validation. */
export function levelOption(o: ShellOption, level: number): ShellOption {
  return { ...o, choices: o.choices.filter(c => !c.forLevels || c.forLevels.includes(level)) };
}

/** Does this `when`-style condition hold for these option values? A multi option holds when ANY of its ticks is listed. */
export function holds(w: ShellWhen | ShellWhen[] | undefined, values: Record<string, string>): boolean {
  return !w || (Array.isArray(w) ? w : [w]).every(c => (values[c.key] ?? "").split(",").some(x => c.values.includes(x)));
}

export function optionValue(o: ShellOption, value: string | undefined, level: number, sub: string): string {
  const choices = levelOption(o, level).choices;
  const valid = (raw: string) => raw.split(",").filter(v => choices.some(c => c.value === v));
  const defaults = valid(o.defaultFor?.(level, sub) ?? "");
  const selected = valid(value ?? "");
  return (selected.length ? selected : defaults.length ? defaults : choices.slice(0, 1).map(c => c.value)).slice(0, o.multi ? undefined : 1).join(",");
}

/** Only top-level course/practice selectors are shared; settings belong to one sub-tool and level. */
export function profileOptions(groups: ShellOption[], base: Record<string, string>, saved: Record<string, string> | undefined, level: number, sub: string): Record<string, string> {
  return Object.fromEntries(groups.map(o => [o.key, optionValue(o, o.top || o.shared ? base[o.key] : saved?.[o.key], level, sub)]));
}

/** Canonical generation boundary, including rebuilt saved questions and old links. */
export function resolvedOptions(groups: ShellOption[], provided: Record<string, string>, level: number, sub: string): Record<string, string> {
  const values = Object.fromEntries(groups.map(o => [o.key, optionValue(o, provided[o.key], level, sub)]));
  // a choice that is switched off by another option (`disabledWhen`: A2 questions left out…) is never drawn from: its tick is dropped, and a pool that would be empty falls back to its first choice still on
  const live = (o: ShellOption) => {
    const on = levelOption(o, level).choices.filter(c => !c.disabledWhen || !holds(c.disabledWhen, values)).map(c => c.value);
    const kept = values[o.key].split(",").filter(v => on.includes(v));
    if (kept.length) return kept.join(",");
    const fallback = optionValue(o, undefined, level, sub).split(",").filter(v => on.includes(v));
    return (fallback.length ? fallback : on.slice(0, 1)).join(",") || values[o.key];
  };
  return Object.fromEntries(groups.filter(o => offeredAt(o, level, sub) && levelOption(o, level).choices.length > 0 && holds(o.when, values)).map(o => [o.key, o.choices.some(c => c.disabledWhen) ? live(o) : values[o.key]]));
}

/** Exam-part practice links keep their requested task, moving to a compatible level if necessary. */
export function levelForOptions(groups: ShellOption[], requested: Record<string, string>, preferred: number, max: number, sub: string): number {
  const current = Math.max(1, Math.min(preferred, max));
  const accepts = (level: number) => groups.filter(o => requested[o.key] !== undefined && (!o.forSubTools || o.forSubTools.includes(sub))).every(o =>
    offeredAt(o, level, sub) && requested[o.key].split(",").every(v => levelOption(o, level).choices.some(c => c.value === v)));
  return [current, ...Array.from({ length: max }, (_, i) => i + 1)].find(accepts) ?? current;
}
