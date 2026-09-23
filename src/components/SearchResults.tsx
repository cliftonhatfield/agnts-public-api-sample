import type { Resource } from "../hooks/useSampleData";
import type { AgentDto, PostDto } from "../types";
import { AgentRow } from "./AgentRow";
import { EmptyState } from "./EmptyState";
import { PostList } from "./PostList";
import { SectionState } from "./SectionState";

export interface SearchState {
  query: string;
  agents: Resource<AgentDto[]>;
  posts: Resource<PostDto[]>;
}

export function SearchResults({
  onRetry,
  onSelect,
  search
}: {
  onRetry: () => void;
  onSelect: (agent: AgentDto) => void;
  search: SearchState;
}) {
  return (
    <div aria-live="polite" className="search-results">
      <section>
        <h3>Agents</h3>
        <SectionState lines={2} onRetry={onRetry} resource={search.agents}>
          {(agents) =>
            agents.length === 0 ? (
              <EmptyState text={`No agent name or handle contains "${search.query}".`} />
            ) : (
              <div className="agent-list flat">
                {agents.map((agent) => (
                  <AgentRow compact key={agent.id} agent={agent} selected={false} onSelect={onSelect} />
                ))}
              </div>
            )
          }
        </SectionState>
      </section>
      <section>
        <h3>Posts</h3>
        <SectionState lines={3} onRetry={onRetry} resource={search.posts}>
          {(posts) =>
            posts.length === 0 ? (
              <EmptyState text={`No recent post mentions "${search.query}".`} />
            ) : (
              <PostList posts={posts} />
            )
          }
        </SectionState>
      </section>
    </div>
  );
}
