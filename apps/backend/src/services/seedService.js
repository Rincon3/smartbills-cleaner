import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";

async function buildPasswordHashes() {
  return {
    admin: await bcrypt.hash("Admin123!", 10),
    analyst: await bcrypt.hash("Analyst123!", 10),
    viewer: await bcrypt.hash("Viewer123!", 10)
  };
}

export async function seedDatabase({ reset = false } = {}) {
  if (reset) {
    await prisma.invoiceField.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();
  }

  const existingUsers = await prisma.user.count();

  if (existingUsers > 0) {
    return { skipped: true };
  }

  const passwordHashes = await buildPasswordHashes();

  const admin = await prisma.user.create({
    data: {
      name: "Alex Rivera",
      email: "admin@smartbills.local",
      passwordHash: passwordHashes.admin,
      role: "ADMIN"
    }
  });

  const analyst = await prisma.user.create({
    data: {
      name: "Lucia Torres",
      email: "analyst@smartbills.local",
      passwordHash: passwordHashes.analyst,
      role: "ANALYST"
    }
  });

  const viewer = await prisma.user.create({
    data: {
      name: "Mateo Gomez",
      email: "viewer@smartbills.local",
      passwordHash: passwordHashes.viewer,
      role: "VIEWER"
    }
  });

  const invoices = [
    {
      code: "INV-2026-001",
      supplier: "Editorial Alpha S.A.",
      taxId: "900123001-2",
      issueDate: new Date("2026-04-17"),
      subtotal: 2058.82,
      vat: 391.18,
      total: 2450,
      status: "PROCESSED",
      fileName: "alpha-001.pdf",
      filePath: "/uploads/alpha-001.pdf",
      mimeType: "application/pdf",
      ocrAverageConfidence: 0.97
    },
    {
      code: "INV-2026-002",
      supplier: "Global News Media",
      taxId: "900123002-3",
      issueDate: new Date("2026-04-16"),
      subtotal: 941.6,
      vat: 178.9,
      total: 1120.5,
      status: "PROCESSING",
      fileName: "global-news.png",
      filePath: "/uploads/global-news.png",
      mimeType: "image/png",
      ocrAverageConfidence: 0.9
    },
    {
      code: "INV-2026-003",
      supplier: "Distribuidora Continental",
      taxId: "900123003-4",
      issueDate: new Date("2026-04-15"),
      subtotal: 7478.99,
      vat: 1421.01,
      total: 8900,
      status: "ERROR",
      fileName: "continental-003.jpg",
      filePath: "/uploads/continental-003.jpg",
      mimeType: "image/jpeg",
      ocrAverageConfidence: 0.74
    }
  ];

  for (const invoice of invoices) {
    await prisma.invoice.create({
      data: {
        ...invoice,
        ownerId: admin.id,
        fields: {
          create: [
            { label: "Proveedor", value: invoice.supplier, confidence: invoice.ocrAverageConfidence },
            { label: "NIT", value: invoice.taxId, confidence: invoice.ocrAverageConfidence - 0.02 },
            { label: "Fecha", value: invoice.issueDate.toISOString().slice(0, 10), confidence: invoice.ocrAverageConfidence - 0.03 },
            { label: "Subtotal", value: invoice.subtotal.toFixed(2), confidence: invoice.ocrAverageConfidence - 0.04 },
            { label: "IVA", value: invoice.vat.toFixed(2), confidence: invoice.ocrAverageConfidence - 0.05 },
            { label: "Total", value: invoice.total.toFixed(2), confidence: invoice.ocrAverageConfidence - 0.01 }
          ]
        }
      }
    });
  }

  await prisma.auditLog.createMany({
    data: [
      { action: "LOGIN", entity: "auth", entityId: admin.id, userId: admin.id, ipAddress: "127.0.0.1" },
      { action: "LOGIN", entity: "auth", entityId: analyst.id, userId: analyst.id, ipAddress: "127.0.0.1" },
      { action: "UPLOAD", entity: "invoice", entityId: "INV-2026-001", userId: admin.id, ipAddress: "127.0.0.1" },
      { action: "USER_CREATE", entity: "user", entityId: viewer.id, userId: admin.id, ipAddress: "127.0.0.1" }
    ]
  });

  return { skipped: false };
}

