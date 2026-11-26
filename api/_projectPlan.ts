export interface PlanNode {
  id: string;
  parent: string | null;
  kind: "branch" | "task";
  title: string;
  overview: string;
  done: boolean;
  pinned: boolean;
  needs: string[];
}

export interface ReviewRequest {
  item: string;
  prompt: string;
}

export interface ProjectPlan {
  revision: number;
  nodes: PlanNode[];
  reviews: ReviewRequest[];
}

export const emptyPlan: ProjectPlan = { revision: 0, nodes: [], reviews: [] };

export function makeNode(id: string, parent: string | null, title: string, kind: PlanNode["kind"], overview = ""): PlanNode {
  return { id, parent, kind, title, overview, done: false, pinned: false, needs: [] };
}

export function descendants(nodes: PlanNode[], id: string): Set<string> {
  const result = new Set([id]);
  const pending = [id];
  const children = new Map<string, string[]>();
  for (const node of nodes) {
    if (node.parent !== null) {
      const siblings = children.get(node.parent) ?? [];
      siblings.push(node.id);
      children.set(node.parent, siblings);
    }
  }
  while (pending.length) {
    for (const child of children.get(pending.pop()!) ?? []) {
      if (result.has(child)) continue;
      result.add(child);
      pending.push(child);
    }
  }
  return result;
}

function acyclic(nodes: PlanNode[], edges: (node: PlanNode) => string[]): boolean {
  const byId = new Map(nodes.map(node => [node.id, node]));
  const active = new Set<string>();
  const checked = new Set<string>();
  function visit(id: string): boolean {
    if (active.has(id)) return false;
    if (checked.has(id)) return true;
    const node = byId.get(id);
    if (!node) return false;
    active.add(id);
    const ok = edges(node).every(visit);
    active.delete(id);
    checked.add(id);
    return ok;
  }
  return nodes.every(node => visit(node.id));
}

function isText(value: unknown, max: number, required = false): value is string {
  return typeof value === "string" && value.length <= max && (!required || !!value.trim());
}

function isNode(value: unknown): value is PlanNode {
  if (!value || typeof value !== "object") return false;
  const node = value as PlanNode;
  return isText(node.id, 100, true) && (node.parent === null || isText(node.parent, 100, true))
    && (node.kind === "branch" || node.kind === "task") && isText(node.title, 120, true)
    && isText(node.overview, 500) && typeof node.done === "boolean" && typeof node.pinned === "boolean"
    && Array.isArray(node.needs) && node.needs.length <= 30 && node.needs.every(id => isText(id, 100, true))
    && new Set(node.needs).size === node.needs.length;
}

export function isProjectPlan(value: unknown): value is ProjectPlan {
  if (!value || typeof value !== "object") return false;
  const plan = value as ProjectPlan;
  if (!Number.isSafeInteger(plan.revision) || plan.revision < 0 || !Array.isArray(plan.nodes)
    || plan.nodes.length > 1500 || !plan.nodes.every(isNode) || !Array.isArray(plan.reviews)) return false;
  const ids = new Set(plan.nodes.map(node => node.id));
  if (ids.size !== plan.nodes.length || plan.reviews.length > ids.size) return false;
  const seen = new Set<string>();
  for (const review of plan.reviews) {
    if (!review || !ids.has(review.item) || seen.has(review.item) || !isText(review.prompt, 240, true)) return false;
    seen.add(review.item);
  }
  return acyclic(plan.nodes, node => node.parent === null ? [] : [node.parent])
    && acyclic(plan.nodes, node => node.needs);
}
