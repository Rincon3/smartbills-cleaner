const MONTHS = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11
};

const DOCUMENT_CUES = [
  /\bnit\b/,
  /\bpag(?:ina|\.)\b/,
  /que dice|qué dice/,
  /energia|electrica|kwh|\bluz\b/,
  /papeleria|utiles de oficina/,
  /telefonia|internet|fibra|plan de/,
  /arriendo|canon|\bmadrid\b/,
  /acueducto|alcantarillado/,
  /fragmento|documento dice|que aparece/
];

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractSupplierHint(question) {
  const q = normalize(question);
  const match = q.match(/(?:pague|pague|pagado|suma(?:do)?|total(?: pagado)?)\s+(?:a|en)\s+([a-z0-9 .&-]+)$/);
  if (!match) {
    const loose = q.match(/\ba\s+([a-z0-9][a-z0-9 .&-]{1,40})$/);
    return loose ? loose[1].trim() : "";
  }
  return match[1].trim();
}

export function extractMonthHint(question) {
  const q = normalize(question);
  const yearMatch = q.match(/\b(20\d{2})\b/);
  const year = yearMatch ? Number(yearMatch[1]) : null;
  const monthName = Object.keys(MONTHS).find((name) => q.includes(name));
  if (!monthName) {
    return null;
  }
  return { month: MONTHS[monthName], monthName, year };
}

export function routeIntent(question) {
  const q = normalize(question);

  if (!q) {
    return { mode: "none", tool: null };
  }

  if (DOCUMENT_CUES.some((pattern) => pattern.test(q))) {
    return { mode: "document", tool: null };
  }

  if (/mayor gasto|gasto mas alto|factura mas cara|la mas cara|el gasto mas/.test(q)) {
    return { mode: "analytics", tool: "maxByTotal" };
  }

  if (/(?:cuanto|cuanto le)\s+pague\s+a\s+\w+/.test(q) || /suma(?:do)?\s+(?:de|a)\s+\w+/.test(q) || /total\s+(?:pagado\s+)?a\s+\w+/.test(q)) {
    return {
      mode: "analytics",
      tool: "sumBySupplier",
      supplier: extractSupplierHint(q)
    };
  }

  const month = extractMonthHint(q);
  if (month && /facturas|que facturas|que tengo de/.test(q)) {
    return {
      mode: "analytics",
      tool: "listByMonth",
      month: month.month,
      monthName: month.monthName,
      year: month.year
    };
  }

  return { mode: "document", tool: null };
}
