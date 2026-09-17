#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const TEMPLATE = path.join(ROOT, "plantillas", "diagnostico-funcional-maestro.html");

function stop(message) {
  console.error("ERROR: " + message);
  process.exit(1);
}

function variablesPendientes(html) {
  return [...new Set([...html.matchAll(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g)].map(match => match[1]))];
}

async function cargarDatos(origen) {
  if (/^https?:\/\//i.test(origen)) {
    let response;
    try {
      response = await fetch(origen, { redirect: "follow" });
    } catch (error) {
      stop("No fue posible conectar con Google Sheets: " + error.message);
    }

    if (!response.ok) {
      stop("Google Sheets respondió con estado " + response.status + ".");
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      stop("La respuesta de Google Sheets no es un JSON válido.");
    }

    if (payload.ok === false) stop(payload.error || "Google Sheets devolvió un error.");
    return payload;
  }

  const inputPath = path.resolve(process.cwd(), origen);
  if (!fs.existsSync(inputPath)) stop("No existe el archivo de datos.");

  try {
    return JSON.parse(fs.readFileSync(inputPath, "utf8"));
  } catch {
    stop("El archivo de datos no contiene un JSON válido.");
  }
}

const input = process.argv[2];
if (!input) stop("Debes indicar un archivo JSON o la URL del conector de Google Sheets.");
if (!fs.existsSync(TEMPLATE)) stop("No existe la plantilla maestra.");

const datos = await cargarDatos(input);
const clienteId = String(datos.clienteId || "").trim();

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(clienteId)) {
  stop("clienteId debe estar en minúsculas y separado con guiones.");
}

const plantilla = fs.readFileSync(TEMPLATE, "utf8");
const requeridas = variablesPendientes(plantilla);
const faltantes = requeridas.filter(nombre =>
  datos.variables?.[nombre] === undefined ||
  datos.variables?.[nombre] === null ||
  datos.variables?.[nombre] === ""
);

if (faltantes.length) stop("Faltan variables: " + faltantes.join(", "));

const resultado = plantilla.replace(
  /\{\{\s*([A-Z0-9_]+)\s*\}\}/g,
  (_, nombre) => String(datos.variables[nombre])
);

const pendientes = variablesPendientes(resultado);
if (pendientes.length) stop("Quedaron variables pendientes: " + pendientes.join(", "));

const imagenesRelativas = [...resultado.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)]
  .map(match => match[1])
  .filter(src => !/^(https?:|data:|blob:)/i.test(src));

if (imagenesRelativas.length) {
  stop("Hay imágenes sin ruta absoluta: " + imagenesRelativas.join(", "));
}

const salida = path.join(
  ROOT,
  "borradores-generados",
  clienteId,
  "diagnostico-funcional-" + clienteId + ".html"
);

if (fs.existsSync(salida)) stop("El borrador ya existe y no se sobrescribirá.");

fs.mkdirSync(path.dirname(salida), { recursive: true });
fs.writeFileSync(salida, resultado, "utf8");

console.log("Diagnóstico generado: " + salida);
