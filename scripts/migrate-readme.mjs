/**
 * One-time migration script: parses README.MD and produces data/projects.json
 * Usage: node scripts/migrate-readme.mjs
 */

import { readFileSync, mkdirSync } from "fs";
import { join } from "path";
import { marked } from "marked";
import * as cheerio from "cheerio";
import { root, PROJECTS_PATH, writeJSON } from "./utils.mjs";

const markdown = readFileSync(join(root, "README.MD"), "utf8");
const html = marked(markdown);
const $ = cheerio.load(html);

const liItems = $("li")
  .map((_, el) => $(el).html())
  .get();

function extractManualStatus(spanText) {
  if (!spanText) return null;
  const lower = spanText.toLowerCase();
  if (lower.includes("inactive")) return "inactive";
  if (lower.includes("archived")) return "archived";
  if (lower.includes("deprecated")) return "deprecated";
  if (lower.includes("deleted")) return "deleted";
  return null;
}

function extractAuthors(html) {
  const $el = cheerio.load(html);
  const authors = [];
  $el("strong a").each((_, a) => {
    const name = $el(a).text().trim();
    const link = $el(a).attr("href") || "";
    if (name) authors.push({ name, link });
  });
  return authors;
}

const projects = [];
let skipped = 0;

for (const item of liItems) {
  const $el = cheerio.load(item);

  const firstLink = $el("a").first();
  const name = firstLink.text().trim();
  const repoUrl = firstLink.attr("href") || "";

  if (!name || !repoUrl || repoUrl.startsWith("#")) {
    skipped++;
    continue;
  }

  let description = "";
  try {
    const contents = $el("*").contents().toArray();
    for (const node of contents) {
      if (node.type === "text" && node.data) {
        const text = node.data.replace(/^ - /, "").trim();
        if (text && text.length > 2) {
          description = text;
          break;
        }
      }
    }
  } catch {}

  const manualStatus = extractManualStatus($el("span").first().text());
  const authors = extractAuthors(item);

  if (authors.length === 0) {
    const boldText = $el("strong").text().trim();
    if (boldText) authors.push({ name: boldText, link: "" });
  }

  projects.push({
    name,
    repoUrl,
    description,
    authors,
    ...(manualStatus ? { manualStatus } : {}),
  });
}

projects.sort((a, b) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
);

mkdirSync(join(root, "data"), { recursive: true });
writeJSON(PROJECTS_PATH, projects);

console.log(`✓ Migrated ${projects.length} projects to data/projects.json`);
if (skipped > 0) console.log(`  (skipped ${skipped} malformed entries)`);
