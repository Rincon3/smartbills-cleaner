import { Router } from "express";
import fs from "fs";
import multer from "multer";
import { prisma } from "../config/prisma.js";
import { createAuditLog } from "../services/auditService.js";
import { indexInvoiceChunks } from "../services/chunkIndexService.js";
import { processInvoiceDocument } from "../services/ocr/processInvoiceDocument.js";
import { getClientIp } from "../utils/http.js";
import { resolveStoredFile, uploadsDir } from "../utils/paths.js";

fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniquePrefix}-${file.originalname.replace(/\s+/g, "-")}`);
  }
});

const allowedMimeTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/tiff"
];

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Formato no soportado"));
    }

    return cb(null, true);
  }
});

function buildInvoiceCode(seed) {
  const safe = String(seed || "")
    .replace(/[^A-Za-z0-9/-]/g, "")
    .slice(0, 24)
    .toUpperCase();

  if (safe.length >= 4) {
    return safe;
  }

  return `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
}

async function uniqueInvoiceCode(seed) {
  let code = buildInvoiceCode(seed);
  let suffix = 1;

  while (await prisma.invoice.findUnique({ where: { code } })) {
    code = `${buildInvoiceCode(seed)}-${suffix}`;
    suffix += 1;
  }

  return code;
}

function toInvoiceResponse(invoice) {
  return {
    id: invoice.id,
    code: invoice.code,
    supplier: invoice.supplier,
    taxId: invoice.taxId,
    issueDate: invoice.issueDate,
    subtotal: invoice.subtotal,
    vat: invoice.vat,
    total: invoice.total,
    status: invoice.status,
    fileName: invoice.fileName,
    filePath: invoice.filePath,
    mimeType: invoice.mimeType,
    storageProvider: invoice.storageProvider,
    uploadedAt: invoice.uploadedAt,
    ocrAverageConfidence: invoice.ocrAverageConfidence,
    ocrEngine: invoice.ocrEngine,
    ocrRawText: invoice.ocrRawText,
    pageCount: invoice.pageCount,
    ownerId: invoice.ownerId,
    fields: invoice.fields
  };
}

export const invoiceRouter = Router();

invoiceRouter.get("/", async (req, res) => {
  const { status, supplier, from, to } = req.query;

  const invoices = await prisma.invoice.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(supplier
        ? {
            supplier: {
              contains: supplier,
              mode: "insensitive"
            }
          }
        : {}),
      ...(from || to
        ? {
            issueDate: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {})
            }
          }
        : {})
    },
    include: { fields: true },
    orderBy: { uploadedAt: "desc" }
  });

  return res.json(invoices.map(toInvoiceResponse));
});

invoiceRouter.get("/:id", async (req, res) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: req.params.id },
    include: { fields: true }
  });

  if (!invoice) {
    return res.status(404).json({ message: "Factura no encontrada" });
  }

  return res.json(toInvoiceResponse(invoice));
});

invoiceRouter.get("/:id/file", async (req, res) => {
  const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });

  if (!invoice) {
    return res.status(404).json({ message: "Factura no encontrada" });
  }

  const diskPath = resolveStoredFile(invoice.filePath);

  if (!fs.existsSync(diskPath)) {
    return res.status(404).json({ message: "El archivo original no esta disponible" });
  }

  res.setHeader("Content-Type", invoice.mimeType || "application/octet-stream");
  res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(invoice.fileName)}"`);
  return fs.createReadStream(diskPath).pipe(res);
});

invoiceRouter.get("/:id/chunks", async (req, res) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: req.params.id },
    include: {
      chunks: {
        orderBy: { page: "asc" }
      }
    }
  });

  if (!invoice) {
    return res.status(404).json({ message: "Factura no encontrada" });
  }

  return res.json(
    invoice.chunks.map((chunk) => ({
      id: chunk.id,
      invoiceId: invoice.id,
      invoiceCode: invoice.code,
      page: chunk.page,
      section: chunk.section,
      text: chunk.text,
      chunkSource: chunk.chunkSource,
      citation: `[Factura ${invoice.code}, pág. ${chunk.page}]`
    }))
  );
});

