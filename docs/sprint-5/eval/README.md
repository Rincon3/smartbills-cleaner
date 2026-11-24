# Evaluación S5 (OCR + embeddings + RAGAS)

No cambia la aplicación. Orden **obligatorio**:

1. Llenar `queries-hash-vs-titan.csv` **con hash** (antes de migrar `vector(96)`): `npm run eval:rank -- hash`.
2. `npm run eval:ragas -- --hash` en `apps/backend` → guardar `docs/sprint-5/eval/ragas-antes.json`.
3. Implementar Titan 1024, reindex (`npm run reindex:embeddings`), **entonces** `npm run eval:rank -- titan`.
4. `npm run eval:ragas` otra vez → `docs/sprint-5/eval/ragas-despues.json`.
5. Etiquetar 10–12 facturas reales en `ocr-gold.csv` (copia de `ocr-gold.template.csv`).
6. Tras subirlas, copiar campos extraídos a `ocr-pred.csv`.
7. `node docs/sprint-5/eval/compare-ocr.mjs docs/sprint-5/eval/ocr-gold.csv docs/sprint-5/eval/ocr-pred.csv`

## Cómo llenar el ranking hash/Titan

En `/app/invoices`, buscar **sin** filtro de proveedor. Anotar los `code` del top-3 y top-5 y el puesto del `target_code` (1–n, o “no aparece”).

Q01 Must: “energia electrica” → Enel (`DEMO-VEC-05`) en **top-3 con Titan**.

## Facturas reales (10–12)

- ≥ 4 proveedores distintos (energía, telecom, acueducto, combustible o papelería).
- ≥ 4 PDF nativos, ≥ 4 escaneos o fotos, ≥ 2 “difíciles” (sello, sesgo, baja luz).
- Montos en COP con miles (p. ej. `139.825`).
- No uses los `DEMO-VEC` como gold de precisión.
- **Antes de guardar PDFs, fotos o CSV en el repo**, anonimiza NIT, dirección, NIC y nombres: no subas facturas reales identificables (ni a `docs/`, ni a `uploads/` versionado, ni al anexo del TI3).

Campos que entran al umbral R2: proveedor, NIT, fecha emisión, subtotal, IVA, total.  
Vencimiento y número de factura se miden aparte (el extractor actual casi no tiene vencimiento).
