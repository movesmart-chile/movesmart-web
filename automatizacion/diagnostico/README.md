# Automatización: diagnóstico funcional

Esta primera etapa trabaja únicamente con el diagnóstico funcional.

## Archivos

- `datos-prueba/cliente-referencia.json`: datos ficticios usados para la prueba.
- `generar-diagnostico.mjs`: rellena la plantilla maestra.
- `borradores-generados/cliente-referencia/diagnostico-funcional-cliente-referencia.html`: resultado de prueba.

## Funcionamiento

La plantilla original permanece en:

`plantillas/diagnostico-funcional-maestro.html`

El generador reemplaza variables como `{{NOMBRE_CLIENTE}}` y crea una copia terminada. Nunca modifica la plantilla maestra ni escribe directamente en las carpetas de clientes reales.

## Ejecutar la prueba

```bash
node automatizacion/diagnostico/generar-diagnostico.mjs automatizacion/diagnostico/datos-prueba/cliente-referencia.json
```

La conexión automática con Google Sheets se realizará solamente después de aprobar esta prueba.
