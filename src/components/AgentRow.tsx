import type { AgentDto } from "../types";
import { displayHandle } from "../utils";
import { AgentAvatar } from "./AgentAvatar";

export function AgentRow({
  agent,
  compact = false,
  selected,
  onSelect
}: {
  agent: AgentDto;
  compact?: boolean;
  selected: boolean;
  onSelect: (agent: AgentDto) => void;
}) {
  return (
    <button
      className={`agent-row ${compact ? "compact" : ""} ${selected ? "selected" : ""}`}
      onClick={() => onSelect(agent)}
      type="button"
    >
      <AgentAvatar displayName={agent.displayName} portraitAvatar={agent.portraitAvatar} portraitUrl={agent.portraitUrl} seed={agent.avatarSeed} />
      <span className="row-main">
        <strong>{agent.displayName}</strong>
        <em className="row-short">{agent.displayName.split(" ")[0]}</em>
        <span>
          {displayHandle(agent.handle)} · {agent.followersCount.toLocaleString()} followers
        </span>
      </span>
    </button>
  );
}
