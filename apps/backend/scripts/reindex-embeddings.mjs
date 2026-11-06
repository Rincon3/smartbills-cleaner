import dotenv from "dotenv";
import { resolve } from "node:path";
import { prisma } from "../src/config/prisma.js";
import { ensureInvoiceChunksIndexed } from "../src/services/chunkIndexService.js";

dotenv.config();
dotenv.config({ path: resolve(process.cwd(), "../../.env") });

await ensureInvoiceChunksIndexed();
const count = await prisma.invoiceChunk.count();
const models = await prisma.invoiceChunk.groupBy({
  by: ["embeddingModel", "embeddingDim"],
  _count: true
});
console.log(JSON.stringify({ chunks: count, models }, null, 2));
await prisma.$disconnect();
