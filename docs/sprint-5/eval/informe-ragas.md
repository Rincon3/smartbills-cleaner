# Informe RAGAS — SBC-70 (TK-03)

Suite propia (`ragasMetrics.js`), no la librería oficial. Mismos 5 casos (`evalCases.js`) antes (hash 96) y después (Titan v2 1024). Generador extractivo local (`grounded-top1` / `grounded-top3`). Umbral 0.85: **meta, no criterio de aceptación**.

Reproducción:

```bash
cd apps/backend
npm run eval:ragas -- --hash   # → docs/sprint-5/eval/ragas-antes.json
npm run eval:ragas             # → docs/sprint-5/eval/ragas-despues.json
```

## Métricas

| Métrica | Qué mide aquí |
|---|---|
| faithfulness | Fracción de citas `[Factura CODE, pág. n]` que están en el contexto recuperado; si no hay citas y la respuesta es “no encontré…”, vale 1 |
| context_precision | Fracción de hits Top-K cuyo `code` está en `relevantCodes` |
| context_recall | Fracción de `relevantCodes` que aparecen en el Top-K; si la lista gold está vacía, vale 1 |
| answer_relevancy | Coseno hash (96) entre pregunta y respuesta |
| ragas | Media de las cuatro anteriores |

## Promedios hash vs Titan

| Métrica | Hash (antes) | Titan 1024 (después) | Delta |
|---|---:|---:|---:|
| faithfulness | 1.0000 | 1.0000 | 0 |
| context_precision | 0.4400 | 0.4400 | 0 |
| context_recall | 1.0000 | 1.0000 | 0 |
| answer_relevancy | 0.2790 | 0.3131 | +0.0341 |
| **ragas** | **0.6797** | **0.6883** | **+0.0086** |

No se afirma mejora: n=5 y el único cambio de respuesta es el caso sin evidencia. 0.6883 queda por debajo de la meta 0.85.

## Por pregunta

| Caso | ragas hash | ragas Titan | ¿Cambió la respuesta? |
|---|---:|---:|---|
| enel-energia | 0.6832 | 0.6832 | No |
| aguas-nit | 0.8462 | 0.8462 | No |
| papeleria | 0.7094 | 0.7094 | No |
| claro-plan | 0.6599 | 0.6599 | No |
| sin-evidencia | 0.5000 | 0.5426 | Sí: hash citó ELECTR; Titan respondió sin evidencia |

Faithfulness = 1.0 en los diez puntajes: o las citas coinciden con lo recuperado, o aplica la regla del vacío. No mide alucinación de contenido fuera de esa comprobación.

Answer_relevancy bajo (0.24–0.44 en casos con evidencia): el generador copia fragmentos, no reformula. El coseno hash entre pregunta y ese extracto es débil por diseño.

Context_precision 0.44: Top-5 mezcla facturas no gold (p. ej. ELECTR junto a Enel). Context_recall 1.0 incluye el caso sin gold (`relevantCodes: []` → 1 por definición).

## Limitaciones

- Solo 5 preguntas, corpus mixto demo + facturas locales.
- Faithfulness 1.0 por construcción (se filtran / se puntúan citas, no el texto libre).
- Answer_relevancy usa el hash de 96, no Titan.
- Delta 0.680 → 0.688 no es significativo con esta muestra.
- No es RAGAS oficial.

## Trabajo futuro (no comprometido)

Probar un generador LLM (p. ej. Nova Lite ON_DEMAND) sobre los mismos 5 casos, sin cambiar el gold. Fuera del alcance de SBC-70 / S5.
