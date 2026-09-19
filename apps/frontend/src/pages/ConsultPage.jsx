import { useMemo, useState } from "react";
import { api } from "../api/client";

const CITATION_PATTERN = /\[Factura ([^\],]+), pág\. (\d+)\]/g;

const suggestedQuestions = [
  "Cual es el NIT de Editorial Alpha?",
  "Cuanto es el total a pagar de Global News Media?",
  "Que IVA aparece en la factura de Distribuidora Continental?"
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
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedSource, setSelectedSource] = useState(null);

  const answerParts = useMemo(() => parseAnswer(result?.answer), [result]);

  const openSource = async (citation) => {
    const match =
      result?.sources?.find(
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
    const nextQuestion = question.trim();

    if (!nextQuestion) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = await api.queryInvoices({ question: nextQuestion });
      setResult(payload);
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
          <p className="eyebrow">Identificacion de facturas</p>
          <h1>Consulta con citas</h1>
          <p>
            Cada respuesta incluye referencias verificables al documento fuente en el formato
            [Factura X, pág. Y].
          </p>
        </div>
      </div>

      <form className="panel consult-form" onSubmit={handleAsk}>
        <label>
          Pregunta sobre tus facturas
          <textarea
            rows="3"
            placeholder="Ejemplo: Cual es el total de la factura INV-2026-001?"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
        </label>
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
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Buscando evidencia..." : "Preguntar"}
        </button>
      </form>

      {error ? <div className="error-banner">{error}</div> : null}

      {result ? (
        <section className="panel consult-answer">
          <div className="panel-heading">
            <div>
              <h3>Respuesta</h3>
              <p>Las citas apuntan al fragmento original indexado con chunk_source.</p>
            </div>
          </div>
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

          <div className="sources-list">
            {(result.sources || []).map((source) => (
              <button
                key={source.id}
                className="source-card"
                type="button"
                onClick={() => openSource(source)}
              >
                <strong>{source.citation}</strong>
                <span>
                  {source.section} · chunk_source {source.chunkSource}
                </span>
              </button>
            ))}
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
