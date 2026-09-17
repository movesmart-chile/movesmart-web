#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const target = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : path.join(ROOT, "plantillas");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

if (!fs.existsSync(target)) {
  console.error(`ERROR: No existe ${target}`);
  process.exit(1);
}

const files = (fs.statSync(target).isDirectory() ? walk(target) : [target])
  .filter(file => file.toLowerCase().endsWith(".html"));

const report = [];
let hasErrors = false;

for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const vars = [...new Set([...html.matchAll(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g)].map(m => m[1]))];
  const relativeImages = [...html.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)]
    .map(m => m[1])
    .filter(src => !/^(https?:|data:|blob:|\{\{)/i.test(src));

  const isTemplate = file.includes(`${path.sep}plantillas${path.sep}`);
  const errors = [];
  if (!isTemplate && vars.length) errors.push(`Variables pendientes: ${vars.join(", ")}`);
  if (relativeImages.length) errors.push(`Imágenes relativas: ${relativeImages.join(", ")}`);
  if (errors.length) hasErrors = true;

  report.push({
    archivo: path.relative(ROOT, file),
    variables: vars,
    imagenesRelativas: relativeImages,
    estado: errors.length ? "error" : "ok",
    errores: errors
  });
}

console.log(JSON.stringify(report, null, 2));
process.exit(hasErrors ? 1 : 0);
