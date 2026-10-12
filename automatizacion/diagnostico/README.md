# Automatización: diagnóstico funcional

Esta primera etapa trabaja únicamente con el diagnóstico funcional y con el cliente ficticio **Cliente de Referencia**.

## Archivos

- `datos-prueba/cliente-referencia.json`: respaldo local de los datos ficticios.
- `apps-script/Code.gs`: conector que lee la fila de Cliente de Referencia en Google Sheets.
- `generar-diagnostico.mjs`: rellena la plantilla usando un JSON local o la URL del conector.
- `borradores-generados/cliente-referencia/diagnostico-funcional-cliente-referencia.html`: resultado de prueba.

## Seguridad de esta prueba

El conector rechaza cualquier nombre que no sea `cliente-referencia`. Por ahora no puede entregar información de clientes reales.

## 1. Preparar Apps Script

1. Abre un proyecto de Google Apps Script.
2. Copia el contenido de `apps-script/Code.gs` dentro de `Code.gs`.
3. Implementa el proyecto como **Aplicación web**.
4. Ejecuta como tu cuenta y permite acceso al enlace para esta prueba.
5. Copia la URL terminada en `/exec`.

## 2. Probar la lectura de la hoja

Abre esta dirección reemplazando `URL_APPS_SCRIPT`:

```text
URL_APPS_SCRIPT?cliente=cliente-referencia
```

Debe aparecer un JSON con `"ok":true`, `"clienteId":"cliente-referencia"` y las variables del diagnóstico.

## 3. Generar desde Google Sheets

```bash
node automatizacion/diagnostico/generar-diagnostico.mjs "URL_APPS_SCRIPT?cliente=cliente-referencia"
```

La plantilla original permanece en:

`plantillas/diagnostico-funcional-maestro.html`

El generador crea una copia terminada. Nunca modifica la plantilla maestra ni escribe directamente en las carpetas de clientes reales.

> Si el borrador de prueba ya existe, el generador se detiene para evitar sobrescribirlo. Renombra o mueve ese borrador solamente cuando quieras repetir la prueba.
