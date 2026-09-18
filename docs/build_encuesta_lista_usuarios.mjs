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
const outputDir = path.join(rootDir, "outputs", "encuesta-usuarios-2026-05-23");
const outputPath = path.join(outputDir, "encuesta_smartbills_lista_para_llenar.xlsx");

const workbook = Workbook.create();

const formulario = workbook.worksheets.add("Encuesta");
const respuestas = workbook.worksheets.add("Respuestas");
const codigos = workbook.worksheets.add("Codigos");

formulario.getRange("A1:F42").values = [
  ["ENCUESTA A USUARIOS - SMARTBILLS CLEANER", null, null, null, null, null],
  ["Objetivo", "Conocer hábitos, necesidades y percepción de usabilidad en la gestión de facturas digitales.", null, null, null, null],
  ["", null, null, null, null, null],
  ["DATOS DEL PARTICIPANTE", null, null, null, null, null],
  ["ID participante", "", "Fecha", "", "Entrevistador", ""],
  ["Edad", "", "Ocupación", "", "Canal", ""],
  ["Nivel de experiencia digital", "", "Tipo de usuario", "", "Consentimiento", ""],
  ["", null, null, null, null, null],
  ["SECCIÓN 1. CONTEXTO DE USO", null, null, null, null, null],
  ["P1", "¿Con qué frecuencia gestionas facturas o documentos similares?", "Nunca", "Ocasionalmente", "Frecuentemente", "Diariamente"],
  ["Respuesta P1", "", "", "", "", ""],
  ["P2", "¿Dónde sueles almacenar tus facturas?", "Correo", "Carpetas PC", "Nube", "WhatsApp", "Otro"],
  ["Respuesta P2", "", "", "", "", ""],
  ["P3", "¿Qué tan difícil te resulta encontrar una factura cuando la necesitas?", "1 Muy fácil", "2 Fácil", "3 Media", "4 Difícil", "5 Muy difícil"],
  ["Respuesta P3", "", "", "", "", ""],
  ["", null, null, null, null, null],
  ["SECCIÓN 2. PROBLEMAS ACTUALES", null, null, null, null, null],
  ["P4", "¿Has tenido errores al revisar datos como proveedor, fecha o valor?", "Sí", "No", null, null, null],
  ["Respuesta P4", "", "", "", "", ""],
  ["P5", "¿Qué problema ocurre con mayor frecuencia?", "Pérdida de tiempo", "Documentos desordenados", "Errores manuales", "Dificultad para buscar", "Otro"],
  ["Respuesta P5", "", "", "", "", ""],
  ["P6", "Describe brevemente el principal problema que enfrentas hoy", "", "", "", "", ""],
  ["Respuesta P6", "", "", "", "", ""],
  ["", null, null, null, null, null],
  ["SECCIÓN 3. EXPECTATIVAS SOBRE LA APLICACIÓN", null, null, null, null, null],
  ["P7", "¿Qué tan útil te parece una aplicación que extraiga automáticamente datos de facturas?", "1 Nada útil", "2 Poco útil", "3 Media", "4 Útil", "5 Muy útil"],
  ["Respuesta P7", "", "", "", "", ""],
  ["P8", "¿Qué tan importante sería poder corregir datos antes de guardarlos?", "1 Nada importante", "2 Poco importante", "3 Media", "4 Importante", "5 Muy importante"],
  ["Respuesta P8", "", "", "", "", ""],
  ["P9", "¿Qué tan útil sería consultar facturas con preguntas en lenguaje natural?", "1 Nada útil", "2 Poco útil", "3 Media", "4 Útil", "5 Muy útil"],
  ["Respuesta P9", "", "", "", "", ""],
  ["P10", "¿Qué módulo te parecería más valioso?", "Carga de facturas", "Listado y filtros", "Validación de datos", "Consultas inteligentes", "Dashboard"],
  ["Respuesta P10", "", "", "", "", ""],
  ["", null, null, null, null, null],
  ["SECCIÓN 4. USABILIDAD ESPERADA", null, null, null, null, null],
  ["P11", "¿Qué tan fácil debería ser usar la aplicación?", "1 Muy difícil", "2 Difícil", "3 Media", "4 Fácil", "5 Muy fácil"],
  ["Respuesta P11", "", "", "", "", ""],
  ["P12", "¿Qué tan importante es que el sistema muestre el estado del procesamiento?", "1 Nada importante", "2 Poco importante", "3 Media", "4 Importante", "5 Muy importante"],
  ["Respuesta P12", "", "", "", "", ""],
  ["P13", "¿Prefieres una interfaz simple o una más completa con más información?", "Muy simple", "Simple", "Intermedia", "Completa", "Muy completa"],
  ["Respuesta P13", "", "", "", "", ""],
  ["P14", "Observación final del participante", "", "", "", "", ""],
  ["Respuesta P14", "", "", "", "", ""]
];

