import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export const PROJECTS_PATH = join(root, "data", "projects.json");
export const ENRICHED_PATH = join(root, "data", "projects.enriched.json");

export function readProjects() {
  return JSON.parse(readFileSync(PROJECTS_PATH, "utf8"));
}

export function writeJSON(filePath, data) {
  writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}
