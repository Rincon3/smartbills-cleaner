# Paquete de evidencia — Sprint 5 (S5) · DOC-01 (SBC-67)

Cierre de la historia: este archivo + `confluence-sprint-5.md` + capturas en `docs/sprint-5/evidencia/`.

Fecha inicio (plan): 2026-11-09 — **por confirmar** si Jira difiere  
Fecha cierre (plan): 2026-11-29 — **por confirmar**  
Trabajo en git: 2026-11-06 (X-01, US-04, OCR, RAGAS, DOC-01)  
Capacidad: 13 SP comprometidos + 3 buffer (el buffer **no se asignó**)  
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
**Buffer reservado (no asignar):** 3 SP · **usado: 0**

## 2. Cierre (review)

| ID Jira | SP Done | SP Parcial | SP No hecho | Notas |
|---|---:|---:|---:|---|
| SBC-66 | 1 | | | Commit `7e9f0dd` 2026-11-06. PLAN_A_EC2. |
| SBC-68 | 5 | | | Commit `02f2bb7` 2026-11-06. Q01 Enel 4.º→1.º. |
| SBC-69 | 3 | | | Commit `2ea614d` 2026-11-06. Línea base v0, global 0.33. |
| SBC-70 | 3 | | | Commit `cd5cc91` 2026-11-06. RAGAS 0.680→0.688; no se afirma mejora. |
| SBC-67 | 1 | | | Este paquete. Cierra DOC-01 en git. |

**Velocidad entregada en git:** 13 / 13 SP  
**Buffer usado:** 0 de 3

### Commits

| Clave | Hash | Fecha git | Enlace |
|---|---|---|---|
| SBC-66 | `7e9f0dde38969683443c93585ddca79993a0b008` | 2026-11-06 | https://github.com/Rincon3/smartbills-cleaner/commit/7e9f0dde38969683443c93585ddca79993a0b008 |
| SBC-68 | `02f2bb7dab345a2fb5bb38426f4255570880879e` | 2026-11-06 | https://github.com/Rincon3/smartbills-cleaner/commit/02f2bb7dab345a2fb5bb38426f4255570880879e |
| SBC-70 | `cd5cc91090092f3e0a6e4d781fd3000d7783abca` | 2026-11-06 | https://github.com/Rincon3/smartbills-cleaner/commit/cd5cc91090092f3e0a6e4d781fd3000d7783abca |
| SBC-69 | `2ea614d633281eff12bfed6074fcb5b961e0ae6a` | 2026-11-06 | https://github.com/Rincon3/smartbills-cleaner/commit/2ea614d633281eff12bfed6074fcb5b961e0ae6a |
| SBC-67 | este commit | 2026-11-06 | clave `SBC-67` en el mensaje |

## 3. Burndown

Jira no entregó un burndown clásico por SP. Lo que hay es el resumen de actividades (captura `evidencia/jira-s5-burndown.png`): **8 finalizadas** en 7 días; el donut es del tablero amplio (42 actividades: 8 Done, 4 In Progress, 30 To Do), no del compromiso de 13 SP.

Velocidad que sí se puede auditar: **13 SP en git** (commits de la tabla §2). Tablero del sprint: `evidencia/jira-s5-tablero.png`.

## 4. Eventos

| Evento | Fecha | Evidencia |
|---|---|---|
| Planning | plan 9 nov (**por confirmar** en Jira) | Compromiso 13+3 en `plan-vigente-s5-s8.md` |
| Daily | — | No hay notas daily en git. No se reconstruyen. |
| Review | 2026-11-06 (Avance 6) | Guion en `confluence-sprint-5.md` §2 |
| Retro | pegada en Confluence | `evidencia/confluence-s5.png` · texto en `confluence-sprint-5.md` §7 |

## 5. Matriz requisito → prueba (solo este sprint)

| ID Excel | Criterio | Prueba o captura | Resultado |
|---|---|---|---|
| extra / X-01 | Inventario Bedrock texto, S3, hosting + PLAN_* | `aws-educate-inventario.md` + ADR 001 · `7e9f0dd` | PASS |
| US-04 | Ranking hash vs Titan; dim 1024; no mezclar | `eval/queries-hash-vs-titan.csv` · tests 27/27 · `02f2bb7` | PASS (Enel Q01 4.º→1.º) |
| US-04 error | Bedrock caído → no escribir hash en vector(1024) | modo `degraded` en búsqueda | PASS en código |
| US-01.2 / US-02.1 | Precisión por campo sobre gold | `eval/informe-ocr.md` · `2ea614d` | PASS (medido; no ≥90 %) |
| TK-03 | RAGAS antes/después + nota faithfulness | `eval/informe-ragas.md` · `cd5cc91` | PASS (0.680→0.688; meta 0.85 no es AC) |
| TI3 §5 / DOC-01 | Paquete evidencia + Confluence | este archivo + `confluence-sprint-5.md` | PASS (cierre en git) |

Meta no AC: OCR ≥90 % y RAGAS 0.85 → no cumplidas; se reportan.

## 6. Desvíos registrados este sprint

| ID desvío | Qué cambió | Justificación | ¿Director lo vio? |
|---|---|---|---|
| Textract | OCR local | Educate: no disponible | **por confirmar** |
| Dim 1024 | No 1536 | Titan v2, no v1 | **por confirmar** |
| S3 como must R2 | Disco local en R2 | X-01 / A8 | **por confirmar** |
| Muestra OCR | 1 proveedor, solo nativos | Lote EMCALI nativo disponible | **por confirmar** |
| RAGAS ≥0.85 | Se mide, no se promete | Faithfulness 1.0 por citas; n=5 | **por confirmar** |

## 7. Retro (transcrita de Confluence; no inventada)

Fuente: `evidencia/confluence-s5.png` (página *Objetivos y retrospectiva*, Sprint 5).

**Qué funcionó**

- Medir antes de afirmar: las líneas base (hash vs Titan, OCR v0, RAGAS antes/después) dieron evidencia defendible. Enel pasó del puesto 4 al 1.
- El spike X-01 al inicio despejó la incertidumbre de AWS (Textract no, Bedrock sí, EC2 con rol IAM) antes de comprometer S6 y S7.
- Un commit por historia, con la clave de Jira y revisión del diff antes de subir: sin secretos ni datos personales en el repo.
- Se reportaron las limitaciones sin inflarlas (RAGAS 0.680 → 0.688 sin declarar mejora; OCR 0.33 sin ajustar reglas).
- Trabajar por fases con aprobación entre cada una evitó cambios que no pedía el sprint.

**Qué cambiar**

- Las claves de Jira sugeridas en los CSV no coincidieron con las reales (SBC-66 a SBC-70) y obligaron a corregir documentos y mensajes de commit.
- La importación a Jira dio varios errores (criterios de aceptación, épica, ID de actividad) y consumió tiempo.
- La muestra de OCR quedó limitada a un proveedor y a PDFs nativos; el gold se armó tarde.
- El trabajo y los cambios de estado en Jira se concentraron en pocos días (el resto del párrafo está recortado en la captura; no se completa aquí).

**Acción S6:** no aparece completa en la captura. No se inventa. En el plan vigente la primera historia de S6 es US-08 (aislamiento).
