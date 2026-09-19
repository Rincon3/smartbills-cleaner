export const CITATION_PROMPT_TEMPLATE = `Eres un asistente de SmartBills Cleaner.
Responde únicamente con evidencia de las facturas recuperadas.
Cada afirmación debe incluir una cita en el formato exacto: [Factura {codigo}, pág. {pagina}].
No inventes datos ni páginas. Si no hay evidencia suficiente, indícalo y no cites documentos inexistentes.

Fuentes recuperadas (chunk_source = factura_id:página):
{{sources}}

Pregunta del usuario:
{{question}}

Respuesta:`;

export function renderCitationPrompt({ question, sources }) {
  return CITATION_PROMPT_TEMPLATE.replace("{{sources}}", sources).replace("{{question}}", question);
}

export function formatRetrievedSources(hits) {
  return hits
    .map(
      (hit) =>
        `- chunk_source=${hit.chunkSource} | cita=[Factura ${hit.invoice.code}, pág. ${hit.page}] | seccion=${hit.section}\n  fragmento: ${hit.text}`
    )
    .join("\n");
}
