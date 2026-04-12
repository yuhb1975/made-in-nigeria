/**
 * Generates README.MD from data/projects.json.
 * Usage: node scripts/generate-readme.mjs
 */

import { writeFileSync } from "fs";
import { join } from "path";
import { root, readProjects } from "./utils.mjs";

const projects = readProjects();

const STATUS_SPANS = {
  inactive:   `<span style="color: red; font-weight: 700;"> | 🏁 Inactive </span>`,
  archived:   `<span style="color: green; font-weight: 700;"> | 🏁 Archived </span>`,
  deprecated: `<span style="color: red; font-weight: 700;"> | 🏁 Deprecated </span>`,
  deleted:    `<span style="color: red; font-weight: 700;"> | 🏁 Deleted </span>`,
};

function formatAuthors(authors) {
  if (!authors || authors.length === 0) return "";
  return authors.map((a) => (a.link ? `[${a.name}](${a.link})` : a.name)).join(", ");
}

function buildLine(project) {
  const statusSpan = STATUS_SPANS[project.manualStatus] ?? "";
  const authors = formatAuthors(project.authors);
  const authorPart = authors ? ` **By ${authors}**` : "";
  return `- [${project.name}](${project.repoUrl}) - ${project.description}${authorPart}${statusSpan}`;
}

// Group projects by first letter; non-alpha names fall under "#"
const byLetter = {};
for (const project of projects) {
  const letter = project.name[0].toUpperCase();
  const key = letter >= "A" && letter <= "Z" ? letter : "#";
  (byLetter[key] ??= []).push(project);
}

const letters = Object.keys(byLetter).sort();

const navLinks = letters.map((l) => `<a href="#${l}">${l}</a>`).join(" | ");

let output = `<h1 align="center">
  <a href="https://madeinnigeria.dev/">
    🇳🇬Made. In. Nigeria🇳🇬
  </a>
</h1>
<p align="center">A curation of awesome tools and projects built by Nigerian developers :fire:.</p>

<p align="center">
  ${navLinks}
</p>

`;

for (const letter of letters) {
  output += `## <a name="${letter}"> </a>${letter}\n\n`;
  for (const project of byLetter[letter]) {
    output += buildLine(project) + "\n";
  }
  output += "\n";
}

writeFileSync(join(root, "README.MD"), output, "utf8");
console.log(`✓ README.MD regenerated (${projects.length} projects)`);
