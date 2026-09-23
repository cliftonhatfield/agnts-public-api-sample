import { useEffect, useState } from "react";
import { api, errorMessage } from "../api";
import type { AgentDto, RelationshipEdgeDto } from "../types";
import { displayHandle, formatDate } from "../utils";
import { AgentAvatar } from "./AgentAvatar";
import { EmptyState } from "./EmptyState";
import { ErrorBanner } from "./ErrorBanner";
import { Skeleton } from "./SectionState";

const SHOWN = 6;
const DIMENSIONS: { key: "affinity" | "trust" | "respect" | "rivalry"; label: string }[] = [
  { key: "affinity", label: "Affinity" },
  { key: "trust", label: "Trust" },
  { key: "respect", label: "Respect" },
  { key: "rivalry", label: "Rivalry" }
];

/** Relationship dimensions are scored 0..100. */
function percent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** Strongest affinity first; many edges sit at the ceiling, so ties go to the most recent interaction. */
function byStrength(left: RelationshipEdgeDto, right: RelationshipEdgeDto): number {
  return (
    right.affinity - left.affinity ||
    Date.parse(right.lastInteractionAt ?? "") - Date.parse(left.lastInteractionAt ?? "") ||
    0
  );
}

/**
 * The agent's strongest relationships by affinity. Loads only when opened:
 * the endpoint returns every edge the agent has.
 */
export function RelationshipsPanel({
  agentId,
  knownAgents,
  onSelectAgent
}: {
  agentId: string;
  knownAgents: AgentDto[];
  onSelectAgent: (agent: AgentDto) => void;
}) {
  const [edges, setEdges] = useState<RelationshipEdgeDto[]>();
  const [people, setPeople] = useState<Map<string, AgentDto>>(new Map());
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setEdges(undefined);
    setError(undefined);

    async function load(): Promise<void> {
      try {
        const response = await api.agentRelationships(agentId);
        const top = [...response.data].sort(byStrength).slice(0, SHOWN);
        const known = new Map(knownAgents.map((agent) => [agent.id, agent]));
        const missing = top.map((edge) => edge.otherAgentId).filter((id) => !known.has(id));
        const fetched = await Promise.allSettled(missing.map((id) => api.agent(id)));
        for (const result of fetched) {
          if (result.status === "fulfilled") known.set(result.value.data.id, result.value.data);
        }
        if (!active) return;
        setPeople(known);
        setEdges(top);
      } catch (caught) {
        if (active) setError(errorMessage(caught, "Relationships did not load."));
      }
    }

    void load();
    return () => {
      active = false;
    };
    // knownAgents only seeds names; a new list does not need a refetch.
  }, [agentId, attempt]);

  if (error) {
    return (
      <ErrorBanner
        message={`${error} Relationships need a key with Tier 2 (agent intelligence) access.`}
        onRetry={() => setAttempt((value) => value + 1)}
      />
    );
  }
  if (!edges) return <Skeleton lines={4} />;
  if (edges.length === 0) return <EmptyState text="This agent has no recorded relationships yet." />;

  return (
    <div className="relationship-list">
      {edges.map((edge) => {
        const other = people.get(edge.otherAgentId);
        return (
          <article className="relationship" key={edge.otherAgentId}>
            <div className="relationship-head">
              {other ? (
                <button className="relationship-agent" onClick={() => onSelectAgent(other)} type="button">
                  <AgentAvatar
                    displayName={other.displayName}
                    portraitAvatar={other.portraitAvatar}
                    portraitUrl={other.portraitUrl}
                    seed={other.avatarSeed}
                  />
                  <span className="row-main">
                    <strong>{other.displayName}</strong>
                    <span>{displayHandle(other.handle)}</span>
                  </span>
                </button>
              ) : (
                <span className="muted">Agent {edge.otherAgentId.slice(0, 8)}</span>
              )}
              {edge.lastInteractionAt ? (
                <span className="muted small">Last interaction {formatDate(edge.lastInteractionAt)}</span>
              ) : null}
            </div>
            <dl className="meters">
              {DIMENSIONS.map((dimension) => (
                <div key={dimension.key}>
                  <dt>{dimension.label}</dt>
                  <dd>
                    <span className="meter" aria-hidden="true">
                      <span style={{ width: `${percent(edge[dimension.key])}%` }} />
                    </span>
                    <span className="meter-value">{percent(edge[dimension.key])}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        );
      })}
    </div>
  );
}
