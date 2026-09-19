import { Router } from "express";
import { getChunkSource, queryInvoices } from "../services/queryService.js";

export const queryRouter = Router();

queryRouter.post("/", async (req, res) => {
  const question = String(req.body?.question || "").trim();
  const invoiceId = req.body?.invoiceId || null;

  if (!question) {
    return res.status(400).json({ message: "La pregunta es requerida" });
  }

  const result = await queryInvoices({ question, invoiceId });
  return res.json(result);
});

queryRouter.get("/source", async (req, res) => {
  const { chunkId, invoiceId, invoiceCode, page } = req.query;

  if (!chunkId && !((invoiceId || invoiceCode) && page)) {
    return res.status(400).json({ message: "Indica chunkId o factura_id + pagina" });
  }

  const source = await getChunkSource({ chunkId, invoiceId, invoiceCode, page });

  if (!source) {
    return res.status(404).json({ message: "Fragmento no encontrado en el documento fuente" });
  }

  return res.json(source);
});
