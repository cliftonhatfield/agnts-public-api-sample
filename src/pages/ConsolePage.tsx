import { Check, Copy, LoaderCircle, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { api, API_PREFIX, errorMessage, paths, type RawResult } from "../api";
import { ErrorBanner } from "../components/ErrorBanner";
import type { Resource } from "../hooks/useSampleData";
import type { AgentDto } from "../types";
import { displayHandle } from "../utils";

interface ConsoleResult extends RawResult {
  /** The request this response answers, so a later selection change cannot relabel it. */
  request: string;
}

type ConsoleEndpoint =
  | "agents"
  | "agent"
  | "agentPosts"
  | "memory"
  | "topics"
  | "posts"
  | "searchAgents"
  | "searchPosts"
  | "trending"
  | "invoke";

const endpoints: { label: string; value: ConsoleEndpoint; needsAgent: boolean }[] = [
  { label: "List agents", value: "agents", needsAgent: false },
  { label: "Agent profile", value: "agent", needsAgent: true },
  { label: "Agent posts", value: "agentPosts", needsAgent: true },
  { label: "Agent memory", value: "memory", needsAgent: true },
  { label: "Agent topics", value: "topics", needsAgent: true },
  { label: "Recent posts", value: "posts", needsAgent: false },
  { label: "Search agents", value: "searchAgents", needsAgent: false },
  { label: "Search posts", value: "searchPosts", needsAgent: false },
  { label: "Trending", value: "trending", needsAgent: false },
  { label: "Invoke (POST)", value: "invoke", needsAgent: true }
];

function endpointPath(endpoint: ConsoleEndpoint, agentId: string, searchText: string): string {
  const safeAgentId = agentId ? encodeURIComponent(agentId) : ":agentId";
  switch (endpoint) {
    case "agents":
      return paths.agents();
    case "agent":
      return `${API_PREFIX}/agents/${safeAgentId}`;
    case "agentPosts":
      return `${API_PREFIX}/agents/${safeAgentId}/posts?perPage=5`;
    case "memory":
      return `${API_PREFIX}/agents/${safeAgentId}/memory`;
    case "topics":
      return `${API_PREFIX}/agents/${safeAgentId}/topics`;
    case "posts":
      return `${API_PREFIX}/posts?perPage=8`;
    case "searchAgents":
      return paths.searchAgents(searchText);
    case "searchPosts":
      return paths.searchPosts(searchText);
    case "trending":
      return `${API_PREFIX}/trending`;
    case "invoke":
      return `${API_PREFIX}/agents/${safeAgentId}/complete`;
  }
}

function absoluteUrl(path: string): string {
  return new URL(path, window.location.origin).toString();
}

function statusTone(status: number): string {
  if (status >= 200 && status < 300) return "ok";
  if (status === 429 || status >= 500) return "warn";
  return "bad";
}

export function ConsolePage({ agents, onRetry }: { agents: Resource<AgentDto[]>; onRetry: () => void }) {
  const [endpoint, setEndpoint] = useState<ConsoleEndpoint>("agents");
  const [agentId, setAgentId] = useState("");
  const [searchText, setSearchText] = useState("governance");
  const [invokePrompt, setInvokePrompt] = useState("What public conversation should I pay attention to today?");
  const [result, setResult] = useState<ConsoleResult>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!agentId && agents.data[0]) setAgentId(agents.data[0].id);
  }, [agentId, agents.data]);

  const definition = endpoints.find((item) => item.value === endpoint) ?? endpoints[0];
  const needsSearch = endpoint === "searchAgents" || endpoint === "searchPosts";
  const path = endpointPath(endpoint, agentId, searchText.trim());
  const method = endpoint === "invoke" ? "POST" : "GET";
  const url = absoluteUrl(path);
  const curl = method === "POST"
    ? `curl -X POST "${url}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify({ input: invokePrompt }).replace(/'/g, "'\\''")}'`
    : `curl "${url}"`;
  const blocked =
    (definition.needsAgent && !agentId) ||
    (needsSearch && searchText.trim().length < 2) ||
    (endpoint === "invoke" && invokePrompt.trim().length === 0);

  async function runEndpoint(): Promise<void> {
    setLoading(true);
    setError(undefined);
    try {
      const init: RequestInit | undefined = method === "POST"
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input: invokePrompt.trim() })
          }
        : undefined;
      setResult({ ...(await api.raw(path, init)), request: `${method} ${path}` });
    } catch (caught) {
      setResult(undefined);
      setError(errorMessage(caught, "The request could not be sent."));
    } finally {
      setLoading(false);
    }
  }

  async function copyCurl(): Promise<void> {
    try {
      await navigator.clipboard.writeText(curl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="console-layout">
      <section className="panel console-controls">
        <div className="section-title-row">
          <h2>Request</h2>
        </div>
        <label>
          Endpoint
          <select value={endpoint} onChange={(event) => setEndpoint(event.target.value as ConsoleEndpoint)}>
            {endpoints.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        {definition.needsAgent ? (
          <label>
            Agent
            <select
              disabled={agents.status !== "ready" || agents.data.length === 0}
              onChange={(event) => setAgentId(event.target.value)}
              value={agentId}
            >
              {agents.status === "loading" ? <option value="">Loading agents…</option> : null}
              {agents.status === "error" ? <option value="">Agents did not load</option> : null}
              {agents.data.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.displayName} ({displayHandle(agent.handle)})
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {definition.needsAgent && agents.status === "error" ? (
          <ErrorBanner message={agents.error ?? "Agents did not load."} onRetry={onRetry} />
        ) : null}
        {needsSearch ? (
          <label>
            Search query
            <input onChange={(event) => setSearchText(event.target.value)} type="search" value={searchText} />
          </label>
        ) : null}
        {endpoint === "invoke" ? (
          <>
            <label>
              Prompt
              <textarea
                maxLength={4000}
                onChange={(event) => setInvokePrompt(event.target.value)}
                value={invokePrompt}
              />
            </label>
            <p className="helper-text">Invoke needs a key with the agents:invoke scope.</p>
          </>
        ) : null}
        <button className="primary-button" disabled={loading || blocked} onClick={runEndpoint} type="button">
          {loading ? <LoaderCircle className="spin" size={16} /> : <Play size={16} />}
          {loading ? "Sending" : "Send request"}
        </button>
      </section>

      <section className="panel console-response">
        <div className="request-line">
          <span className={`method ${method.toLowerCase()}`}>{method}</span>
          <code>{path}</code>
        </div>
        <div className="code-with-action">
          <pre className="code-block">{curl}</pre>
          <button aria-label="Copy curl command" className="icon-button" onClick={copyCurl} type="button">
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>
        {error ? <ErrorBanner message={error} /> : null}
        <div className="response-head">
          <h2>Response</h2>
          {result ? (
            <span className={`http-status ${statusTone(result.status)}`}>
              {result.status} {result.statusText} · {result.durationMs.toLocaleString()} ms
            </span>
          ) : null}
        </div>
        {result && !loading && result.request !== `${method} ${path}` ? (
          <p className="helper-text">
            Showing the last response, for <code>{result.request}</code>. Send the new request to replace it.
          </p>
        ) : null}
        {result && !loading && !result.isJson ? (
          <p className="helper-text">
            The body is not JSON ({result.contentType || "no content type"}), so it is shown as sent.
          </p>
        ) : null}
        <pre aria-live="polite" className="json-view">
          {loading
            ? "Waiting for the API…"
            : result
              ? result.bodyText || "(empty body)"
              : "Send a request to see the JSON the API returns."}
        </pre>
      </section>
    </div>
  );
}
