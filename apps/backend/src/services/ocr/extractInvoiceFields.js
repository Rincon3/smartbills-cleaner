const MONEY_CANDIDATE =
  /(?:\$\s*)?(\d{1,3}(?:[.\s]\d{3})+(?:,\d{1,2})|\d{1,3}(?:,\d{3})+(?:\.\d{1,2})|\d+[.,]\d{2}|\d{4,})/;

export function parseMoney(raw) {
  if (raw == null) {
    return null;
  }

  let value = String(raw).trim().replace(/\s/g, "");

  if (!value) {
    return null;
  }

  const hasDecimalComma = /,\d{1,2}$/.test(value);
  const hasThousandDots = /\.\d{3}/.test(value);

  if (hasDecimalComma) {
    value = value.replace(/\./g, "").replace(",", ".");
  } else if (value.includes(",") && !value.includes(".")) {
    value = value.replace(",", ".");
  } else {
    value = value.replace(/,/g, "");
  }

  if (hasThousandDots && !hasDecimalComma && /^\d+\.\d{3}$/.test(String(raw).replace(/\s/g, ""))) {
    value = String(raw).replace(/\s/g, "").replace(/\./g, "");
  }

  const amount = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(amount) ? Number(amount.toFixed(2)) : null;
}

export function parseDate(raw) {
  if (!raw) {
    return null;
  }

  const text = String(raw).trim();
  const iso = text.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  }

  const latin = text.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (latin) {
    const year = latin[3].length === 2 ? `20${latin[3]}` : latin[3];
    return `${year}-${latin[2].padStart(2, "0")}-${latin[1].padStart(2, "0")}`;
  }

  return null;
}

