# Paquete de evidencia — Sprint 5 (S5) · DOC-01 (SBC-67)

Instancia de trabajo. **Cierre canónico:** `docs/sprint-5/evidencia-sprint.md`. Para S6 copiar la estructura de ese archivo a `docs/sprint-6/evidencia-sprint.md`.

Fecha inicio (plan): 2026-11-09 — **completar yo** si Jira difiere  
Fecha cierre (plan): 2026-11-29 — **completar yo**  
Trabajo en git: 2026-11-06 (X-01, US-04, OCR, RAGAS)  
Capacidad: 13 SP comprometidos + 3 buffer  
1 SP ≈ 4 h  
Rama: `feature/s4-metricas` · repo: https://github.com/Rincon3/smartbills-cleaner

## 1. Compromiso (planning)

| ID Jira | Resumen | ID Excel | SP | Must/Should |
|---|---|---|---:|---|
| SBC-66 | [X-01] Spike Educate: Bedrock texto, S3, hosting | extra | 1 | Must |
| SBC-67 | [DOC-01] Evidencia Scrum S5 | TI3 §5 | 1 | Must |
| SBC-68 | [US-04] Titan v2 dim 1024 + reindex | US-04 | 5 | Must |
| SBC-69 | [US-01][US-02] Eval OCR 10–12 facturas | US-01.2, US-02.1 | 3 | Must |
| SBC-70 | [TK-03] RAGAS antes/después | TK-03 | 3 | Must |

**Velocidad comprometida:** 13 SP  
**Buffer reservado (no asignar):** 3 SP

## 2. Cierre (review)

| ID Jira | SP Done | SP Parcial | SP No hecho | Notas |
|---|---:|---:|---:|---|
| SBC-66 | 1 | | | Commit `7e9f0dd` 2026-11-06. PLAN_A_EC2. |
| SBC-68 | 5 | | | Commit `02f2bb7` 2026-11-06. Q01 Enel 4.º→1.º. |
| SBC-69 | 3 | | | Commit `2ea614d` 2026-11-06. Línea base v0, global 0.33. |
| SBC-70 | 3 | | | Commit `cd5cc91` 2026-11-06. RAGAS 0.680→0.688; no se afirma mejora. |
| SBC-67 | 1 | | | Cierre en `docs/sprint-5/evidencia-sprint.md`. |

**Velocidad entregada:** 13 / 13 SP en git  
**Buffer usado:** 0 de 3

### Commits

| Clave | Hash | Fecha git | Enlace |
|---|---|---|---|
| SBC-66 | `7e9f0dde38969683443c93585ddca79993a0b008` | 2026-11-06 | https://github.com/Rincon3/smartbills-cleaner/commit/7e9f0dde38969683443c93585ddca79993a0b008 |
| SBC-68 | `02f2bb7dab345a2fb5bb38426f4255570880879e` | 2026-11-06 | https://github.com/Rincon3/smartbills-cleaner/commit/02f2bb7dab345a2fb5bb38426f4255570880879e |
| SBC-70 | `cd5cc91090092f3e0a6e4d781fd3000d7783abca` | 2026-11-06 | https://github.com/Rincon3/smartbills-cleaner/commit/cd5cc91090092f3e0a6e4d781fd3000d7783abca |
| SBC-69 | `2ea614d633281eff12bfed6074fcb5b961e0ae6a` | 2026-11-06 | https://github.com/Rincon3/smartbills-cleaner/commit/2ea614d633281eff12bfed6074fcb5b961e0ae6a |
| SBC-67 | este commit | 2026-11-06 | clave `SBC-67` en el mensaje |

## 3. Burndown (3 semanas)

| Fin de semana | SP restantes (ideal) | SP restantes (real) |
|---|---|---|
| 0 | 13 | 13 |
| 1 | 8–9 | **completar yo** |
| 2 | 4–5 | **completar yo** |
| 3 | 0 | **completar yo** |

Pegar captura del burndown de Jira (o esta tabla si Jira no lo tiene). **completar yo**

## 4. Eventos

