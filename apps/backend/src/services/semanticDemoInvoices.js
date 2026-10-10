function pageText(page, text) {
  return `----- page ${page} -----\n${text.trim()}`;
}

function fields(invoice, confidence) {
  return [
    { label: "Proveedor", value: invoice.supplier, confidence },
    { label: "NIT", value: invoice.taxId, confidence: confidence - 0.02 },
    { label: "Fecha", value: invoice.issueDate.toISOString().slice(0, 10), confidence: confidence - 0.03 },
    { label: "Subtotal", value: invoice.subtotal.toFixed(2), confidence: confidence - 0.04 },
    { label: "IVA", value: invoice.vat.toFixed(2), confidence: confidence - 0.05 },
    { label: "Total", value: invoice.total.toFixed(2), confidence: confidence - 0.01 }
  ];
}

const DEMO = [
  {
    code: "DEMO-VEC-01",
    supplier: "Aguas de la Sabana S.A. E.S.P.",
    taxId: "823.004.006-8",
    issueDate: new Date("2026-04-02"),
    subtotal: 117500,
    vat: 22325,
    total: 139825,
    fileName: "aguas-sabana.pdf",
    pages: [
      "Factura S-FS13928501\nAcueducto y alcantarillado\nSuscriptor: SmartBills Cleaner\nPeriodo: marzo 2026\nNIT: 823.004.006-8",
      "Cargo fijo acueducto 45.000\nConsumo m3 72.500\nIVA 22.325\nTotal a pagar 139.825"
    ]
  },
  {
    code: "DEMO-VEC-02",
    supplier: "Comunicacion Celular S.A. Claro",
    taxId: "800.153.993-7",
    issueDate: new Date("2026-03-28"),
    subtotal: 89000,
    vat: 16910,
    total: 105910,
    fileName: "claro-marzo.pdf",
    pages: [
      "Factura de telefonia movil e internet fibra\nPlan empresas 200 GB\nNIT: 800.153.993-7\nContrato 1099281",
      "Cargo plan 89.000\nIVA 16.910\nTotal mes 105.910\nFecha de vencimiento 2026-04-15"
    ]
  },
  {
    code: "DEMO-VEC-03",
    supplier: "Papeleria Mundial SAS",
    taxId: "900.445.110-1",
    issueDate: new Date("2026-03-12"),
    subtotal: 210000,
    vat: 39900,
    total: 249900,
    fileName: "papeleria-mundial.pdf",
    pages: [
      "Pedido de utiles de oficina\n10 resmas carta, 2 toner laser y archivadores\nNIT: 900.445.110-1",
      "Subtotal 210.000\nIVA 19% 39.900\nTotal 249.900\nForma de pago: transferencia"
    ]
  },
  {
    code: "DEMO-VEC-04",
    supplier: "Organizacion Terpel S.A.",
    taxId: "830.095.213-0",
    issueDate: new Date("2026-04-05"),
    subtotal: 480000,
    vat: 91200,
    total: 571200,
    fileName: "terpel-flota.pdf",
    pages: [
      "Suministro de combustible corriente para flota\nEstacion Calle 80\nNIT: 830.095.213-0\nPlacas ABC123 y XYZ789",
      "Galones 160\nSubtotal 480.000\nIVA 91.200\nTotal combustible 571.200"
    ]
  },
  {
    code: "DEMO-VEC-05",
    supplier: "Enel Colombia S.A. E.S.P.",
    taxId: "860.063.875-8",
    issueDate: new Date("2026-04-01"),
    subtotal: 320000,
    vat: 60800,
    total: 380800,
    fileName: "enel-energia.pdf",
    pages: [
      "Servicio de energia electrica residencial/comercial\nNic 1234567\nConsumo 1.240 kWh\nNIT: 860.063.875-8",
      "Generacion y comercializacion 320.000\nIVA 60.800\nTotal energia 380.800"
    ]
  },
  {
    code: "DEMO-VEC-06",
    supplier: "Microsoft Colombia Inc.",
    taxId: "830.000.946-8",
    issueDate: new Date("2026-02-20"),
    subtotal: 1500000,
    vat: 285000,
    total: 1785000,
    fileName: "microsoft-365.pdf",
    pages: [
      "Renovacion Microsoft 365 Business Standard\n12 licencias anuales\nNIT: 830.000.946-8",
      "Subtotal USD convertidos 1.500.000\nIVA 285.000\nTotal suscripcion software 1.785.000"
    ]
  }
];

export const SEMANTIC_DEMO_CODES = DEMO.map((item) => item.code);

export function buildSemanticDemoInvoices() {
  return DEMO.map((item) => {
    const confidence = 0.93;
    const invoice = {
      code: item.code,
      supplier: item.supplier,
      taxId: item.taxId,
      issueDate: item.issueDate,
      subtotal: item.subtotal,
      vat: item.vat,
      total: item.total,
      status: "PROCESSED",
      fileName: item.fileName,
      filePath: `/uploads/${item.fileName}`,
      mimeType: "application/pdf",
      storageProvider: "LOCAL",
      ocrAverageConfidence: confidence,
      ocrEngine: "seed-text",
      pageCount: item.pages.length,
      ocrRawText: item.pages.map((text, index) => pageText(index + 1, text)).join("\n\n")
    };

    return {
      ...invoice,
      fields: fields(invoice, confidence)
    };
  });
}
