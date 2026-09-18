import { Router } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { prisma } from "../config/prisma.js";
import { simulateOcr } from "../utils/fakeOcr.js";
import { createAuditLog } from "../services/auditService.js";
import { getClientIp } from "../utils/http.js";

const uploadDir = path.resolve("apps/backend/uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniquePrefix}-${file.originalname}`);
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
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Formato no soportado"));
    }

    return cb(null, true);
  }
});

function buildInvoiceCode(id) {
  return `INV-${new Date().getFullYear()}-${String(id).slice(-6).toUpperCase()}`;
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

invoiceRouter.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Archivo requerido" });
  }

  const ocr = simulateOcr(req.file.originalname);

  const created = await prisma.invoice.create({
    data: {
      code: buildInvoiceCode(`${Date.now()}`),
      supplier: ocr.supplier,
      taxId: ocr.taxId,
      issueDate: new Date(ocr.issueDate),
      subtotal: ocr.subtotal,
      vat: ocr.vat,
      total: ocr.total,
      status: ocr.averageConfidence < 0.82 ? "ERROR" : "PROCESSED",
      fileName: req.file.originalname,
      filePath: `/uploads/${req.file.filename}`,
      mimeType: req.file.mimetype,
      storageProvider: "SIMULATED_S3",
      ownerId: req.user.id,
      ocrAverageConfidence: ocr.averageConfidence,
      fields: {
        create: ocr.fields
      }
    },
    include: { fields: true }
  });

  await createAuditLog({
    action: "UPLOAD",
    entity: "invoice",
    entityId: created.id,
    userId: req.user.id,
    ipAddress: getClientIp(req),
    metadata: {
      fileName: req.file.originalname,
      storageProvider: "SIMULATED_S3"
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

  const diskPath = path.resolve("apps/backend", invoice.filePath.replace(/^\//, ""));

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

