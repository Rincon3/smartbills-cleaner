import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client";

const CITATION_PATTERN = /\[Factura ([^\],]+), pág\. (\d+)\]/g;
const TOP_K = 3;

const suggestedQuestions = [
  "Cuál fue mi mayor gasto?",
  "Cuánto pagué a Enel?",
  "Cuál es el NIT de Aguas de la Sabana?",
  "Cuánto pagué de energía eléctrica con Enel?",
  "Cuál es el canon de arriendo de un local en Madrid?"
];

function parseAnswer(answer) {
  const parts = [];
  let lastIndex = 0;
  const text = String(answer || "");
  const matches = text.matchAll(CITATION_PATTERN);

  for (const match of matches) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    parts.push({
      type: "citation",
      value: match[0],
      invoiceCode: match[1],
      page: Number(match[2])
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts;
}

function modeLabel(mode) {
  if (mode === "analytics") {
    return "analítica (BD)";
  }
  if (mode === "document") {
    return "documento (RAG)";
  }
  return "sin evidencia";
}

export function ConsultPage() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedSource, setSelectedSource] = useState(null);
  const threadRef = useRef(null);

  useEffect(() => {
    const node = threadRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages, loading]);

  const openSource = async (citation, sources = []) => {
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

  const handleAsk = async (event, preset) => {
    event?.preventDefault();
    const nextQuestion = String(preset || question).trim();

    if (!nextQuestion) {
      setError("Escribe una pregunta.");
      return;
    }

    setLoading(true);
    setError("");
    setSelectedSource(null);
    setQuestion("");
    setMessages((current) => [...current, { role: "user", text: nextQuestion }]);

    try {
      const payload = await api.queryInvoices({ question: nextQuestion });
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: payload.answer,
          ...payload
        }
      ]);
    } catch (queryError) {
      setError(queryError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page consult-page">
      <div className="page-header compact">
        <div>
          <p className="eyebrow">Chatbot de facturas</p>
          <h1>Pregunta sobre tus facturas</h1>
          <p>
            Analítica sobre la base de datos para totales y mayor gasto. RAG con citas para el
            contenido del documento. El hilo vive en esta sesión; no se guarda en la base.
          </p>
        </div>
      </div>

      <div className="consult-suggestions">
        {suggestedQuestions.map((item) => (
          <button
            key={item}
            className="ghost-button"
            type="button"
            onClick={(event) => handleAsk(event, item)}
            disabled={loading}
          >
            {item}
          </button>
        ))}
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="panel consult-thread" ref={threadRef}>
        {messages.length === 0 ? (
          <div className="empty-evidence">
            <strong>Empieza el hilo</strong>
            <p>Prueba una pregunta de analítica (mayor gasto) y otra de documento (NIT o energía).</p>
          </div>
        ) : null}

        {messages.map((message, index) =>
          message.role === "user" ? (
            <article key={`u-${index}`} className="chat-bubble chat-bubble--user">
              <span className="chat-role">Tú</span>
              <p>{message.text}</p>
            </article>
          ) : (
            <AssistantBubble
              key={`a-${index}`}
              message={message}
              onOpenSource={(citation) => openSource(citation, message.sources || [])}
            />
          )
        )}

        {loading ? (
          <article className="chat-bubble chat-bubble--assistant">
            <span className="chat-role">SmartBills</span>
            <p>Consultando tus facturas…</p>
          </article>
        ) : null}
      </section>

      <form className="consult-composer" onSubmit={handleAsk}>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Pregunta en español: mayor gasto, total a un proveedor, NIT, montos…"
          rows={2}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              handleAsk(event);
            }
          }}
        />
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Pensando…" : "Enviar"}
        </button>
      </form>

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

function AssistantBubble({ message, onOpenSource }) {
  const answerParts = useMemo(() => parseAnswer(message.answer || message.text), [message]);
  const sources = message.sources || [];
  const topK = message.retrieval?.topK || TOP_K;
  const elapsedMs = message.elapsedMs ?? message.retrieval?.elapsedMs;
  const showSources = message.mode === "document" && sources.length > 0;

  return (
    <article className="chat-bubble chat-bubble--assistant">
      <div className="chat-meta">
        <span className="chat-role">SmartBills</span>
        <span className={`mode-chip mode-chip--${message.mode || "none"}`}>{modeLabel(message.mode)}</span>
        <span className="chat-latency">
          {elapsedMs == null ? "—" : `${elapsedMs} ms`}
          {message.retrieval?.withinSla === false ? " · >4 s" : ""}
          {message.consensus?.selected?.provider
            ? ` · ${message.consensus.selected.provider}`
            : ""}
        </span>
      </div>

      {message.noEvidence ? (
        <div className="empty-evidence compact">
          <strong>Sin evidencia verificable</strong>
          <p>{message.answer || "No encontré evidencia en las facturas indexadas para responder esa pregunta."}</p>
        </div>
      ) : (
        <p className="consult-answer-body">
          {answerParts.map((part, index) =>
            part.type === "citation" ? (
              <button
                key={`${part.value}-${index}`}
                className="citation-chip"
                type="button"
                onClick={() => onOpenSource(part)}
              >
                {part.value}
              </button>
            ) : (
              <span key={`text-${index}`}>{part.value}</span>
            )
          )}
        </p>
      )}

      {showSources ? (
        <div className="sources-list">
          <h3 className="sources-title">Fragmentos Top-{topK}</h3>
          <p className="sources-meta">
            {sources.length} de {topK} recuperados. Haz clic para ver el texto original.
          </p>
          {sources.map((source) => (
            <button
              key={source.id || `${source.invoiceCode}-${source.page}`}
              className="source-card"
              type="button"
              onClick={() => onOpenSource(source)}
            >
              <strong>{source.citation}</strong>
              <span>
                {source.section} · chunk_source {source.chunkSource}
                {source.score != null ? ` · score ${source.score}` : ""}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}
