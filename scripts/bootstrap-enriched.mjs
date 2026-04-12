/**
 * Creates an initial projects.enriched.json from projects.json without
 * hitting the GitHub API. The weekly Action will populate real data on first run.
 * Usage: node scripts/bootstrap-enriched.mjs
 */

import { readProjects, writeJSON, ENRICHED_PATH } from "./utils.mjs";

const TODAY = new Date().toISOString().split("T")[0];
const projects = readProjects();

const enriched = projects.map((p) => ({
  ...p,
  computed: {
    status: p.manualStatus || "unknown",
    stars: null,
    lastPushed: null,
    language: null,
    checkedAt: TODAY,
  },
}));

writeJSON(ENRICHED_PATH, enriched);

console.log(`✓ Bootstrapped projects.enriched.json (${enriched.length} projects)`);
console.log("  Run `node scripts/enrich-projects.mjs` with GITHUB_TOKEN to populate full data.");
