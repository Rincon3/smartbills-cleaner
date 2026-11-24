import { prisma } from "../../config/prisma.js";
import { invoiceWhereFor } from "../access.js";
import { buildInvoiceWhere, parseSearchFilters } from "../invoiceSearchService.js";

function formatCop(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function emptyResult(tool, extra = {}) {
  return {
    mode: "analytics",
    tool,
    noEvidence: true,
    answer: "No hay facturas propias para responder esa pregunta.",
    analytics: { tool, ...extra },
    citations: [],
    sources: []
  };
}

function processedWhere(user, filters = {}, extra = {}) {
  return {
    ...buildInvoiceWhere(parseSearchFilters(filters), user),
    ...invoiceWhereFor(user),
    status: "PROCESSED",
    ...extra
  };
}

export async function maxByTotal({ user, filters = {}, db = prisma } = {}) {
  const invoice = await db.invoice.findFirst({
    where: processedWhere(user, filters),
    orderBy: { total: "desc" },
    select: { code: true, total: true, supplier: true, issueDate: true }
  });

  if (!invoice) {
    return emptyResult("maxByTotal");
  }

  return {
    mode: "analytics",
    tool: "maxByTotal",
    noEvidence: false,
    answer: `Tu mayor gasto es ${invoice.code} de ${invoice.supplier} por ${formatCop(invoice.total)}.`,
    analytics: {
      tool: "maxByTotal",
      code: invoice.code,
      supplier: invoice.supplier,
      total: invoice.total,
      issueDate: invoice.issueDate
    },
    citations: [],
    sources: []
  };
}

export async function sumBySupplier({ user, supplier, filters = {}, db = prisma } = {}) {
  const hint = String(supplier || "").trim();
  if (!hint) {
    return emptyResult("sumBySupplier", { supplier: "" });
  }

  const where = processedWhere(user, filters, {
    supplier: { contains: hint, mode: "insensitive" }
  });
  const aggregate = await db.invoice.aggregate({
    where,
    _sum: { total: true },
    _count: { _all: true }
  });
  const count = aggregate._count?._all || 0;
  const total = aggregate._sum?.total;

  if (!count || total == null) {
    return emptyResult("sumBySupplier", { supplier: hint, count: 0, total: 0 });
  }

  return {
    mode: "analytics",
    tool: "sumBySupplier",
    noEvidence: false,
    answer: `Pagaste ${formatCop(total)} a ${hint} en ${count} factura${count === 1 ? "" : "s"}.`,
    analytics: { tool: "sumBySupplier", supplier: hint, total, count },
    citations: [],
    sources: []
  };
}

export async function listByMonth({ user, month, year, monthName, filters = {}, db = prisma } = {}) {
  if (month == null || Number.isNaN(Number(month))) {
    return emptyResult("listByMonth");
  }

  const invoices = await db.invoice.findMany({
    where: processedWhere(user, filters),
    select: { code: true, total: true, supplier: true, issueDate: true },
    orderBy: { issueDate: "asc" }
  });

  const matched = invoices.filter((invoice) => {
    const date = invoice.issueDate instanceof Date ? invoice.issueDate : new Date(invoice.issueDate);
    if (Number.isNaN(date.getTime())) {
      return false;
    }
    const sameMonth = date.getUTCMonth() === Number(month);
    const sameYear = year == null || date.getUTCFullYear() === Number(year);
    return sameMonth && sameYear;
  });

  if (!matched.length) {
    return emptyResult("listByMonth", { month, year, codes: [] });
  }

  const label = `${monthName || `mes ${Number(month) + 1}`}${year ? ` ${year}` : ""}`;
  const codes = matched.map((invoice) => invoice.code);

  return {
    mode: "analytics",
    tool: "listByMonth",
    noEvidence: false,
    answer: `En ${label} tienes: ${codes.join(", ")}.`,
    analytics: { tool: "listByMonth", month, year, codes, count: codes.length },
    citations: [],
    sources: []
  };
}

export async function runAnalytics(intent, { user, filters = {}, db = prisma } = {}) {
  if (intent?.tool === "maxByTotal") {
    return maxByTotal({ user, filters, db });
  }
  if (intent?.tool === "sumBySupplier") {
    return sumBySupplier({ user, supplier: intent.supplier, filters, db });
  }
  if (intent?.tool === "listByMonth") {
    return listByMonth({
      user,
      month: intent.month,
      year: intent.year,
      monthName: intent.monthName,
      filters,
      db
    });
  }
  return emptyResult(intent?.tool || "unknown");
}
