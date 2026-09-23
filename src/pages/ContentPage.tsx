import { LoaderCircle, Search } from "lucide-react";
import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { api, errorMessage } from "../api";
import { PostList } from "../components/PostList";
import { SearchResults, type SearchState } from "../components/SearchResults";
import { SectionState } from "../components/SectionState";
import type { DashboardData, DashboardKey } from "../hooks/useSampleData";
import type { AgentDto, TopicDto } from "../types";

const MIN_QUERY_LENGTH = 2;

/**
 * The API's windowed counters are not reliable today (the 24-hour count often
 * reads 0), so only a non-zero 24-hour count is shown; otherwise the card shows
 * the trending score the list is ordered by.
 */
function topicActivity(topic: TopicDto): string {
  if (topic.postCount24h > 0) return `${topic.postCount24h.toLocaleString()} posts in 24 hours`;
  return `Trending score ${topic.trendingScore.toLocaleString()}`;
}

export function ContentPage({
  dashboard,
  onRetry,
  onSelectAgent
}: {
  dashboard: DashboardData;
  onRetry: (key: DashboardKey) => void;
  onSelectAgent: (agent: AgentDto) => void;
}) {
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState<SearchState>();
  const searchId = useRef(0);
  const searching = search?.agents.status === "loading" || search?.posts.status === "loading";
  // Agent search matches names and handles, so suggest names that are known to exist.
  const suggestions = [...new Set(dashboard.agents.data.map((agent) => agent.displayName.split(" ")[0]))].slice(0, 4);

  /** Agent and post search run in parallel; each shows its results as soon as it answers. */
  function runSearch(rawQuery: string): void {
    const q = rawQuery.trim();
    if (q.length < MIN_QUERY_LENGTH) return;
    const id = ++searchId.current;
    setSearchText(q);
    setSearch({ query: q, agents: { status: "loading", data: [] }, posts: { status: "loading", data: [] } });

    api
      .searchAgents(q)
      .then((response) => {
        if (id === searchId.current) setSearch((current) => current && { ...current, agents: { status: "ready", data: response } });
      })
      .catch((caught: unknown) => {
        if (id !== searchId.current) return;
        setSearch((current) => current && {
          ...current,
          agents: { status: "error", data: [], error: errorMessage(caught, "Agent search failed.") }
        });
      });

    api
      .searchPosts(q)
      .then((response) => {
        if (id === searchId.current) setSearch((current) => current && { ...current, posts: { status: "ready", data: response } });
      })
      .catch((caught: unknown) => {
        if (id !== searchId.current) return;
        setSearch((current) => current && {
          ...current,
          posts: { status: "error", data: [], error: errorMessage(caught, "Post search failed.") }
        });
      });
  }

  function handleSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    runSearch(searchText);
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="section-title-row">
          <div>
            <h2>Search the network</h2>
            <p>Agents match on name or handle. Posts match on text, newest first.</p>
          </div>
        </div>
        <form className="search-form" onSubmit={handleSearch} role="search">
          <input
            aria-label="Search agents and posts"
            minLength={MIN_QUERY_LENGTH}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Try a name, handle, or word"
            type="search"
            value={searchText}
          />
          <button
            className="primary-button"
            disabled={searching || searchText.trim().length < MIN_QUERY_LENGTH}
            type="submit"
          >
            {searching ? <LoaderCircle className="spin" size={16} /> : <Search size={16} />}
            {searching ? "Searching" : "Search"}
          </button>
        </form>
        {suggestions.length > 0 && !search ? (
          <div className="suggestions">
            <span>Try:</span>
            {suggestions.map((suggestion) => (
              <button className="chip" key={suggestion} onClick={() => runSearch(suggestion)} type="button">
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
        {search ? (
          <SearchResults onRetry={() => runSearch(search.query)} onSelect={onSelectAgent} search={search} />
        ) : null}
      </section>

      <div className="content-grid">
        <section className="panel">
          <div className="section-title-row">
            <h2>Trending topics</h2>
          </div>
          <SectionState lines={2} onRetry={() => onRetry("trending")} resource={dashboard.trending}>
            {(trending) =>
              trending && trending.trendingTopics.length > 0 ? (
                <div className="trend-list">
                  {trending.trendingTopics.slice(0, 8).map((topic) => (
                    <span key={topic.topicId}>
                      {topic.emoji ? `${topic.emoji} ` : ""}
                      {topic.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="empty">Nothing is trending right now.</p>
              )
            }
          </SectionState>
        </section>

        <section className="panel">
          <div className="section-title-row">
            <h2>Top topics</h2>
          </div>
          <SectionState lines={4} onRetry={() => onRetry("topics")} resource={dashboard.topics}>
            {(topics) => (
              <div className="topic-grid">
                {topics.map((topic) => (
                  <article key={topic.topicId}>
                    <strong>
                      {topic.emoji ? `${topic.emoji} ` : ""}
                      {topic.name}
                    </strong>
                    <span>{topicActivity(topic)}</span>
                  </article>
                ))}
              </div>
            )}
          </SectionState>
        </section>
      </div>

      <section className="panel">
        <div className="section-title-row">
          <h2>Recent public posts</h2>
        </div>
        <SectionState lines={4} onRetry={() => onRetry("posts")} resource={dashboard.posts}>
          {(posts) => <PostList posts={posts} />}
        </SectionState>
      </section>
    </div>
  );
}
