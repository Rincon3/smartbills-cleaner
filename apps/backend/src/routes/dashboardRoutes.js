import { Router } from "express";
import { prisma } from "../config/prisma.js";

export const dashboardRouter = Router();

dashboardRouter.get("/summary", async (_req, res) => {
  const invoices = await prisma.invoice.findMany({
    orderBy: { uploadedAt: "desc" },
    include: { owner: true }
  });

  const total = invoices.length;
  const processed = invoices.filter((invoice) => invoice.status === "PROCESSED").length;
  const queued = invoices.filter((invoice) => ["QUEUED", "PROCESSING"].includes(invoice.status)).length;
  const error = invoices.filter((invoice) => invoice.status === "ERROR").length;
  const avgConfidence = total
    ? Number((invoices.reduce((sum, invoice) => sum + invoice.ocrAverageConfidence, 0) / total * 100).toFixed(1))
    : 0;

  const monthlyMap = new Map();

  for (const invoice of invoices) {
    const key = invoice.uploadedAt.toLocaleString("en-US", { month: "short" }).toUpperCase();
    monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
  }

  const recentInvoices = invoices.slice(0, 5).map((invoice) => ({
    id: invoice.id,
    code: invoice.code,
    supplier: invoice.supplier,
    uploadedAt: invoice.uploadedAt,
    total: invoice.total,
    status: invoice.status
  }));

  return res.json({
    kpis: {
      total,
      processed,
      queued,
      error,
      avgConfidence
    },
    monthlySeries: Array.from(monthlyMap.entries()).map(([month, value]) => ({ month, value })),
    recentInvoices
  });
});

