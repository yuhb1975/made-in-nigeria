/**
 * Validates data/projects.json for use in CI (PR checks).
 * Exits with code 1 if any issues are found.
 * Usage: node scripts/validate-projects.mjs
 */

import { PROJECTS_PATH } from "./utils.mjs";
import { readFileSync } from "fs";

const VALID_MANUAL_STATUSES = new Set(["inactive", "archived", "deprecated", "deleted"]);
const URL_RE = /^https?:\/\/.+/;
const isBlankString = (v) => !v || typeof v !== "string" || v.trim() === "";

let projects;
try {
  projects = JSON.parse(readFileSync(PROJECTS_PATH, "utf8"));
} catch (err) {
  console.error(`✗ Could not parse data/projects.json: ${err.message}`);
  process.exit(1);
}

if (!Array.isArray(projects)) {
  console.error("✗ data/projects.json must be a JSON array");
  process.exit(1);
}

const errors = [];
const seenUrls = new Map();

for (let i = 0; i < projects.length; i++) {
  const p = projects[i];
  const label = `[${i}] "${p.name || "(no name)"}"`;

  if (isBlankString(p.name)) errors.push(`${label}: missing or empty "name"`);

  if (!p.repoUrl || !URL_RE.test(p.repoUrl)) {
    errors.push(`${label}: missing or invalid "repoUrl" (must start with http:// or https://)`);
  } else if (seenUrls.has(p.repoUrl)) {
    errors.push(`${label}: duplicate repoUrl — already used by ${seenUrls.get(p.repoUrl)}`);
  } else {
    seenUrls.set(p.repoUrl, label);
  }

  if (isBlankString(p.description)) errors.push(`${label}: missing or empty "description"`);

  if (!Array.isArray(p.authors) || p.authors.length === 0) {
    errors.push(`${label}: "authors" must be a non-empty array`);
  } else {
    for (const [j, author] of p.authors.entries()) {
      if (isBlankString(author.name)) errors.push(`${label}: authors[${j}] missing "name"`);
    }
  }

  if (p.manualStatus !== undefined && !VALID_MANUAL_STATUSES.has(p.manualStatus)) {
    errors.push(
      `${label}: invalid "manualStatus" "${p.manualStatus}" — must be one of: ${[...VALID_MANUAL_STATUSES].join(", ")}`
    );
  }

  if (p.computed !== undefined) {
    errors.push(`${label}: "computed" must not appear in projects.json — it belongs in projects.enriched.json`);
  }
}

if (errors.length > 0) {
  console.error(`✗ Validation failed with ${errors.length} error(s):\n`);
  errors.forEach((e) => console.error(`  • ${e}`));
  process.exit(1);
}

console.log(`✓ data/projects.json is valid (${projects.length} projects)`);