function normalize(text) {
  return String(text || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ");
}

function findLabeledValue(text, labels, pattern) {
  const source = normalize(text);
  for (const label of labels) {
    const regex = new RegExp(`${label}[^\\n]{0,40}?${pattern.source}`, "i");
    const match = source.match(regex);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function findLabeledMoney(text, labels) {
  const source = normalize(text);
  for (const label of labels) {
    const regex = new RegExp(`${label}[^\\n$0-9]{0,40}${MONEY_CANDIDATE.source}`, "i");
    const match = source.match(regex);
    if (match?.[1]) {
      return parseMoney(match[1]);
    }
  }
  return null;
}

function extractTaxId(text) {
  const labeled = normalize(text).match(
    /(?:N\.?\s*I\.?\s*T\.?|NIT|RUC|TAX\s*ID)[\s.:-]*([0-9][0-9.\s]{6,14}(?:\s*-\s*\d)?)/i
  );

  if (labeled?.[1]) {
    return labeled[1].replace(/\s/g, "");
  }

  const compact = normalize(text).match(/\b(\d{9,10}-\d)\b/);
  return compact?.[1] || "";
}

function extractSupplier(text) {
  const labeled = findLabeledValue(text, [
    "raz[oó]n social",
    "nombre o raz[oó]n social",
    "proveedor",
    "emisor",
    "vendedor",
    "empresa"
  ], /[:.-]\s*([A-ZÁÉÍÓÑ0-9][^\n]{3,80})/);

  if (labeled) {
    return labeled.replace(/\s{2,}/g, " ").trim();
  }

  const beforeNit = normalize(text).split(/(?:NIT|N\.?\s*I\.?\s*T\.?|RUC)\b/i)[0] || "";
  const fromHeader = beforeNit
    .replace(/factura(?:\s+electr[oó]nica)?(?:\s+de\s+venta)?/gi, " ")
    .replace(/\b(invoice|bill)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (fromHeader.length >= 4 && /[a-záéíóúñ]/i.test(fromHeader)) {
    const words = fromHeader.split(" ").filter(Boolean);
    return (words.length > 8 ? words.slice(-8).join(" ") : fromHeader).trim();
  }

  const lines = normalize(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const ignored = /^(factura|invoice|nit|n\.?i\.?t|fecha|total|iva|dian|página|pagina|cufe|autorizaci)/i;

  return lines.find((line) => line.length > 4 && !ignored.test(line) && /[a-záéíóúñ]/i.test(line)) || "Proveedor no identificado";
}

function extractInvoiceNumber(text) {
  const labeled = findLabeledValue(
    text,
    ["n[uú]mero de factura", "factura(?: electr[oó]nica)?", "folio", "n[°ºo]\\.?\\s*factura", "invoice\\s*(?:no|number)"],
    /[:#.-]?\s*([A-Z0-9][-A-Z0-9/]{2,24})/
  );

  if (labeled && !/^nit$/i.test(labeled)) {
    return labeled.replace(/\s/g, "");
  }

  const fallback = normalize(text).match(/\b((?:FV|FE|FA|INV)[-/]?\d{3,})\b/i);
  return fallback?.[1] || null;
}

function scoreField(value, weight) {
  if (value == null || value === "" || value === "Proveedor no identificado") {
    return 0.2 * weight;
  }
  return weight;
}

export function extractInvoiceFields(ocrText, { invoiceNumberHint } = {}) {
  const text = normalize(ocrText);
  const taxId = extractTaxId(text);

  const issueDate =
    parseDate(findLabeledValue(text, ["fecha de emisi[oó]n", "fecha emisi[oó]n", "fecha"], /[:.-]?\s*(\d{1,4}[/-]\d{1,2}[/-]\d{1,4})/)) ||
    parseDate((text.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/) || [])[1]) ||
    new Date().toISOString().slice(0, 10);

  let total = findLabeledMoney(text, ["total a pagar", "valor total", "total factura", "grand total", "total"]);
  let vat = findLabeledMoney(text, ["iva", "impuesto", "tax"]);
  let subtotal = findLabeledMoney(text, ["subtotal", "base gravable", "base imponible", "valor bruto"]);

  if (total != null && vat == null && subtotal != null) {
    vat = Number((total - subtotal).toFixed(2));
  } else if (total != null && vat == null) {
    vat = Number(((total * 19) / 119).toFixed(2));
  }

  if (subtotal == null && total != null && vat != null) {
    subtotal = Number((total - vat).toFixed(2));
  }

  if (total == null && subtotal != null && vat != null) {
    total = Number((subtotal + vat).toFixed(2));
  }

  const supplier = extractSupplier(text);
  const documentNumber = invoiceNumberHint || extractInvoiceNumber(text);
  const cleanedTaxId = String(taxId).replace(/\s/g, "");

  const fields = [
    { label: "Proveedor", value: supplier, confidence: supplier === "Proveedor no identificado" ? 0.35 : 0.86 },
    { label: "NIT", value: cleanedTaxId || "No detectado", confidence: cleanedTaxId ? 0.9 : 0.25 },
    { label: "Fecha", value: issueDate, confidence: 0.8 },
    { label: "Subtotal", value: (subtotal ?? 0).toFixed(2), confidence: subtotal != null ? 0.84 : 0.3 },
    { label: "IVA", value: (vat ?? 0).toFixed(2), confidence: vat != null ? 0.82 : 0.3 },
    { label: "Total", value: (total ?? 0).toFixed(2), confidence: total != null ? 0.88 : 0.28 }
  ];

  if (documentNumber) {
    fields.unshift({ label: "Numero de factura", value: documentNumber, confidence: 0.87 });
  }

  const averageConfidence = Number(
    (
      (scoreField(supplier, 0.2) +
        scoreField(cleanedTaxId, 0.2) +
        scoreField(subtotal, 0.15) +
        scoreField(vat, 0.15) +
        scoreField(total, 0.3)) /
      1
    ).toFixed(2)
  );

  const missingCore = !cleanedTaxId || total == null || supplier === "Proveedor no identificado";

  return {
    supplier,
    taxId: cleanedTaxId || "No detectado",
    issueDate,
    subtotal: subtotal ?? 0,
    vat: vat ?? 0,
    total: total ?? 0,
    documentNumber,
    fields,
    averageConfidence,
    missingCore
  };
}

export function mergeExtractedFields(ruleResult, llmResult) {
  if (!llmResult) {
    return ruleResult;
  }

  const next = { ...ruleResult };
  const keys = ["supplier", "taxId", "issueDate", "subtotal", "vat", "total", "documentNumber"];

  for (const key of keys) {
    const candidate = llmResult[key];
    if (candidate == null || candidate === "") {
      continue;
    }

    if (["subtotal", "vat", "total"].includes(key)) {
      const amount = parseMoney(candidate);
      if (amount != null) {
        next[key] = amount;
      }
      continue;
    }

    if (key === "issueDate") {
      next[key] = parseDate(candidate) || next[key];
      continue;
    }

    next[key] = String(candidate).trim();
  }

  next.fields = [
    ...(next.documentNumber
      ? [{ label: "Numero de factura", value: next.documentNumber, confidence: 0.9 }]
      : []),
    { label: "Proveedor", value: next.supplier, confidence: 0.9 },
    { label: "NIT", value: next.taxId, confidence: next.taxId && next.taxId !== "No detectado" ? 0.92 : 0.3 },
    { label: "Fecha", value: next.issueDate, confidence: 0.88 },
    { label: "Subtotal", value: Number(next.subtotal).toFixed(2), confidence: 0.88 },
    { label: "IVA", value: Number(next.vat).toFixed(2), confidence: 0.88 },
    { label: "Total", value: Number(next.total).toFixed(2), confidence: 0.92 }
  ];

  next.missingCore = !next.taxId || next.taxId === "No detectado" || !next.total;
  next.averageConfidence = next.missingCore ? 0.55 : 0.91;
  return next;
}
