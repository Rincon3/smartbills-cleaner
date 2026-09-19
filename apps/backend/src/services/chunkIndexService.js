import { prisma } from "../config/prisma.js";
import { embedText } from "../utils/embeddings.js";
import { buildChunkSource, buildInvoicePages } from "./invoiceDocument.js";
import { parseOcrPages } from "./ocr/ocrEngine.js";

function toIndexPages(invoice, pageTexts) {
  if (pageTexts?.length) {
    return pageTexts.map((page, index) => ({
      page: page.page || index + 1,
      section: page.section || `Página ${page.page || index + 1}`,
      text: page.text || ""
    }));
  }

  const stored = parseOcrPages(invoice.ocrRawText);
  if (stored.length) {
    return stored;
  }

  return buildInvoicePages(invoice);
}

export async function indexInvoiceChunks(invoiceId, pageTexts = null) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { fields: true }
  });

  if (!invoice) {
    return [];
  }

  const pages = toIndexPages(invoice, pageTexts).filter((page) => page.text?.trim());
  const payload = pages.length ? pages : buildInvoicePages(invoice);

  await prisma.invoiceChunk.deleteMany({ where: { invoiceId: invoice.id } });

  const created = await prisma.$transaction(
    payload.map((page) =>
      prisma.invoiceChunk.create({
        data: {
          invoiceId: invoice.id,
          page: page.page,
          section: page.section,
          text: page.text,
          chunkSource: buildChunkSource(invoice.id, page.page),
          embedding: embedText(`${invoice.code} ${page.section} ${page.text}`)
        }
      })
    )
  );

  return created;
}

export async function ensureInvoiceChunksIndexed() {
  const invoices = await prisma.invoice.findMany({
    select: { id: true }
  });

  for (const invoice of invoices) {
    const count = await prisma.invoiceChunk.count({
      where: { invoiceId: invoice.id }
    });

    if (count === 0) {
      await indexInvoiceChunks(invoice.id);
    }
  }
}
