function seededNumber(input, offset = 0) {
  return [...input].reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1 + offset), 0);
}

function createConfidence(seed, min = 0.78, max = 0.99) {
  const ratio = (seed % 100) / 100;
  return Number((min + (max - min) * ratio).toFixed(2));
}

export function simulateOcr(fileName) {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  const name = base || "Proveedor editorial";
  const seed = seededNumber(name);
  const supplier = name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  const subtotal = Number((((seed % 9000) + 800) * 0.91).toFixed(2));
  const vat = Number((subtotal * 0.19).toFixed(2));
  const total = Number((subtotal + vat).toFixed(2));
  const issueDate = new Date(Date.now() - (seed % 7) * 86400000).toISOString().slice(0, 10);
  const taxId = `${900000000 + (seed % 99999999)}-${(seed % 9) + 1}`;

  const fields = [
    { label: "Proveedor", value: supplier, confidence: createConfidence(seed, 0.88, 0.99) },
    { label: "NIT", value: taxId, confidence: createConfidence(seed, 0.82, 0.97) },
    { label: "Fecha", value: issueDate, confidence: createConfidence(seed, 0.8, 0.96) },
    { label: "Subtotal", value: subtotal.toFixed(2), confidence: createConfidence(seed, 0.79, 0.95) },
    { label: "IVA", value: vat.toFixed(2), confidence: createConfidence(seed, 0.78, 0.93) },
    { label: "Total", value: total.toFixed(2), confidence: createConfidence(seed, 0.86, 0.98) }
  ];

  const averageConfidence = Number(
    (fields.reduce((sum, field) => sum + field.confidence, 0) / fields.length).toFixed(2)
  );

  return {
    supplier,
    taxId,
    issueDate,
    subtotal,
    vat,
    total,
    fields,
    averageConfidence
  };
}

