import { useMemo, useState } from "react";
import { api } from "../api/client";
import { AdvancedSearchForm, emptyFilters } from "../components/AdvancedSearchForm";

const CITATION_PATTERN = /\[Factura ([^\],]+), pág\. (\d+)\]/g;
const TOP_K = 5;

const suggestedQuestions = [
  "Cual es el NIT de Aguas de la Sabana?",
  "Cuanto pague de energia electrica con Enel?",
  "Hay alguna factura de papeleria o utiles de oficina?",
  "Cual es el canon de arriendo de un local en Madrid?"
];

function parseAnswer(answer) {
  const parts = [];
  let lastIndex = 0;
  const matches = String(answer || "").matchAll(CITATION_PATTERN);

  for (const match of matches) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: answer.slice(lastIndex, match.index) });
    }

    parts.push({
      type: "citation",
      value: match[0],
      invoiceCode: match[1],
      page: Number(match[2])
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < String(answer || "").length) {
    parts.push({ type: "text", value: answer.slice(lastIndex) });
  }

  return parts;
}

export function ConsultPage() {
  const [question, setQuestion] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedSource, setSelectedSource] = useState(null);

  const answerParts = useMemo(() => parseAnswer(result?.answer), [result]);
  const sources = result?.sources || [];
  const topK = result?.retrieval?.topK || TOP_K;
  const noEvidence = Boolean(result?.noEvidence) || sources.length === 0;
  const elapsedMs = result?.elapsedMs ?? result?.retrieval?.elapsedMs;

  const openSource = async (citation) => {
    const match =
      sources.find(
        (source) =>
          source.invoiceCode === citation.invoiceCode && Number(source.page) === Number(citation.page)
      ) || null;

    if (match) {
      setSelectedSource(match);
      return;
    }

    try {
      const source = await api.getQuerySource({
        invoiceId: citation.invoiceId,
        invoiceCode: citation.invoiceCode,
        page: citation.page,
        chunkId: citation.id
      });
      setSelectedSource(source);
    } catch (sourceError) {
      setError(sourceError.message);
    }
  };

  const handleAsk = async (event) => {
    event.preventDefault();
    const nextQuestion = question.trim() || filters.q.trim();

    if (!nextQuestion) {
      setError("Escribe una pregunta o una palabra clave.");
      return;
    }

    setLoading(true);
    setError("");
    setSelectedSource(null);

    try {
      const payload = await api.queryInvoices({
        question: nextQuestion,
        supplier: filters.supplier,
        status: filters.status,
        from: filters.from,
        to: filters.to,
        minTotal: filters.minTotal,
        maxTotal: filters.maxTotal
      });
      setResult(payload);
      setQuestion(nextQuestion);
    } catch (queryError) {
      setError(queryError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page">
      <div className="page-header compact">
        <div>
          <p className="eyebrow">Consultas RAG inteligente</p>
          <h1>Pregunta y filtra con evidencia</h1>
          <p>
            Respuesta en español con citas clicables. Top-{TOP_K} fragmentos. Si no hay evidencia, se
            indica sin inventar documentos. Objetivo: menos de 4 s.
          </p>
        </div>
      </div>

      <AdvancedSearchForm
        filters={{ ...filters, q: question }}
        onChange={(next) => {
          setFilters(next);
          setQuestion(next.q);
        }}
        onSubmit={handleAsk}
        onReset={(cleared) => {
          setFilters(cleared);
          setQuestion("");
          setResult(null);
        }}
        loading={loading}
        submitLabel="Preguntar"
        showStatus
      />

      <div className="consult-suggestions">
        {suggestedQuestions.map((item) => (
          <button
            key={item}
            className="ghost-button"
            type="button"
            onClick={() => setQuestion(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      {result ? (
        <section className="panel consult-answer">
          <div className="panel-heading">
            <div>
              <h3>Respuesta</h3>
              <p>
                Top-{topK} · {elapsedMs == null ? "—" : `${elapsedMs} ms`}
                {result.retrieval?.withinSla === false ? " · supera 4 s" : " · dentro de 4 s"}
                {result.consensus?.selected
                  ? ` · consenso ${result.consensus.selected.role} (${result.consensus.selected.provider})`
                  : ""}
              </p>
            </div>
          </div>

          {noEvidence ? (
            <div className="empty-evidence">
              <strong>Sin evidencia verificable</strong>
              <p>
                {result.answer ||
                  "No encontré evidencia en las facturas indexadas para responder esa pregunta."}
              </p>
            </div>
          ) : (
            <p className="consult-answer-body">
              {answerParts.map((part, index) =>
                part.type === "citation" ? (
                  <button
                    key={`${part.value}-${index}`}
                    className="citation-chip"
                    type="button"
                    onClick={() => openSource(part)}
                  >
                    {part.value}
                  </button>
                ) : (
                  <span key={`text-${index}`}>{part.value}</span>
                )
              )}
            </p>
          )}

          <div className="sources-list">
            <h3 className="sources-title">Fragmentos Top-{topK}</h3>
            <p className="sources-meta">
              {sources.length} de {topK} recuperados. Haz clic para ver el texto original.
            </p>
            {sources.length === 0 ? (
              <div className="empty-evidence compact">No hay fragmentos en el Top-{topK} para esta pregunta.</div>
            ) : (
              sources.map((source) => (
                <button
                  key={source.id || `${source.invoiceCode}-${source.page}`}
                  className="source-card"
                  type="button"
                  onClick={() => openSource(source)}
                >
                  <strong>{source.citation}</strong>
                  <span>
                    {source.section} · chunk_source {source.chunkSource}
                    {source.score != null ? ` · score ${source.score}` : ""}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>
      ) : null}

      {selectedSource ? (
        <div className="drawer-backdrop" onClick={() => setSelectedSource(null)}>
          <aside className="drawer" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <p>Fragmento original</p>
                <h3>{selectedSource.citation}</h3>
              </div>
              <button className="ghost-button" type="button" onClick={() => setSelectedSource(null)}>
                Cerrar
              </button>
            </div>
            <div className="source-preview">
              <p>
                <strong>Seccion:</strong> {selectedSource.section}
              </p>
              <p>
                <strong>chunk_source:</strong> {selectedSource.chunkSource}
              </p>
              <p>
                <strong>Archivo:</strong> {selectedSource.invoiceCode}
              </p>
              <pre>{selectedSource.text}</pre>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
