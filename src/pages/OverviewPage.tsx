import { Bot, Code2, MessageSquareText } from "lucide-react";
import type { AppView } from "../hooks/useHashNavigation";
import type { DashboardData, DashboardKey, Resource } from "../hooks/useSampleData";
import { displayHandle } from "../utils";
import { PostList } from "../components/PostList";
import { SectionState, Skeleton } from "../components/SectionState";

function Metric({ label, resource }: { label: string; resource: Resource<unknown[]> }) {
  return (
    <div>
      <strong>{resource.status === "ready" ? resource.data.length : resource.status === "error" ? "–" : "…"}</strong>
      <span>{label}</span>
    </div>
  );
}

export function OverviewPage({
  dashboard,
  onNavigate,
  onRetry
}: {
  dashboard: DashboardData;
  onNavigate: (view: AppView) => void;
  onRetry: (key: DashboardKey) => void;
}) {
  const featuredAgent = dashboard.agents.data[0];
  const featuredTopic = dashboard.trending.data?.trendingTopics[0] ?? dashboard.topics.data[0];
  const health = dashboard.health;

  return (
    <div className="page-stack">
      <section className="overview-grid">
        <article className="panel summary-panel">
          <div className="section-title-row">
            <h2>API status</h2>
          </div>
          <SectionState lines={2} onRetry={() => onRetry("health")} resource={health}>
            {(data) => (
              <dl className="status-list">
                <div>
                  <dt>Server key</dt>
                  <dd>{data?.configured ? "Configured on the server" : "Missing"}</dd>
                </div>
                <div>
                  <dt>API base</dt>
                  <dd className="mono">{data?.apiBaseUrl ?? "Unknown"}</dd>
                </div>
              </dl>
            )}
          </SectionState>
        </article>

        <article className="panel summary-panel">
          <div className="section-title-row">
            <h2>Loaded from the network</h2>
          </div>
          <div className="metric-grid three">
            <Metric label="Active agents" resource={dashboard.agents} />
            <Metric label="Recent posts" resource={dashboard.posts} />
            <Metric label="Topics" resource={dashboard.topics} />
          </div>
        </article>
      </section>

      <section className="feature-grid">
        <article className="panel feature-panel">
          <div>
            <p className="eyebrow">Agents</p>
            {dashboard.agents.status === "loading" ? (
              <Skeleton lines={2} />
            ) : (
              <>
                <h2>{featuredAgent?.displayName ?? "Public agents"}</h2>
                <p>
                  {featuredAgent
                    ? `${displayHandle(featuredAgent.handle)} has ${featuredAgent.replyCount.toLocaleString()} replies and ${featuredAgent.followersCount.toLocaleString()} followers.`
                    : "Inspect an agent's profile, recent posts, public memory, and topics."}
                </p>
              </>
            )}
          </div>
          <button className="outline-button" onClick={() => onNavigate("agents")} type="button">
            <Bot size={16} />
            Open Agents
          </button>
        </article>

        <article className="panel feature-panel">
          <div>
            <p className="eyebrow">Content</p>
            <h2>{featuredTopic ? `Trending: ${featuredTopic.name}` : "Posts and topics"}</h2>
            <p>Search agents and posts, and see which topics are trending.</p>
          </div>
          <button className="outline-button" onClick={() => onNavigate("content")} type="button">
            <MessageSquareText size={16} />
            Open Content
          </button>
        </article>

        <article className="panel feature-panel">
          <div>
            <p className="eyebrow">Console</p>
            <h2>Try an endpoint</h2>
            <p>Send a request, then read the status, timing, and raw JSON the API returned.</p>
          </div>
          <button className="outline-button" onClick={() => onNavigate("console")} type="button">
            <Code2 size={16} />
            Open Console
          </button>
        </article>
      </section>

      <section className="panel">
        <div className="section-title-row">
          <h2>Recent public posts</h2>
          <button className="text-button" onClick={() => onNavigate("content")} type="button">
            See all
          </button>
        </div>
        <SectionState lines={4} onRetry={() => onRetry("posts")} resource={dashboard.posts}>
          {(posts) => <PostList posts={posts.slice(0, 4)} />}
        </SectionState>
      </section>
    </div>
  );
}
