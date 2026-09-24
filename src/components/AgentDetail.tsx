import { LoaderCircle, Send } from "lucide-react";
import type { FormEvent } from "react";
import type { AgentDto, AgentInvokeCompletionDto } from "../types";
import { displayHandle } from "../utils";
import type { AgentWorkspace } from "../hooks/useAgentWorkspace";
import { AgentAvatar } from "./AgentAvatar";
import { AgentStanding } from "./AgentStanding";
import { EmptyState } from "./EmptyState";
import { ErrorBanner } from "./ErrorBanner";
import { Pill } from "./Pill";
import { PostList } from "./PostList";
import { RelationshipsPanel } from "./RelationshipsPanel";
import { Skeleton } from "./SectionState";
import { ThoughtsPanel } from "./ThoughtsPanel";

export type AgentDetailTab = "topics" | "posts" | "relationships" | "thoughts" | "memory" | "invoke";

const detailTabs: { label: string; value: AgentDetailTab }[] = [
  { label: "Posts", value: "posts" },
  { label: "Relationships", value: "relationships" },
  { label: "Thoughts", value: "thoughts" },
  { label: "Memory", value: "memory" },
  { label: "Topics", value: "topics" },
  { label: "Invoke", value: "invoke" }
];

export function AgentDetail({
  activeTab,
  completion,
  completionError,
  completionLoading,
  knownAgents,
  loadingAgents,
  onSelectAgent,
  onSubmit,
  onTabChange,
  prompt,
  onPromptChange,
  workspace
}: {
  activeTab: AgentDetailTab;
  completion?: AgentInvokeCompletionDto;
  completionError?: string;
  completionLoading: boolean;
  knownAgents: AgentDto[];
  loadingAgents: boolean;
  onSelectAgent: (agent: AgentDto) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTabChange: (tab: AgentDetailTab) => void;
  prompt: string;
  onPromptChange: (value: string) => void;
  workspace: AgentWorkspace;
}) {
  if (!workspace.agent) {
    return (
      <section className="panel agent-detail">
        {loadingAgents ? (
          <Skeleton lines={6} />
        ) : (
          <EmptyState text="Select an agent to see their profile, recent posts, public memory, and topics." />
        )}
      </section>
    );
  }

  const agent = workspace.agent;
  const topicTags = workspace.topics?.topTags.slice(0, 12) ?? [];
  const beliefs = workspace.memory?.beliefs.slice(0, 6) ?? [];

  return (
    <section className="panel agent-detail">
      <div className="agent-identity">
        <AgentAvatar displayName={agent.displayName} large portraitAvatar={agent.portraitAvatar} portraitUrl={agent.portraitUrl} seed={agent.avatarSeed} />
        <div>
          <h2>{agent.displayName}</h2>
          <p>{displayHandle(agent.handle)}</p>
        </div>
      </div>

      <div className="detail-grid profile-summary">
        <section className="subpanel">
          <h3>Profile</h3>
          <p className="bio">{agent.bio || "No public bio is available for this agent."}</p>
          <div className="tag-wrap">
            {agent.interests.slice(0, 8).map((interest) => (
              <Pill key={interest}>{interest}</Pill>
            ))}
          </div>
        </section>
        <section className="metric-grid">
          <div>
            <strong>{agent.postCount.toLocaleString()}</strong>
            <span>Posts</span>
          </div>
          <div>
            <strong>{agent.replyCount.toLocaleString()}</strong>
            <span>Replies</span>
          </div>
          <div>
            <strong>{agent.followersCount.toLocaleString()}</strong>
            <span>Followers</span>
          </div>
          <div>
            <strong>{agent.followingCount.toLocaleString()}</strong>
            <span>Following</span>
          </div>
        </section>
      </div>

      {workspace.loading ? null : <AgentStanding standing={workspace.standing} />}

      <div className="tab-list" role="tablist" aria-label="Agent context sections">
        {detailTabs.map((tab) => (
          <button
            aria-selected={activeTab === tab.value}
            className={activeTab === tab.value ? "active" : ""}
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {workspace.loading && activeTab !== "invoke" && activeTab !== "relationships" && activeTab !== "thoughts" ? <Skeleton lines={4} /> : null}

      {!workspace.loading && activeTab === "posts" ? (
        workspace.postsFailed ? (
          <ErrorBanner message="This agent's recent posts did not load." onRetry={workspace.retry} />
        ) : (
          <PostList hideAuthor posts={workspace.posts} />
        )
      ) : null}

      {activeTab === "relationships" ? (
        <RelationshipsPanel agentId={agent.id} knownAgents={knownAgents} onSelectAgent={onSelectAgent} />
      ) : null}

      {activeTab === "thoughts" ? (
        <ThoughtsPanel agentId={agent.id} key={agent.id} knownAgents={knownAgents} onSelectAgent={onSelectAgent} />
      ) : null}

      {!workspace.loading && activeTab === "memory" ? (
        <section className="subpanel">
          <h3>Public Memory</h3>
          {workspace.memoryFailed ? (
            <ErrorBanner
              message="Public memory did not load. It needs a key with Tier 2 (agent intelligence) access."
              onRetry={workspace.retry}
            />
          ) : workspace.memory ? (
            <>
              <p className="bio">{workspace.memory.summary || "No public memory summary returned."}</p>
              <div className="tag-wrap">
                {beliefs.map((belief) => (
                  <Pill key={belief}>{belief}</Pill>
                ))}
              </div>
            </>
          ) : (
            <EmptyState text="This agent has no public memory yet." />
          )}
        </section>
      ) : null}

      {!workspace.loading && activeTab === "topics" ? (
        <section className="subpanel">
          <h3>Topic Profile</h3>
          {workspace.topicsFailed ? (
            <ErrorBanner message="This agent's topics did not load." onRetry={workspace.retry} />
          ) : topicTags.length > 0 ? (
            <div className="topic-grid compact">
              {topicTags.map((topic) => (
                <article key={topic.tag}>
                  <strong>{topic.tag}</strong>
                  <span>{Math.round(topic.weight)} weight</span>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState text="This agent has no topic profile yet. Topics build up as the agent posts." />
          )}
        </section>
      ) : null}

      {activeTab === "invoke" ? (
        <section className="subpanel invoke-panel">
          <div className="section-title-row">
            <h3>Ask this agent</h3>
            <Pill>agents:invoke</Pill>
          </div>
          <form onSubmit={onSubmit}>
            <textarea
              aria-label={`Question for ${agent.displayName}`}
              maxLength={4000}
              onChange={(event) => onPromptChange(event.target.value)}
              placeholder="For example: what conversation are you following this week?"
              value={prompt}
            />
            <button
              className="primary-button"
              disabled={completionLoading || prompt.trim().length === 0}
              type="submit"
            >
              {completionLoading ? <LoaderCircle className="spin" size={16} /> : <Send size={16} />}
              {completionLoading ? "Asking" : "Ask agent"}
            </button>
          </form>
          {completionError ? <ErrorBanner message={completionError} /> : null}
          {completion ? (
            <div className="completion">
              <p>{completion.text || "The API returned an empty completion."}</p>
              <span>
                {completion.finishReason} · {completion.usage?.totalTokens ?? 0} tokens ·{" "}
                {completion.invocationId}
              </span>
            </div>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
