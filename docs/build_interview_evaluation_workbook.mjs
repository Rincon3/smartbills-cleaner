import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const artifactToolPath = pathToFileURL(
  "/Users/miguelrinconclavijo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs"
).href;

const { Workbook, SpreadsheetFile } = await import(artifactToolPath);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "outputs", "interview-evaluation-2026-05-23");
const outputPath = path.join(outputDir, "smartbills_plantilla_evaluacion_entrevistas.xlsx");

const workbook = Workbook.create();

const instructions = workbook.worksheets.add("Instrucciones");
const participants = workbook.worksheets.add("Participantes");
const responses = workbook.worksheets.add("Respuestas");
const evaluation = workbook.worksheets.add("Evaluacion");
const catalogues = workbook.worksheets.add("Catalogos");
const affinity = workbook.worksheets.add("Afinidad");

instructions.getRange("A1:F18").values = [
  ["Plantilla de evaluacion de entrevistas - SmartBills Cleaner", null, null, null, null, null],
  ["Objetivo", "Registrar entrevistas y facilitar analisis cuantitativo/cualitativo posterior.", null, null, null, null],
  ["Uso sugerido", "1) Registrar un participante por fila en 'Participantes'. 2) Registrar una respuesta por fila en 'Respuestas'. 3) Usar 'Evaluacion' para escalas cuantificables. 4) Usar 'Afinidad' para agrupar hallazgos.", null, null, null, null],
  ["Escalas", "Use 1 a 5 para utilidad, facilidad, confianza, claridad y valor general. Use 0 cuando la pregunta no aplique.", null, null, null, null],
  ["Entrevistas recomendadas", "Minimo 4 entrevistas: usuario novato, intermedio, avanzado y un perfil adicional.", null, null, null, null],
  ["Consejo", "Mantenga los codigos de pregunta consistentes para luego crear tablas dinamicas y segmentaciones.", null, null, null, null],
  ["", null, null, null, null, null],
  ["Hojas incluidas", null, null, null, null, null],
  ["Participantes", "Perfil general de cada entrevistado.", null, null, null, null],
  ["Respuestas", "Formato largo: una respuesta por fila, ideal para filtros, tablas dinamicas y analisis.", null, null, null, null],
  ["Evaluacion", "Escalas Likert y metricas cuantitativas por participante.", null, null, null, null],
  ["Catalogos", "Codigos de preguntas, dimensiones y escalas sugeridas.", null, null, null, null],
  ["Afinidad", "Registro de hallazgos, observaciones y frases relevantes para el diagrama de afinidad.", null, null, null, null],
  ["", null, null, null, null, null],
  ["Preguntas cuantificables sugeridas", null, null, null, null, null],
  ["U1", "Utilidad percibida del sistema", null, null, null, null],
  ["U2", "Facilidad de uso esperada", null, null, null, null],
  ["U3", "Confianza al corregir datos", null, null, null, null]
];

participants.getRange("A1:L8").values = [
  ["participant_id", "fecha", "nombre_o_alias", "edad", "ocupacion", "nivel_experiencia_digital", "frecuencia_gestion_facturas", "perfil", "tipo_usuario", "canal_entrevista", "consentimiento", "observaciones"],
  ["P01", "2026-05-23", "", "", "", "Bajo", "Ocasional", "Administrativo", "Novato", "Virtual", "Si", ""],
  ["P02", "2026-05-23", "", "", "", "Medio", "Frecuente", "Operativo", "Intermedio", "Virtual", "Si", ""],
  ["P03", "2026-05-23", "", "", "", "Alto", "Diaria", "Analitico", "Avanzado", "Presencial", "Si", ""],
  ["P04", "2026-05-23", "", "", "", "Medio", "Frecuente", "Mixto", "Complementario", "Virtual", "Si", ""],
  [null, null, null, null, null, null, null, null, null, null, null, null],
  ["Notas", "Use IDs unicos por participante.", null, null, null, null, null, null, null, null, null, null],
  ["Recomendacion", "No use el nombre real si desea anonimizar.", null, null, null, null, null, null, null, null, null, null]
];

responses.getRange("A1:M14").values = [
  ["response_id", "participant_id", "question_code", "dimension", "question_text", "response_type", "numeric_value", "text_response", "pain_point", "feature_request", "quote_relevant", "priority", "notes"],
  ["R001", "P01", "C1", "Contexto", "Como gestionas actualmente tus facturas o documentos similares?", "abierta", null, "", "Si", "No", "Si", "Alta", ""],
  ["R002", "P01", "C4", "Problemas", "Que dificultades encuentras al organizar o recuperar documentos?", "abierta", null, "", "Si", "No", "Si", "Alta", ""],
  ["R003", "P01", "U1", "Utilidad", "Que tan util te parece una aplicacion como SmartBills Cleaner?", "likert_1_5", 4, "", "No", "Si", "No", "Media", ""],
  ["R004", "P01", "U2", "Usabilidad", "Que tan facil imaginas que deberia ser su uso?", "likert_1_5", 5, "", "No", "No", "No", "Media", ""],
  ["R005", "P01", "U3", "Confianza", "Que tanta confianza te daria corregir datos antes de guardarlos?", "likert_1_5", 4, "", "No", "No", "No", "Media", ""],
  ["R006", "P02", "C1", "Contexto", "Como gestionas actualmente tus facturas o documentos similares?", "abierta", null, "", "Si", "No", "Si", "Alta", ""],
  ["R007", "P02", "N1", "Necesidades", "Que esperarias que hiciera bien una aplicacion que extrae datos de facturas?", "abierta", null, "", "No", "Si", "Si", "Alta", ""],
  ["R008", "P02", "U1", "Utilidad", "Que tan util te parece una aplicacion como SmartBills Cleaner?", "likert_1_5", 5, "", "No", "Si", "No", "Alta", ""],
  ["R009", "P03", "A1", "Avanzado", "Que automatizaciones considerarias realmente valiosas para ahorrar tiempo?", "abierta", null, "", "No", "Si", "Si", "Alta", ""],
  ["R010", "P03", "U1", "Utilidad", "Que tan util te parece una aplicacion como SmartBills Cleaner?", "likert_1_5", 5, "", "No", "Si", "No", "Alta", ""],
  ["R011", "P04", "S1", "Seguridad", "Que temores o dudas tendrias al usar una herramienta inteligente para gestionar documentos?", "abierta", null, "", "Si", "No", "Si", "Alta", ""],
  ["R012", "P04", "U2", "Usabilidad", "Que tan facil imaginas que deberia ser su uso?", "likert_1_5", 4, "", "No", "No", "No", "Media", ""],
  ["R013", "P04", "U4", "Valor", "Que tan valioso seria poder consultar facturas en lenguaje natural?", "likert_1_5", 5, "", "No", "Si", "No", "Alta", ""]
];

