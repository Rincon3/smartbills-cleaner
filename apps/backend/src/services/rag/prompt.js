import { RAG_PROMPT_NAME } from "./constants.js";

export const FEW_SHOT_EXAMPLES = [
  {
    question: "¿Cuál es el NIT de Enel Colombia?",
    context: "- chunk_source=inv1:1 | cita=[Factura DEMO-VEC-05, pág. 1]\n  fragmento: Servicio de energia electrica. NIT: 860.063.875-8",
    answer: "El NIT de Enel Colombia es 860.063.875-8 [Factura DEMO-VEC-05, pág. 1]."
  },
  {
    question: "¿Cuánto pagué de papelería?",
    context: "- chunk_source=inv2:2 | cita=[Factura DEMO-VEC-03, pág. 2]\n  fragmento: IVA 19% 39.900. Total 249.900",
    answer: "El total de papelería es 249.900 [Factura DEMO-VEC-03, pág. 2]."
  },
  {
    question: "¿Hay una factura de arriendo de un local en Madrid?",
    context: "- chunk_source=inv3:1 | cita=[Factura DEMO-VEC-02, pág. 1]\n  fragmento: Factura de telefonia movil e internet fibra",
    answer: "No encontré evidencia verificable en las facturas recuperadas sobre un arriendo en Madrid."
  }
];

export const RAG_SYSTEM_INSTRUCTIONS = `Eres el asistente RAG de SmartBills Cleaner.
Responde siempre en español, en máximo dos frases, con tono claro y verificable.
Usa únicamente los fragmentos recuperados. Cada dato numérico o de proveedor debe llevar una cita en el formato exacto [Factura CODIGO, pág. N].
No inventes facturas, NITs, montos ni páginas. Si la evidencia no alcanza, dilo sin citar documentos irrelevantes.`;

export function formatRetrievedSources(hits) {
  if (!hits?.length) {
    return "Sin fragmentos recuperados.";
  }

  return hits
    .map((hit) => {
      const code = hit.invoice?.code || hit.invoiceCode;
      return `- chunk_source=${hit.chunkSource} | cita=[Factura ${code}, pág. ${hit.page}] | seccion=${hit.section}\n  fragmento: ${hit.text}`;
    })
    .join("\n");
}

export function renderFewShotBlock() {
  return FEW_SHOT_EXAMPLES.map(
    (example, index) => `Ejemplo ${index + 1}
Pregunta: ${example.question}
Fuentes:
${example.context}
Respuesta: ${example.answer}`
  ).join("\n\n");
}

export function renderCitationPrompt({ question, sources }) {
  return `${RAG_SYSTEM_INSTRUCTIONS}

${renderFewShotBlock()}

Fuentes recuperadas (chunk_source = factura_id:página):
${sources}

Pregunta del usuario:
${question}

Respuesta:`;
}

export const CITATION_PROMPT_TEMPLATE = RAG_SYSTEM_INSTRUCTIONS;

export { RAG_PROMPT_NAME };