invoiceRouter.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Archivo requerido" });
  }

  let ocr;

  try {
    ocr = await processInvoiceDocument({
      filePath: req.file.path,
      mimeType: req.file.mimetype
    });
  } catch (error) {
    console.error("OCR failed", error);
    ocr = {
      supplier: "No identificado",
      taxId: "No detectado",
      issueDate: new Date().toISOString().slice(0, 10),
      subtotal: 0,
      vat: 0,
      total: 0,
      documentNumber: null,
      fields: [
        { label: "Proveedor", value: "No identificado", confidence: 0.2 },
        { label: "NIT", value: "No detectado", confidence: 0.2 },
        { label: "Fecha", value: new Date().toISOString().slice(0, 10), confidence: 0.2 },
        { label: "Subtotal", value: "0.00", confidence: 0.2 },
        { label: "IVA", value: "0.00", confidence: 0.2 },
        { label: "Total", value: "0.00", confidence: 0.2 }
      ],
      averageConfidence: 0.15,
      status: "ERROR",
      ocrEngine: "error",
      ocrRawText: "",
      pageCount: 1,
      pages: []
    };
  }

  const created = await prisma.invoice.create({
    data: {
      code: await uniqueInvoiceCode(ocr.documentNumber || `${Date.now()}`),
      supplier: ocr.supplier,
      taxId: ocr.taxId,
      issueDate: new Date(ocr.issueDate),
      subtotal: ocr.subtotal,
      vat: ocr.vat,
      total: ocr.total,
      status: ocr.status,
      fileName: req.file.originalname,
      filePath: `/uploads/${req.file.filename}`,
      mimeType: req.file.mimetype,
      storageProvider: "LOCAL",
      ownerId: req.user.id,
      ocrAverageConfidence: ocr.averageConfidence,
      ocrEngine: ocr.ocrEngine,
      ocrRawText: ocr.ocrRawText,
      pageCount: ocr.pageCount,
      fields: {
        create: ocr.fields
      }
    },
    include: { fields: true }
  });

  await indexInvoiceChunks(created.id, ocr.pages);

  await createAuditLog({
    action: "UPLOAD",
    entity: "invoice",
    entityId: created.id,
    userId: req.user.id,
    ipAddress: getClientIp(req),
    metadata: {
      fileName: req.file.originalname,
      storageProvider: "LOCAL",
      ocrEngine: created.ocrEngine,
      pageCount: created.pageCount
    }
  });

  return res.status(201).json(toInvoiceResponse(created));
});

invoiceRouter.put("/:id", async (req, res) => {
  const { supplier, taxId, issueDate, subtotal, vat, total, status, fields } = req.body;
  const existing = await prisma.invoice.findUnique({ where: { id: req.params.id }, include: { fields: true } });

  if (!existing) {
    return res.status(404).json({ message: "Factura no encontrada" });
  }

  await prisma.invoiceField.deleteMany({ where: { invoiceId: existing.id } });

  const updated = await prisma.invoice.update({
    where: { id: existing.id },
    data: {
      supplier,
      taxId,
      issueDate: new Date(issueDate),
      subtotal: Number(subtotal),
      vat: Number(vat),
      total: Number(total),
      status,
      ocrAverageConfidence: Number(
        (
          (fields || []).reduce((sum, field) => sum + Number(field.confidence || 0), 0) /
          Math.max((fields || []).length, 1)
        ).toFixed(2)
      ),
      ocrEngine: existing.ocrEngine,
      ocrRawText: existing.ocrRawText,
      pageCount: existing.pageCount,
      fields: {
        create: (fields || []).map((field) => ({
          label: field.label,
          value: field.value,
          confidence: Number(field.confidence)
        }))
      }
    },
    include: { fields: true }
  });

  await indexInvoiceChunks(updated.id);

  await createAuditLog({
    action: "EDIT",
    entity: "invoice",
    entityId: updated.id,
    userId: req.user.id,
    ipAddress: getClientIp(req),
    metadata: { status: updated.status }
  });

  return res.json(toInvoiceResponse(updated));
});

invoiceRouter.delete("/:id", async (req, res) => {
  const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });

  if (!invoice) {
    return res.status(404).json({ message: "Factura no encontrada" });
  }

  const diskPath = resolveStoredFile(invoice.filePath);

  if (fs.existsSync(diskPath)) {
    fs.unlinkSync(diskPath);
  }

  await prisma.invoice.delete({ where: { id: invoice.id } });

  await createAuditLog({
    action: "DELETE",
    entity: "invoice",
    entityId: invoice.id,
    userId: req.user.id,
    ipAddress: getClientIp(req),
    metadata: { fileName: invoice.fileName }
  });

  return res.status(204).send();
});

