import { prisma } from "../config/prisma.js";
import { EMBEDDING_MODEL, VECTOR_SIZE } from "../utils/embeddings.js";
import { embedForRetrieval } from "../utils/titanEmbeddings.js";
import { buildChunkSource, buildInvoicePages } from "./invoiceDocument.js";
import { parseOcrPages } from "./ocr/ocrEngine.js";
import { replaceInvoiceChunks } from "./vectorStore.js";

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

  const chunks = [];
  for (const page of payload) {
    chunks.push({
      page: page.page,
      section: page.section,
      text: page.text,
      chunkSource: buildChunkSource(invoice.id, page.page),
      embedding: await embedForRetrieval(
        `${invoice.code} ${invoice.supplier} ${invoice.taxId} ${page.section} ${page.text}`
      ),
      embeddingModel: EMBEDDING_MODEL,
      embeddingDim: VECTOR_SIZE
    });
  }

  return replaceInvoiceChunks(invoice.id, chunks);
}

export async function ensureInvoiceChunksIndexed() {
  const invoices = await prisma.invoice.findMany({
    select: { id: true }
  });

  for (const invoice of invoices) {
    const count = await prisma.invoiceChunk.count({
      where: { invoiceId: invoice.id }
    });
    const stale = await prisma.invoiceChunk.count({
      where: {
        invoiceId: invoice.id,
        OR: [{ embeddingModel: { not: EMBEDDING_MODEL } }, { embeddingDim: { not: VECTOR_SIZE } }]
      }
    });

    if (count === 0 || stale > 0) {
      try {
        await indexInvoiceChunks(invoice.id);
      } catch (error) {
        console.error(`No se reindexó ${invoice.id} con Titan; no se escribe hash en vector(1024).`, error.message);
      }
    }
  }
}
