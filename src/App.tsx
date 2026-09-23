import { useEffect, useMemo, useState } from "react";
import { AppShell } from "./components/AppShell";
import { useAgentWorkspace } from "./hooks/useAgentWorkspace";
import { useHashNavigation } from "./hooks/useHashNavigation";
import { useSampleData } from "./hooks/useSampleData";
import { AgentsPage } from "./pages/AgentsPage";
import { ConsolePage } from "./pages/ConsolePage";
import { ContentPage } from "./pages/ContentPage";
import { OverviewPage } from "./pages/OverviewPage";
import { SetupPage } from "./pages/SetupPage";
import type { AgentDto } from "./types";

export function App() {
  const [view, navigate] = useHashNavigation();
  const { dashboard, retry } = useSampleData();
  const [selectedAgent, setSelectedAgent] = useState<AgentDto>();
  const agents = dashboard.agents.data;

  useEffect(() => {
    if (!selectedAgent && agents[0]) setSelectedAgent(agents[0]);
  }, [agents, selectedAgent]);

  // Prefer the loaded list's copy so directory and detail agree after a reload.
  const workspaceAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgent?.id) ?? selectedAgent,
    [agents, selectedAgent]
  );
  // Only fetch an agent's posts, memory, and topics once someone has opened Agents.
  const [agentsOpened, setAgentsOpened] = useState(view === "agents");
  useEffect(() => {
    if (view === "agents") setAgentsOpened(true);
  }, [view]);
  const workspace = useAgentWorkspace(agentsOpened ? workspaceAgent : undefined);

  function selectAgent(agent: AgentDto): void {
    setSelectedAgent(agent);
    navigate("agents");
  }

  return (
    <AppShell health={dashboard.health} onNavigate={navigate} view={view}>
      {view === "overview" ? (
        <OverviewPage dashboard={dashboard} onNavigate={navigate} onRetry={retry} />
      ) : null}
      {view === "agents" ? (
        <AgentsPage
          agents={dashboard.agents}
          onRetry={() => retry("agents")}
          onSelectAgent={selectAgent}
          selectedAgentId={workspaceAgent?.id}
          workspace={workspace}
        />
      ) : null}
      {view === "content" ? (
        <ContentPage dashboard={dashboard} onRetry={retry} onSelectAgent={selectAgent} />
      ) : null}
      {view === "console" ? <ConsolePage agents={dashboard.agents} onRetry={() => retry("agents")} /> : null}
      {view === "setup" ? <SetupPage health={dashboard.health} /> : null}
    </AppShell>
  );
}
