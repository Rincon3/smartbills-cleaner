-- CreateTable
CREATE TABLE "InvoiceChunk" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "page" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "chunkSource" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvoiceChunk_invoiceId_page_idx" ON "InvoiceChunk"("invoiceId", "page");

-- CreateIndex
CREATE INDEX "InvoiceChunk_chunkSource_idx" ON "InvoiceChunk"("chunkSource");

-- AddForeignKey
ALTER TABLE "InvoiceChunk" ADD CONSTRAINT "InvoiceChunk_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
