# Informe OCR — SBC-69 (línea base v0)

Etiqueta: **línea base v0**. No se tunearon reglas ni el pipeline. Motor: `pdfjs` sobre 13 PDF nativos.

## Método y convenciones del gold

Gold canónico: `ocr-gold.template2.csv` (valores verificados a mano contra los originales).  
Para `compare-ocr.mjs` se genera el derivado `ocr-gold.csv` con `map-gold-template2.mjs`.

| Campo gold | Convención |
|---|---|
| fecha | Fecha de **expedición** (AAAA-MM-DD) |
| subtotal | **TOTAL OPERACIÓN MES** (SubTotal Servicios EMCALI + Otros Servicios) |
| total | **TOTAL A PAGAR** del encabezado |
| iva | Entero COP; `0` es un valor etiquetado, no un vacío |
| nit | NIT del emisor, con puntos y guion; el script compara solo dígitos |
| montos | Enteros COP sin separadores |

Vencimiento y número de factura no se etiquetaron (quedan vacíos → `n/a` en el script). Gold vacío no cuenta; IVA `0` sí cuenta. Tolerancia de montos: ±1.

## Precisión por campo (13 PDFs)

| Campo | Etiquetados | Aciertos | Precisión |
|---|---:|---:|---:|
| Proveedor | 13 | 0 | 0.00 |
| NIT | 13 | 13 | 1.00 |
| Fecha emisión | 13 | 0 | 0.00 |
| Subtotal | 13 | 0 | 0.00 |
| IVA | 13 | 0 | 0.00 |
| Total | 13 | 13 | 1.00 |
| **Global (6 campos R2)** | **78** | **26** | **0.3333** |

Umbral R2 0.90: **no cumple** (se reporta; no es criterio de aceptación). Vencimiento y número: `n/a`.

## Texto vs campos

La **extracción de texto** en estos PDF nativos es usable: `pdfjs`, `status=PROCESSED`, y el TOTAL A PAGAR del encabezado coincide en los 13 casos. El fallo está en la **extracción de campos** (reglas sobre ese texto), no en leer el PDF.

## Errores principales (un ejemplo por tipo)

1. **Proveedor toma el pie de software.** Gold: EMCALI. Pred: `Carvajal Tecnología y Servicios S.A.S - Nombre del Software: CEN-Financiero - Nit` (`2002656.pdf`).
2. **Fecha cae en hoy.** Gold `2025-01-24`; pred `2026-11-06`. Las reglas no reconocen meses en español (“24 de enero de 2025”) ni “fecha de expedición”; si no hay `DD/MM/AAAA`, se sustituye por la fecha actual.
3. **IVA inventado.** Gold `0`; pred ~2 000 000 (`2002656.pdf` → `2330876`). La regla busca “iva/impuesto” y toma otra cifra del documento.
4. **Subtotal por convención.** Gold = TOTAL OPERACIÓN MES (`1200357.pdf` → `24687523`); pred toma otro “subtotal” (`22063539.41`).

El NIT del emisor EMCALI (`890.399.003-4`) salió bien en los 13; en esta muestra no se confundió con cédula/NIT del cliente.

## Limitaciones

Un solo proveedor (EMCALI). Solo PDF nativos (sin escaneos ni fotos). Sin generalización a otros formatos. No hay demo pública de estos documentos.

## Hallazgo para US-02 (S7) — no se cambia la historia

Una fecha no reconocida **no debe sustituirse por la fecha actual**. Debe quedar vacía y marcada con baja confianza. Hoy el extractor hace `new Date()` y reporta confianza 0.8, lo que infla falsos positivos (13/13 fechas = el día de la corrida). Queda como hallazgo para US-02; esta evaluación no modifica reglas ni el ticket.
