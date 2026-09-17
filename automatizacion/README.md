# Automatización MoveSmart

Esta carpeta contiene la primera capa del generador de programas.

## Objetivo

Transformar una evaluación de `Respuestas_evaluacion_programa` en un conjunto de borradores HTML verificables, sin modificar clientes existentes y sin publicar automáticamente.

## Flujo seguro

1. Leer una fila de la hoja `Respuestas`.
2. Convertir sus 35 columnas al formato canónico de `mapa-evaluacion.json`.
3. Completar el contenido profesional y las variables de las plantillas.
4. Ejecutar `generar-borrador.mjs`.
5. Validar que no queden marcadores `{{VARIABLE}}` ni imágenes relativas.
6. Revisar el programa.
7. Publicar en `clientes/<cliente_id>/` solamente después de aprobación.

## Uso local

```bash
node automatizacion/generar-borrador.mjs ruta/datos-cliente.json
```

Por defecto escribe en `borradores-generados/<cliente_id>/`. Nunca escribe directamente en `clientes/`.

Formato mínimo:

```json
{
  "cliente": {
    "id": "nombre-apellido",
    "nombreCompleto": "Nombre Apellido",
    "nombreCorto": "Nombre"
  },
  "rutinasRevisadas": true,
  "variables": {
    "INTRODUCCION_PLAN": "...",
    "MENSAJE_PRINCIPAL": "...",
    "MENSAJE_SECUNDARIO": "..."
  }
}
```

El generador calcula automáticamente las variables comunes de identidad y rutas. Las demás variables deben venir completas. Si falta una, el proceso se detiene antes de escribir archivos.

## Protección actual

Las rutinas maestras todavía contienen bloques de ejercicios de referencia. Por eso el generador exige `rutinasRevisadas: true`. La siguiente fase será convertir esos bloques en datos estructurados de ejercicios A/B y construirlos desde la biblioteca de videos.

## No afecta producción

- No modifica Google Sheets.
- No modifica Apps Script.
- No toca carpetas de clientes reales.
- No publica automáticamente.
- No sobrescribe borradores existentes.
