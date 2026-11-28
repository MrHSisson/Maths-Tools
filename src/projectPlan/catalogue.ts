import { CATEGORIES } from "../registry";
import { makeNode, type ProjectPlan } from "../../api/_projectPlan";

const hubs = new Set(CATEGORIES.flatMap(category => category.tools.flatMap(tool => tool.hub ? [tool.hub] : [])));

const toolRoutes = CATEGORIES.flatMap(category => category.tools);
export const contextualTools = toolRoutes.filter(tool => !hubs.has(tool.id));
export const routesById = new Map(toolRoutes.map(tool => [tool.id, tool.path]));

const overviews = new Map([
  ["further-mechanics", "Help teachers cover the full AQA Further Mechanics course with practice tools and exam-style questions."],
  ["work-done", "Help students see how forces do work and explain each step of their calculations."],
]);

const catalogueNodes = CATEGORIES.flatMap(category => {
  const group = makeNode(`section:${category.name}`, null, category.name, "branch");
  const tools = category.tools.map(tool => makeNode(tool.id, tool.hub ?? group.id, tool.name, "branch", overviews.get(tool.id) ?? tool.description));
  // Categories already represented by their hub can use the hub directly in the map.
  const onlyHub = tools.filter(node => node.parent === group.id);
  if (onlyHub.length === 1 && hubs.has(onlyHub[0].id)) {
    onlyHub[0].parent = null;
    return tools;
  }
  return [group, ...tools];
});

const initialNodes = [
  ...catalogueNodes,
  makeNode("project:decks", null, "Teaching decks", "branch", "Build lessons teachers can pick up and use in class."),
  makeNode("project:delivery", null, "Site and workflow", "branch", "Make changes easier to build, check and share."),
  makeNode("mechanics-exam-questions", "further-mechanics", "Exam-style questions", "branch", "Build linked question parts from past-paper examples."),
  makeNode("mechanics-print-check", "further-mechanics", "Print a sample worksheet from the live tools", "task"),
];

export function withCatalogue(plan: ProjectPlan): ProjectPlan {
  const ids = new Set(plan.nodes.map(node => node.id));
  return { ...plan, nodes: [...plan.nodes, ...initialNodes.filter(node => !ids.has(node.id))] };
}
