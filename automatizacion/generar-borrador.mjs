#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const TEMPLATE_DIR = path.join(ROOT, "plantillas");
const SITE = "https://movesmart-chile.github.io/movesmart-web";

const FILES = [
  ["diagnostico-funcional-maestro.html", data => `diagnostico-funcional/diagnostico-funcional-${data.cliente.id}.html`],
  ["plan-cliente-maestro.html", data => `plan-${data.cliente.id}.html`],
  ["como-usar-este-programa-maestro.html", () => "como-usar-este-programa.html"],
  ["calendario-entrenamiento-maestro.html", () => "calendario.html"],
  ["regla-del-dolor-maestro.html", () => "regla-del-dolor.html"],
  ["conclusion-profesional-maestro.html", () => "conclusion-profesional.html"],
  ["rutina-a-maestro.html", () => "rutina-a.html"],
  ["rutina-b-maestro.html", () => "rutina-b.html"]
];

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function placeholders(html) {
  return [...new Set([...html.matchAll(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g)].map(m => m[1]))];
}

function assertAbsoluteImages(html, filename) {
  const invalid = [...html.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)]
    .map(m => m[1])
    .filter(src => !/^(https?:|data:|blob:)/i.test(src));
  if (invalid.length) fail(`${filename}: imágenes sin ruta absoluta: ${invalid.join(", ")}`);
}

function derive(data) {
  const id = slugify(data?.cliente?.id || data?.cliente?.nombreCompleto);
  if (!id) fail("Falta cliente.id o cliente.nombreCompleto.");
  data.cliente.id = id;

  const name = String(data.cliente.nombreCompleto || "").trim();
  if (!name) fail("Falta cliente.nombreCompleto.");

  const shortName = String(data.cliente.nombreCorto || name.split(/\s+/)[0]);
  const base = `${SITE}/clientes/${id}`;
  const plan = `${base}/plan-${id}.html`;

  return {
    CLIENTE_ID: id,
    NOMBRE_CLIENTE: name,
    NOMBRE_CLIENTE_CORTO: shortName,
    NOMBRE_CLIENTE_URL: encodeURIComponent(name),
    OBJETIVO_SESION_URL: encodeURIComponent(data?.objetivoSesion || data?.variables?.OBJETIVO_PRINCIPAL || ""),
    URL_PLAN_CLIENTE: plan,
    URL_COMO_USAR: `${base}/como-usar-este-programa.html`,
    URL_CALENDARIO: `${base}/calendario.html`,
    URL_REGLA_DOLOR: `${base}/regla-del-dolor.html`,
    URL_CONCLUSION: `${base}/conclusion-profesional.html`,
    URL_RUTINA_A: `${base}/rutina-a.html`,
    URL_RUTINA_A_1: `${base}/rutina-a.html`,
    URL_RUTINA_A_2: `${base}/rutina-a.html`,
    URL_RUTINA_B: `${base}/rutina-b.html`,
    URL_TOLERANCIA_CARGA: `${SITE}/clientes/tolerancia_carga.html?cliente_id=${encodeURIComponent(id)}`
  };
}

const inputArg = process.argv[2];
if (!inputArg) fail("Uso: node automatizacion/generar-borrador.mjs ruta/datos-cliente.json");

const inputPath = path.resolve(process.cwd(), inputArg);
if (!fs.existsSync(inputPath)) fail(`No existe ${inputPath}`);

const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));
if (data.rutinasRevisadas !== true) {
  fail("Debes revisar las rutinas A/B y establecer rutinasRevisadas: true antes de generar.");
}

const vars = { ...derive(data), ...(data.variables || {}) };
const outputRoot = path.resolve(ROOT, "borradores-generados", data.cliente.id);
if (fs.existsSync(outputRoot)) {
  fail(`El borrador ya existe: ${outputRoot}. No se sobrescribe automáticamente.`);
}

const rendered = [];
const missingByFile = [];

for (const [templateName, outputName] of FILES) {
  const templatePath = path.join(TEMPLATE_DIR, templateName);
  if (!fs.existsSync(templatePath)) fail(`Falta la plantilla ${templateName}`);

  const source = fs.readFileSync(templatePath, "utf8");
  const required = placeholders(source);
  const missing = required.filter(key => vars[key] === undefined || vars[key] === null || vars[key] === "");
  if (missing.length) {
    missingByFile.push(`${templateName}: ${missing.join(", ")}`);
    continue;
  }

  const html = source.replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, (_, key) => String(vars[key]));
  const unresolved = placeholders(html);
  if (unresolved.length) fail(`${templateName}: variables sin resolver: ${unresolved.join(", ")}`);
  assertAbsoluteImages(html, templateName);
  rendered.push({ output: outputName(data), html });
}

if (missingByFile.length) {
  fail("Faltan variables:\n- " + missingByFile.join("\n- "));
}

for (const item of rendered) {
  const destination = path.join(outputRoot, item.output);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, item.html, "utf8");
}

console.log(JSON.stringify({
  estado: "borrador-generado",
  clienteId: data.cliente.id,
  carpeta: outputRoot,
  archivos: rendered.map(item => item.output)
}, null, 2));
