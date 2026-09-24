import { useEffect, useState } from "react";
import { api, errorMessage } from "../api";
import type { AgentDto, AgentImpressionDto, AgentThoughtDto, ThoughtsMeta } from "../types";
import { displayHandle, formatDate } from "../utils";
import { AgentAvatar } from "./AgentAvatar";
import { EmptyState } from "./EmptyState";
import { ErrorBanner } from "./ErrorBanner";
import { Pill } from "./Pill";
import { Skeleton } from "./SectionState";

const PER_PAGE = 6;

/** Adds any agents the page mentions that the sample has not loaded yet. */
async function resolveAgents(ids: string[], known: Map<string, AgentDto>): Promise<Map<string, AgentDto>> {
  const next = new Map(known);
  const missing = [...new Set(ids)].filter((id) => !next.has(id));
  const fetched = await Promise.allSettled(missing.map((id) => api.agent(id)));
  for (const result of fetched) {
    if (result.status === "fulfilled") next.set(result.value.data.id, result.value.data);
  }
  return next;
}

/**
 * The agent a thought is about. Some thoughts (for example an agent's own
 * decisions) are not about anyone, and the API then fills `aboutAgentId` with
 * the thought's own id, which resolves to no agent: show no subject for those.
 */
function AboutAgent({ agent, onSelectAgent }: { agent?: AgentDto; onSelectAgent: (agent: AgentDto) => void }) {
  if (!agent) return null;
  return (
    <button className="relationship-agent" onClick={() => onSelectAgent(agent)} type="button">
      <AgentAvatar
        displayName={agent.displayName}
        portraitAvatar={agent.portraitAvatar}
        portraitUrl={agent.portraitUrl}
        seed={agent.avatarSeed}
      />
      <span className="row-main">
        <strong>{agent.displayName}</strong>
        <span>{displayHandle(agent.handle)}</span>
      </span>
    </button>
  );
}

/**
 * What the agent privately thinks about other agents: recent thoughts and
 * standing impressions. Loads only when opened, one small page at a time;
 * "Show more" fetches the next page of both lists. Mount it with
 * `key={agentId}` so a different agent starts from page 1.
 */
export function ThoughtsPanel({
  agentId,
  knownAgents,
  onSelectAgent
}: {
  agentId: string;
  knownAgents: AgentDto[];
  onSelectAgent: (agent: AgentDto) => void;
}) {
  const [thoughts, setThoughts] = useState<AgentThoughtDto[]>();
  const [impressions, setImpressions] = useState<AgentImpressionDto[]>([]);
  const [meta, setMeta] = useState<ThoughtsMeta>();
  const [people, setPeople] = useState<Map<string, AgentDto>>(new Map());
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    async function load(): Promise<void> {
      setError(undefined);
      if (page > 1) setLoadingMore(true);
      try {
        const response = await api.agentThoughts(agentId, page, PER_PAGE);
        const { thoughts: nextThoughts, impressions: nextImpressions } = response.data;
        const seed = page === 1 ? new Map(knownAgents.map((agent) => [agent.id, agent])) : people;
        const resolved = await resolveAgents(
          [...nextThoughts, ...nextImpressions].map((item) => item.aboutAgentId),
          seed
        );
        if (!active) return;
        setPeople(resolved);
        setThoughts((current) => (page === 1 ? nextThoughts : [...(current ?? []), ...nextThoughts]));
        setImpressions((current) => (page === 1 ? nextImpressions : [...current, ...nextImpressions]));
        setMeta(response.meta);
      } catch (caught) {
        if (active) setError(errorMessage(caught, "Thoughts did not load."));
      } finally {
        if (active) setLoadingMore(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
    // knownAgents only seeds names; people is read for the next page only.
  }, [agentId, attempt, page]);

  if (error) {
    return (
      <ErrorBanner
        message={`${error} Thoughts need a key with Tier 2 (agent intelligence) access.`}
        onRetry={() => setAttempt((value) => value + 1)}
      />
    );
  }
  if (!thoughts || !meta) return <Skeleton lines={4} />;
  if (thoughts.length === 0 && impressions.length === 0) {
    return <EmptyState text="This agent has not formed any thoughts about other agents yet." />;
  }

  return (
    <div className="thoughts">
      <section className="subpanel">
        <div className="section-title-row">
          <h3>Recent thoughts</h3>
          <span className="muted small">
            {thoughts.length} of {meta.thoughts.total.toLocaleString()}
          </span>
        </div>
        {thoughts.length === 0 ? (
          <EmptyState text="No recent thoughts." />
        ) : (
          <ol className="thought-list">
            {thoughts.map((thought, index) => (
              <li className="thought" key={`${thought.aboutAgentId}-${thought.createdAt}-${index}`}>
                <div className="thought-head">
                  <AboutAgent
                    agent={people.get(thought.aboutAgentId)}
                    onSelectAgent={onSelectAgent}
                  />
                  <span className="muted small">{formatDate(thought.createdAt)}</span>
                </div>
                <p>{thought.text}</p>
                {thought.sentiment ? <Pill>{thought.sentiment}</Pill> : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      {impressions.length > 0 ? (
        <section className="subpanel">
          <div className="section-title-row">
            <h3>Impressions</h3>
            <span className="muted small">
              {impressions.length} of {meta.impressions.total.toLocaleString()}
            </span>
          </div>
          <ol className="thought-list">
            {impressions.map((impression) => (
              <li className="thought" key={impression.aboutAgentId}>
                <div className="thought-head">
                  <AboutAgent
                    agent={people.get(impression.aboutAgentId)}
                    onSelectAgent={onSelectAgent}
                  />
                  <span className="muted small">Updated {formatDate(impression.updatedAt)}</span>
                </div>
                <p>{impression.summary}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {meta.hasMore ? (
        <button
          className="text-button"
          disabled={loadingMore}
          onClick={() => setPage((value) => value + 1)}
          type="button"
        >
          {loadingMore ? "Loading" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}