| Evento | Fecha | Evidencia (link Jira / 5 líneas) |
|---|---|---|
| Planning | **completar yo** | **completar yo** — compromiso 13+3 según `plan-vigente-s5-s8.md` |
| Daily (mín. 3 notas) | **completar yo** | Ver preguntas guía abajo |
| Review | **completar yo** | Guion de 5 min en `docs/sprint-5/confluence-sprint-5.md` §2 |
| Retro | **completar yo** | Ver preguntas guía abajo |

### Preguntas guía — nota tipo daily (**completar yo**)

1. ¿Qué historia moví ayer y a qué estado (To Do / In progress / Done)?
2. ¿Qué bloqueo hubo (Bedrock, Educate, gold OCR, tiempo)?
3. ¿Qué haré hoy y cuántos SP quedan del compromiso?

Mínimo 3 notas (no hace falta un daily literal por día). Pegar aquí o link a Jira.

### Preguntas guía — retro corta (**completar yo**)

1. Qué funcionó (1): ¿el protocolo hash-antes / Titan-después evitó mezclar dimensiones?
2. Qué cambiar (1): ¿la muestra OCR de un solo proveedor, o el fallback de fecha a “hoy”?
3. Una acción para S6: ¿US-08 primero, antes de cualquier demo con datos reales?

## 5. Matriz requisito → prueba (solo lo de este sprint)

| ID Excel | Criterio | Prueba o captura | Resultado |
|---|---|---|---|
| extra / X-01 | Inventario Bedrock texto, S3, hosting + PLAN_* | `docs/sprint-5/aws-educate-inventario.md` + ADR 001 · `7e9f0dd` | PASS |
| US-04 | Ranking hash vs Titan; dim 1024; no mezclar | `queries-hash-vs-titan.csv` · tests backend 27 · `02f2bb7` | PASS (Enel Q01 4.º→1.º) |
| US-04 error | Bedrock caído → no escribir hash en vector(1024) | modo `degraded` en búsqueda | PASS en código |
| US-01.2 / US-02.1 | Precisión por campo sobre gold | `informe-ocr.md` · `compare-ocr.mjs` · `2ea614d` | PASS (medido; no ≥90 %) |
| TK-03 | RAGAS antes/después + nota faithfulness | `informe-ragas.md` · `cd5cc91` | PASS (0.680→0.688; meta 0.85 no es AC) |
| TI3 §5 / DOC-01 | Paquete evidencia + Confluence | `evidencia-sprint.md` + `confluence-sprint-5.md` | PASS |

Meta no AC: OCR ≥90 % y RAGAS 0.85 → no cumplidas; se reportan.

## 6. Desvíos registrados este sprint

| ID desvío | Qué cambió | Justificación | ¿Director lo vio? |
|---|---|---|---|
| Textract | OCR local | Educate: no disponible | **completar yo** |
| Dim 1024 | No 1536 | Titan v2, no v1 | **completar yo** |
| S3 como must R2 | Disco/volumen; S3 sí existe pero no es entrega S5 | X-01 / A8 | **completar yo** |
| Muestra OCR | 1 proveedor, solo nativos (plan pedía mixto) | Lote EMCALI nativo disponible | **completar yo** |
| RAGAS ≥0.85 | Se mide, no se promete | Faithfulness 1.0 por construcción; n=5 | **completar yo** |

## 7. Guion de demo (5 min) — review

1. **(30 s)** Compromiso: 13 SP. Demo solo `DEMO-VEC`, sin PDF reales en pantalla.
2. **(90 s)** Facturas → buscar `energia electrica` sin proveedor. Decir: hash dejaba Enel 4.ª; Titan v2 1024 la deja 1.ª. Mostrar modo `sql+pgvector`.
3. **(45 s)** Tabla `queries-hash-vs-titan.csv` (Q01 y una que no cambia).
4. **(60 s)** OCR línea base v0: precisión global 0.33; NIT y total 1.00; proveedor/fecha/subtotal/IVA 0. Texto nativo sí; reglas no. Un proveedor, solo nativos. PDFs no se muestran.
5. **(45 s)** RAGAS 0.680 vs 0.688; no afirmar mejora; 0.85 es meta; faithfulness 1.0 por citas.
6. **(30 s)** PLAN_A_EC2 (rol IAM); Lightsail descartado; Textract no; S7 publica, no S5.

Limitaciones a decir en voz alta: muestra OCR no generaliza; RAGAS n=5; costo t3.small pendiente; US-08 aún no, cero datos reales en público.
