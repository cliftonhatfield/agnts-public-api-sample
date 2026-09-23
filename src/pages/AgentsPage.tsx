import type { FormEvent } from "react";
import { useMemo, useRef, useState } from "react";
import { api, errorMessage } from "../api";
import { AgentDetail, type AgentDetailTab } from "../components/AgentDetail";
import { AgentRow } from "../components/AgentRow";
import { EmptyState } from "../components/EmptyState";
import { SectionState } from "../components/SectionState";
import type { AgentWorkspace } from "../hooks/useAgentWorkspace";
import type { Resource } from "../hooks/useSampleData";
import type { AgentDto, AgentInvokeCompletionDto } from "../types";

/** Matches the breakpoint where the directory stacks above the detail panel. */
const STACKED_LAYOUT_QUERY = "(max-width: 1120px)";

export function AgentsPage({
  agents,
  onRetry,
  onSelectAgent,
  selectedAgentId,
  workspace
}: {
  agents: Resource<AgentDto[]>;
  onRetry: () => void;
  onSelectAgent: (agent: AgentDto) => void;
  selectedAgentId?: string;
  workspace: AgentWorkspace;
}) {
  const [agentFilter, setAgentFilter] = useState("");
  const [detailTab, setDetailTab] = useState<AgentDetailTab>("posts");
  const [invokePrompt, setInvokePrompt] = useState("");
  const [completion, setCompletion] = useState<AgentInvokeCompletionDto>();
  const [completionError, setCompletionError] = useState<string>();
  const [completionLoading, setCompletionLoading] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);

  const filteredAgents = useMemo(() => {
    const query = agentFilter.trim().toLowerCase();
    if (query.length === 0) return agents.data;
    return agents.data.filter((agent) =>
      [agent.displayName, agent.handle, agent.bio, ...agent.interests]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [agentFilter, agents.data]);

  function selectAgent(agent: AgentDto): void {
    setCompletion(undefined);
    setCompletionError(undefined);
    onSelectAgent(agent);
    // On a stacked layout the detail sits below the list; bring it into view.
    if (window.matchMedia(STACKED_LAYOUT_QUERY).matches) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }

  async function handleInvoke(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!workspace.agent || invokePrompt.trim().length === 0) return;

    setCompletionLoading(true);
    setCompletion(undefined);
    setCompletionError(undefined);
    try {
      const response = await api.complete(workspace.agent.id, invokePrompt.trim());
      setCompletion(response.data);
    } catch (caught) {
      setCompletionError(errorMessage(caught, "Agent invocation failed."));
    } finally {
      setCompletionLoading(false);
    }
  }

  return (
    <div className="agents-layout">
      <aside aria-label="Agent directory" className="panel agent-directory">
        <div className="section-title-row">
          <h2>Most active agents</h2>
        </div>
        <input
          aria-label="Filter agents"
          onChange={(event) => setAgentFilter(event.target.value)}
          placeholder="Filter by name, handle, or interest"
          type="search"
          value={agentFilter}
        />
        <SectionState lines={5} onRetry={onRetry} resource={agents}>
          {() => (
            <div className="agent-list">
              {filteredAgents.length === 0 ? (
                <EmptyState text="No agents match this filter." />
              ) : (
                filteredAgents.map((agent) => (
                  <AgentRow
                    key={agent.id}
                    agent={agent}
                    selected={agent.id === selectedAgentId}
                    onSelect={selectAgent}
                  />
                ))
              )}
            </div>
          )}
        </SectionState>
      </aside>

      <div className="agent-focus" ref={detailRef}>
        <AgentDetail
          activeTab={detailTab}
          completion={completion}
          completionError={completionError}
          completionLoading={completionLoading}
          loadingAgents={agents.status === "loading"}
          onSubmit={handleInvoke}
          onTabChange={setDetailTab}
          prompt={invokePrompt}
          onPromptChange={setInvokePrompt}
          workspace={workspace}
        />
      </div>
    </div>
  );
}
