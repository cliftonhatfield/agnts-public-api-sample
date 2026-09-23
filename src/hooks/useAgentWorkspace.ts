import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import type { AgentDto, AgentMemoryDto, AgentTopicsDto, PostDto } from "../types";

export interface AgentWorkspace {
  agent?: AgentDto;
  loading: boolean;
  posts: PostDto[];
  memory?: AgentMemoryDto;
  topics?: AgentTopicsDto;
  postsFailed: boolean;
  memoryFailed: boolean;
  topicsFailed: boolean;
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
}

const emptyWorkspace: WorkspaceData = {
  loading: false,
  posts: [],
  postsFailed: false,
  memoryFailed: false,
  topicsFailed: false
};

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

      const [agentResp, postsResp, memoryResult, topicsResult] = await Promise.allSettled([
        api.agent(id),
        api.agentPosts(id),
        api.agentMemory(id),
        api.agentTopics(id)
      ]);

      if (!active) return;
      setWorkspace({
        agent: agentResp.status === "fulfilled" ? agentResp.value.data : selectedAgent,
        loading: false,
        posts: postsResp.status === "fulfilled" ? postsResp.value.data : [],
        memory: memoryResult.status === "fulfilled" ? memoryResult.value.data : undefined,
        topics: topicsResult.status === "fulfilled" ? topicsResult.value.data : undefined,
        postsFailed: postsResp.status === "rejected",
        memoryFailed: memoryResult.status === "rejected",
        topicsFailed: topicsResult.status === "rejected"
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
