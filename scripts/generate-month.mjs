#!/usr/bin/env node
/**
 * Generates a dated copy of the monthly availability form.
 *
 * Usage:
 *   node scripts/generate-month.mjs <year> <monthIndex0based>
 *   node scripts/generate-month.mjs --ahead=12   (default 12; generates the month
 *     that is N calendar months ahead of "today", used by the scheduled workflow
 *     to keep a rolling 12-month lookahead of forms available)
 *
 * Output: <month-name>-<year>/index.html (e.g. october-2026/index.html), built
 * from template.html with {{MONTH_NAME}}, {{MONTH_INDEX}}, {{YEAR}} substituted.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function parseArgs(argv) {
  const aheadArg = argv.find((a) => a.startsWith("--ahead="));
  if (aheadArg) {
    const ahead = Number(aheadArg.split("=")[1]);
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth() + ahead, 1);
    return { year: target.getFullYear(), monthIndex: target.getMonth() };
  }
  const [yearStr, monthStr] = argv;
  if (yearStr == null || monthStr == null) {
    console.error(
      "Usage: node generate-month.mjs <year> <monthIndex0based>  OR  --ahead=N"
    );
    process.exit(1);
  }
  return { year: Number(yearStr), monthIndex: Number(monthStr) };
}

function generate(year, monthIndex) {
  const monthName = MONTH_NAMES[monthIndex];
  if (!monthName) throw new Error(`Invalid monthIndex: ${monthIndex}`);

  const template = readFileSync(join(repoRoot, "template.html"), "utf8");
  const output = template
    .replaceAll("{{MONTH_NAME}}", monthName)
    .replaceAll("{{MONTH_INDEX}}", String(monthIndex))
    .replaceAll("{{YEAR}}", String(year));

  const folderName = `${monthName.toLowerCase()}-${year}`;
  const folderPath = join(repoRoot, folderName);
  if (!existsSync(folderPath)) mkdirSync(folderPath, { recursive: true });

  const filePath = join(folderPath, "index.html");
  writeFileSync(filePath, output, "utf8");
  console.log(`Wrote ${folderName}/index.html`);
  return { folderName, filePath };
}

const { year, monthIndex } = parseArgs(process.argv.slice(2));
generate(year, monthIndex);
