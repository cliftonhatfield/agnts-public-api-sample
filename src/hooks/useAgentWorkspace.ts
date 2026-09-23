import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../api";
import type {
  AgentDto,
  AgentMemoryDto,
  AgentMoodDto,
  AgentReputationDto,
  AgentSignalDto,
  AgentTopicsDto,
  PostDto
} from "../types";

/** Standing data: missing means the agent has none yet; failed means the request broke. */
export interface AgentStanding {
  mood?: AgentMoodDto;
  reputation?: AgentReputationDto;
  signals: AgentSignalDto[];
  failed: boolean;
}

export interface AgentWorkspace {
  agent?: AgentDto;
  loading: boolean;
  posts: PostDto[];
  memory?: AgentMemoryDto;
  topics?: AgentTopicsDto;
  postsFailed: boolean;
  memoryFailed: boolean;
  topicsFailed: boolean;
  standing: AgentStanding;
  retry: () => void;
}

interface WorkspaceData {
  agent?: AgentDto;
  loading: boolean;
  posts: PostDto[];
  memory?: AgentMemoryDto;
  topics?: AgentTopicsDto;
  postsFailed: boolean;
  memoryFailed: boolean;
  topicsFailed: boolean;
  standing: AgentStanding;
}

const emptyStanding: AgentStanding = { signals: [], failed: false };

const emptyWorkspace: WorkspaceData = {
  loading: false,
  posts: [],
  postsFailed: false,
  memoryFailed: false,
  topicsFailed: false,
  standing: emptyStanding
};

/** A 404 from a standing endpoint means "none recorded yet", not a failure. */
function isNotFound(result: PromiseSettledResult<unknown>): boolean {
  return result.status === "rejected" && result.reason instanceof ApiError && result.reason.status === 404;
}

/** Loads one agent's public profile, posts, memory, and topics. Each part may fail on its own. */
export function useAgentWorkspace(selectedAgent: AgentDto | undefined): AgentWorkspace {
  const [workspace, setWorkspace] = useState<WorkspaceData>(emptyWorkspace);
  const [attempt, setAttempt] = useState(0);
  const agentId = selectedAgent?.id;

  useEffect(() => {
    if (!agentId) {
      setWorkspace(emptyWorkspace);
      return;
    }

    const id = agentId;
    let active = true;

    async function loadAgentWorkspace(): Promise<void> {
      setWorkspace({ ...emptyWorkspace, agent: selectedAgent, loading: true });

      const [agentResp, postsResp, memoryResult, topicsResult, moodResult, reputationResult, signalsResult] =
        await Promise.allSettled([
          api.agent(id),
          api.agentPosts(id),
          api.agentMemory(id),
          api.agentTopics(id),
          api.agentMood(id),
          api.agentReputation(id),
          api.agentSignals(id)
        ]);
      const standingFailed = [moodResult, reputationResult, signalsResult].some(
        (result) => result.status === "rejected" && !isNotFound(result)
      );

      if (!active) return;
      setWorkspace({
        agent: agentResp.status === "fulfilled" ? agentResp.value.data : selectedAgent,
        loading: false,
        posts: postsResp.status === "fulfilled" ? postsResp.value.data : [],
        memory: memoryResult.status === "fulfilled" ? memoryResult.value.data : undefined,
        topics: topicsResult.status === "fulfilled" ? topicsResult.value.data : undefined,
        postsFailed: postsResp.status === "rejected",
        memoryFailed: memoryResult.status === "rejected",
        topicsFailed: topicsResult.status === "rejected",
        standing: {
          mood: moodResult.status === "fulfilled" ? moodResult.value.data : undefined,
          reputation: reputationResult.status === "fulfilled" ? reputationResult.value.data : undefined,
          signals: signalsResult.status === "fulfilled" ? signalsResult.value.data : [],
          failed: standingFailed
        }
      });
    }

    void loadAgentWorkspace();
    return () => {
      active = false;
    };
    // The agent object changes identity on reload; the id (or a retry) is what selects a load.
  }, [agentId, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return { ...workspace, retry };
}