evaluation.getRange("A1:L8").values = [
  ["participant_id", "perfil", "experiencia", "utilidad_sistema", "facilidad_uso", "confianza_validacion", "valor_consulta_natural", "claridad_interfaz", "promedio_general", "entrevistable_prototipo", "riesgo_percibido", "comentario_final"],
  ["P01", "Administrativo", "Bajo", 4, 5, 4, 3, 4, "=AVERAGE(D2:H2)", "Si", "Medio", ""],
  ["P02", "Operativo", "Medio", 5, 4, 4, 4, 4, "=AVERAGE(D3:H3)", "Si", "Bajo", ""],
  ["P03", "Analitico", "Alto", 5, 4, 5, 5, 4, "=AVERAGE(D4:H4)", "Si", "Bajo", ""],
  ["P04", "Mixto", "Medio", 4, 4, 4, 5, 4, "=AVERAGE(D5:H5)", "Si", "Medio", ""],
  [null, null, null, null, null, null, null, null, null, null, null, null],
  ["Metricas sugeridas", null, null, null, null, null, null, null, null, null, null, null],
  ["Promedio global", null, null, "=AVERAGE(D2:D5)", "=AVERAGE(E2:E5)", "=AVERAGE(F2:F5)", "=AVERAGE(G2:G5)", "=AVERAGE(H2:H5)", "=AVERAGE(I2:I5)", null, null, null]
];

catalogues.getRange("A1:H18").values = [
  ["question_code", "dimension", "tipo", "descripcion", "escala", "valor_min", "valor_max", "observacion"],
  ["C1", "Contexto", "abierta", "Gestion actual de facturas", null, null, null, "Cualitativa"],
  ["C4", "Problemas", "abierta", "Dificultades para organizar o recuperar", null, null, null, "Cualitativa"],
  ["N1", "Necesidades", "abierta", "Expectativas del sistema", null, null, null, "Cualitativa"],
  ["S1", "Seguridad", "abierta", "Temores o dudas sobre uso del sistema", null, null, null, "Cualitativa"],
  ["A1", "Avanzado", "abierta", "Automatizaciones valiosas", null, null, null, "Cualitativa"],
  ["U1", "Utilidad", "likert_1_5", "Utilidad percibida del sistema", "1=nada util, 5=muy util", 1, 5, "Cuantitativa"],
  ["U2", "Usabilidad", "likert_1_5", "Facilidad de uso esperada", "1=muy dificil, 5=muy facil", 1, 5, "Cuantitativa"],
  ["U3", "Confianza", "likert_1_5", "Confianza al corregir datos", "1=muy baja, 5=muy alta", 1, 5, "Cuantitativa"],
  ["U4", "Valor", "likert_1_5", "Valor de consultas en lenguaje natural", "1=nulo, 5=muy alto", 1, 5, "Cuantitativa"],
  ["U5", "Claridad", "likert_1_5", "Claridad percibida de la interfaz", "1=muy confusa, 5=muy clara", 1, 5, "Cuantitativa"],
  [null, null, null, null, null, null, null, null],
  ["Escalas auxiliares", null, null, null, null, null, null, null],
  ["prioridad", "Baja", null, null, null, null, null, null],
  ["prioridad", "Media", null, null, null, null, null, null],
  ["prioridad", "Alta", null, null, null, null, null, null],
  ["pain_point", "Si/No", null, null, null, null, null, null],
  ["feature_request", "Si/No", null, null, null, null, null, null]
];

affinity.getRange("A1:I10").values = [
  ["finding_id", "participant_id", "tema", "subtema", "hallazgo", "tipo", "impacto", "frase_textual", "accion_sugerida"],
  ["F001", "P01", "Usabilidad", "Carga cognitiva", "", "problema", "Alto", "", ""],
  ["F002", "P02", "Busqueda", "Recuperacion de facturas", "", "necesidad", "Alto", "", ""],
  ["F003", "P03", "Automatizacion", "Consultas inteligentes", "", "oportunidad", "Alto", "", ""],
  ["F004", "P04", "Confianza", "Seguridad y control", "", "problema", "Medio", "", ""],
  [null, null, null, null, null, null, null, null, null],
  ["Uso sugerido", null, null, null, "Agrupe observaciones repetidas para construir el diagrama de afinidad.", null, null, null, null],
  ["Consejo", null, null, null, "Use un hallazgo por fila para luego agrupar por tema, tipo o impacto.", null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  ["Tabla dinamica sugerida", null, null, null, "Conteo de hallazgos por tema y por tipo de usuario.", null, null, null, null]
];

await fs.mkdir(outputDir, { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);

console.log(`Workbook creado en: ${outputPath}`);
