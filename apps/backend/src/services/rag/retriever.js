import { Document } from "@langchain/core/documents";
import { BaseRetriever } from "@langchain/core/retrievers";
import { RAG_TOP_K } from "./constants.js";
import { retrieveInvoiceHits } from "./retrieve.js";

export function hitToDocument(hit) {
  const code = hit.invoice?.code || hit.invoiceCode;
  return new Document({
    pageContent: hit.text,
    metadata: {
      id: hit.id,
      invoiceId: hit.invoiceId,
      invoiceCode: code,
      page: hit.page,
      section: hit.section,
      chunkSource: hit.chunkSource,
      supplier: hit.invoice?.supplier || hit.supplier,
      fileName: hit.invoice?.fileName || hit.fileName,
      score: hit.score
    }
  });
}

export function documentToHit(document) {
  const meta = document.metadata || {};
  return {
    id: meta.id,
    invoiceId: meta.invoiceId,
    invoiceCode: meta.invoiceCode,
    page: meta.page,
    section: meta.section,
    text: document.pageContent,
    chunkSource: meta.chunkSource,
    supplier: meta.supplier,
    fileName: meta.fileName,
    score: meta.score,
    invoice: {
      id: meta.invoiceId,
      code: meta.invoiceCode,
      supplier: meta.supplier,
      fileName: meta.fileName
    }
  };
}

export class InvoiceChunkRetriever extends BaseRetriever {
  static lc_name() {
    return "InvoiceChunkRetriever";
  }

  lc_namespace = ["smartbills", "retrievers"];

  constructor(fields = {}) {
    super(fields);
    this.k = Number(fields.k || RAG_TOP_K);
    this.invoiceId = fields.invoiceId || null;
    this.filters = fields.filters || {};
  }

  async _getRelevantDocuments(query) {
    const { hits } = await retrieveInvoiceHits({
      question: query,
      invoiceId: this.invoiceId,
      filters: this.filters,
      limit: this.k
    });
    return hits.map(hitToDocument);
  }
}
