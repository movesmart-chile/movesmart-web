const SPREADSHEET_ID = "1xbi3rmc5t2DPB1om_G-4ZvcpSRx8pqEeedajCiqCqRs";
const SHEET_NAME = "Respuestas";
const HEADER_ROW = 3;
const FIRST_DATA_ROW = 4;
const TEST_CLIENT_ID = "cliente-referencia";

function doGet(e) {
  try {
    const requestedId = slugify_((e && e.parameter && e.parameter.cliente) || "");

    // Primera etapa segura: el conector solo puede devolver el cliente ficticio.
    if (requestedId !== TEST_CLIENT_ID) {
      return json_({ ok: false, error: "En esta prueba solo está habilitado cliente-referencia." });
    }

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error("No existe la hoja Respuestas.");

    const lastColumn = sheet.getLastColumn();
    const lastRow = sheet.getLastRow();
    const headers = sheet.getRange(HEADER_ROW, 1, 1, lastColumn).getDisplayValues()[0];
    const rows = sheet
      .getRange(FIRST_DATA_ROW, 1, lastRow - FIRST_DATA_ROW + 1, lastColumn)
      .getDisplayValues();

    const nameIndex = headers.indexOf("fullName");
    if (nameIndex === -1) throw new Error("No existe la columna fullName.");

    const row = rows.find(values => {
      const rowId = slugify_(values[nameIndex]);
      return rowId === requestedId ||
        (requestedId === TEST_CLIENT_ID && rowId === "cliente-de-referencia");
    });
    if (!row) throw new Error("No se encontró Cliente de Referencia.");

    const record = {};
    headers.forEach((header, index) => {
      if (header) record[header] = row[index] || "";
    });

    return json_(buildDiagnosisData_(record, requestedId));
  } catch (error) {
    return json_({ ok: false, error: error.message });
  }
}

function buildDiagnosisData_(record, clienteId) {
  const confirmed = [
    "Edad: " + valueOr_(record.age, "no informada") + " años.",
    "Actividad diaria: " + valueOr_(record.dailyActivity, "no informada") + ".",
    "Experiencia: " + valueOr_(record.trainingExperience, "no informada") + ".",
    "Entrenará en: " + valueOr_(record.trainingPlace, "lugar no informado") + ".",
    "Implementos: " + valueOr_(record.equipment, "sin implementos informados") + ".",
    "Disponibilidad: " + valueOr_(record.availableDays, "días no informados") +
      ", " + valueOr_(record.sessionTime, "duración no informada") + "."
  ];

  const work = [
    valueOr_(record.mainGoal, "Retomar el movimiento"),
    valueOr_(record.functionalGoal, "Construir una rutina sostenible"),
    "Constancia y progresión según respuesta."
  ];

  return {
    ok: true,
    clienteId: clienteId,
    variables: {
      NOMBRE_CLIENTE: valueOr_(record.fullName, "Cliente de Referencia"),
      URL_PLAN_CLIENTE:
        "https://movesmart-chile.github.io/movesmart-web/clientes/" +
        clienteId +
        "/plan-" +
        clienteId +
        ".html",
      INTRODUCCION_DIAGNOSTICO:
        "Este diagnóstico funcional organiza la información de la evaluación inicial para orientar un comienzo simple, gradual y personalizado.",
      RESUMEN_DEL_CASO:
        "Cliente de " +
        valueOr_(record.age, "edad no informada") +
        " años que busca " +
        lowerFirst_(valueOr_(record.mainGoal, "retomar el movimiento")) +
        ".",
      ESTADO_ACTUAL: valueOr_(record.functionalGoalCurrent, record.goalReason),
      BARRERA_PRINCIPAL: valueOr_(record.consistencyDifficulty, "No informada."),
      OBJETIVO_FUNCIONAL: valueOr_(
        record.functionalGoal,
        "Completar actividades diarias y sesiones de entrenamiento con mayor confianza."
      ),
      ENFOQUE:
        "Empezar con una dosis simple, observar la respuesta y progresar según tolerancia.",
      DATOS_CONFIRMADOS_HTML: listItems_(confirmed),
      QUE_VAMOS_A_TRABAJAR_HTML: listItems_(work),
      OBJETIVO_INICIAL: valueOr_(
        record.functionalGoalSuccess,
        "Completar la primera semana con una dosis sostenible y registrar la respuesta."
      ),
      NOTA_PROFESIONAL:
        "Este contenido corresponde a una demostración técnica con un cliente ficticio y requiere revisión profesional antes de usarse con clientes reales."
    }
  };
}

function valueOr_(value, fallback) {
  const clean = String(value || "").trim();
  return clean || String(fallback || "").trim();
}

function lowerFirst_(text) {
  const value = String(text || "");
  return value ? value.charAt(0).toLowerCase() + value.slice(1) : value;
}

function listItems_(items) {
  return items
    .filter(Boolean)
    .map(item => "<li>" + escapeHtml_(item) + "</li>")
    .join("");
}

function escapeHtml_(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function slugify_(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