respuestas.getRange("A1:K20").values = [
  ["id_participante", "fecha", "pregunta", "codigo", "tipo_respuesta", "respuesta_cerrada", "valor_numerico", "respuesta_abierta", "perfil", "tipo_usuario", "observaciones"],
  ["P01", "2026-05-23", "Frecuencia de gestión de facturas", "P1", "cerrada", "", "", "", "", "", ""],
  ["P01", "2026-05-23", "Lugar de almacenamiento", "P2", "cerrada", "", "", "", "", "", ""],
  ["P01", "2026-05-23", "Dificultad para encontrar una factura", "P3", "escala_1_5", "", "", "", "", "", ""],
  ["P01", "2026-05-23", "Errores al revisar datos", "P4", "cerrada", "", "", "", "", "", ""],
  ["P01", "2026-05-23", "Problema más frecuente", "P5", "cerrada", "", "", "", "", "", ""],
  ["P01", "2026-05-23", "Principal problema actual", "P6", "abierta", "", "", "", "", "", ""],
  ["P01", "2026-05-23", "Utilidad de la automatización", "P7", "escala_1_5", "", "", "", "", "", ""],
  ["P01", "2026-05-23", "Importancia de corregir datos", "P8", "escala_1_5", "", "", "", "", "", ""],
  ["P01", "2026-05-23", "Utilidad de consultas en lenguaje natural", "P9", "escala_1_5", "", "", "", "", "", ""],
  ["P01", "2026-05-23", "Módulo más valioso", "P10", "cerrada", "", "", "", "", "", ""],
  ["P01", "2026-05-23", "Facilidad esperada del sistema", "P11", "escala_1_5", "", "", "", "", "", ""],
  ["P01", "2026-05-23", "Importancia de retroalimentación del sistema", "P12", "escala_1_5", "", "", "", "", "", ""],
  ["P01", "2026-05-23", "Preferencia de complejidad de interfaz", "P13", "escala_1_5", "", "", "", "", "", ""],
  ["P01", "2026-05-23", "Observación final", "P14", "abierta", "", "", "", "", "", ""],
  [null, null, null, null, null, null, null, null, null, null, null],
  ["Sugerencia", "Duplica este bloque por participante para mantener estructura uniforme.", null, null, null, null, null, null, null, null, null],
  ["Consejo", "En valor_numerico usa 1 a 5 solo cuando la pregunta sea de escala.", null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null, null],
  ["Plantilla diseñada para posteriores tablas dinámicas y promedios.", null, null, null, null, null, null, null, null, null, null]
];

codigos.getRange("A1:F18").values = [
  ["codigo", "seccion", "tipo", "pregunta", "opciones", "nota_analitica"],
  ["P1", "Contexto", "cerrada", "¿Con qué frecuencia gestionas facturas o documentos similares?", "Nunca; Ocasionalmente; Frecuentemente; Diariamente", "Segmentación por frecuencia"],
  ["P2", "Contexto", "cerrada", "¿Dónde sueles almacenar tus facturas?", "Correo; Carpetas PC; Nube; WhatsApp; Otro", "Canales de almacenamiento"],
  ["P3", "Contexto", "escala_1_5", "¿Qué tan difícil te resulta encontrar una factura cuando la necesitas?", "1 a 5", "Indicador de fricción"],
  ["P4", "Problemas", "cerrada", "¿Has tenido errores al revisar datos como proveedor, fecha o valor?", "Sí; No", "Incidencia de error"],
  ["P5", "Problemas", "cerrada", "¿Qué problema ocurre con mayor frecuencia?", "Pérdida de tiempo; Documentos desordenados; Errores manuales; Dificultad para buscar; Otro", "Clasificación de dolor principal"],
  ["P6", "Problemas", "abierta", "Describe brevemente el principal problema que enfrentas hoy", "Texto libre", "Hallazgos cualitativos"],
  ["P7", "Expectativas", "escala_1_5", "¿Qué tan útil te parece una aplicación que extraiga automáticamente datos de facturas?", "1 a 5", "Utilidad percibida"],
  ["P8", "Expectativas", "escala_1_5", "¿Qué tan importante sería poder corregir datos antes de guardarlos?", "1 a 5", "Confianza y control"],
  ["P9", "Expectativas", "escala_1_5", "¿Qué tan útil sería consultar facturas con preguntas en lenguaje natural?", "1 a 5", "Valor de IA"],
  ["P10", "Expectativas", "cerrada", "¿Qué módulo te parecería más valioso?", "Carga; Listado; Validación; Consultas; Dashboard", "Priorización de módulo"],
  ["P11", "Usabilidad", "escala_1_5", "¿Qué tan fácil debería ser usar la aplicación?", "1 a 5", "Meta de facilidad"],
  ["P12", "Usabilidad", "escala_1_5", "¿Qué tan importante es que el sistema muestre el estado del procesamiento?", "1 a 5", "Retroalimentación del sistema"],
  ["P13", "Usabilidad", "escala_1_5", "¿Prefieres una interfaz simple o una más completa con más información?", "1 a 5", "Preferencia de complejidad"],
  ["P14", "Usabilidad", "abierta", "Observación final del participante", "Texto libre", "Cierre cualitativo"],
  [null, null, null, null, null, null],
  ["Nota", "Las preguntas P3, P7, P8, P9, P11, P12 y P13 son las más útiles para promedios y gráficos.", null, null, null, null],
  ["Nota", "P6 y P14 sirven para afinidad, citas y user personas.", null, null, null, null]
];

await fs.mkdir(outputDir, { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);

console.log(`Encuesta creada en: ${outputPath}`);
