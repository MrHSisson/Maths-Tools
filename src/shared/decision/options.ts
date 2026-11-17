import type { ShellOption } from "./types";

/** Whether a group belongs to this sub-tool and level, before its conditional course/practice filters. */
export function offeredAt(o: ShellOption, level: number, sub: string): boolean {
  return (o.top || !o.forSubTools || o.forSubTools.includes(sub)) && (!o.forLevels || o.forLevels.includes(level))
    && (!o.forSubToolLevels?.[sub] || o.forSubToolLevels[sub].includes(level));
}

/** The choices a level actually offers, used by controls, guides and generator validation. */
export function levelOption(o: ShellOption, level: number): ShellOption {
  return { ...o, choices: o.choices.filter(c => !c.forLevels || c.forLevels.includes(level)) };
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
  return Object.fromEntries(groups.map(o => [o.key, optionValue(o, o.top ? base[o.key] : saved?.[o.key], level, sub)]));
}

/** Canonical generation boundary, including rebuilt saved questions and old links. */
export function resolvedOptions(groups: ShellOption[], provided: Record<string, string>, level: number, sub: string): Record<string, string> {
  const values = Object.fromEntries(groups.map(o => [o.key, optionValue(o, provided[o.key], level, sub)]));
  return Object.fromEntries(groups.filter(o => {
    const conditions = o.when ? Array.isArray(o.when) ? o.when : [o.when] : [];
    return offeredAt(o, level, sub)
      && levelOption(o, level).choices.length > 0 && conditions.every(c => c.values.includes(values[c.key]));
  }).map(o => [o.key, values[o.key]]));
}

/** Exam-part practice links keep their requested task, moving to a compatible level if necessary. */
export function levelForOptions(groups: ShellOption[], requested: Record<string, string>, preferred: number, max: number, sub: string): number {
  const current = Math.max(1, Math.min(preferred, max));
  const accepts = (level: number) => groups.filter(o => requested[o.key] !== undefined && (!o.forSubTools || o.forSubTools.includes(sub))).every(o =>
    offeredAt(o, level, sub) && requested[o.key].split(",").every(v => levelOption(o, level).choices.some(c => c.value === v)));
  return [current, ...Array.from({ length: max }, (_, i) => i + 1)].find(accepts) ?? current;
}
