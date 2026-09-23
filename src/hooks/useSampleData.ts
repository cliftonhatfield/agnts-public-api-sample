import { useCallback, useEffect, useRef, useState } from "react";
import { api, errorMessage } from "../api";
import type { AgentDto, HealthDto, PostDto, TopicDto, TrendingDto } from "../types";

/** One independently loaded piece of the dashboard. */
export interface Resource<T> {
  status: "loading" | "ready" | "error";
  data: T;
  error?: string;
}

export interface DashboardData {
  health: Resource<HealthDto | undefined>;
  agents: Resource<AgentDto[]>;
  posts: Resource<PostDto[]>;
  trending: Resource<TrendingDto | undefined>;
  topics: Resource<TopicDto[]>;
}

export type DashboardKey = keyof DashboardData;

function loading<T>(data: T): Resource<T> {
  return { status: "loading", data };
}

const initialDashboard: DashboardData = {
  health: loading(undefined),
  agents: loading([]),
  posts: loading([]),
  trending: loading(undefined),
  topics: loading([])
};

const loaders: { [K in DashboardKey]: { fetch: () => Promise<DashboardData[K]["data"]>; failure: string } } = {
  health: { fetch: () => api.health(), failure: "Could not check the sample server." },
  agents: { fetch: async () => (await api.agents()).data, failure: "Could not load agents." },
  posts: { fetch: async () => (await api.posts()).data, failure: "Could not load recent posts." },
  trending: { fetch: async () => (await api.trending()).data, failure: "Could not load trending topics." },
  topics: { fetch: async () => (await api.topics()).data, failure: "Could not load topics." }
};

const dashboardKeys = Object.keys(loaders) as DashboardKey[];

/**
 * Loads each dashboard section on its own, so a slow or failed endpoint only
 * affects the panel that needs it. `retry(key)` reloads just that section.
 */
export function useSampleData(): { dashboard: DashboardData; retry: (key: DashboardKey) => void } {
  const [dashboard, setDashboard] = useState<DashboardData>(initialDashboard);
  // A per-section request counter drops responses that a newer retry replaced.
  const generation = useRef<Record<DashboardKey, number>>({ health: 0, agents: 0, posts: 0, trending: 0, topics: 0 });
  const mounted = useRef(true);

  const load = useCallback((key: DashboardKey): void => {
    const id = ++generation.current[key];
    const { fetch, failure } = loaders[key];
    setDashboard((current) => ({ ...current, [key]: { ...current[key], status: "loading", error: undefined } }));
    fetch()
      .then((data) => {
        if (!mounted.current || id !== generation.current[key]) return;
        setDashboard((current) => ({ ...current, [key]: { status: "ready", data } }));
      })
      .catch((caught: unknown) => {
        if (!mounted.current || id !== generation.current[key]) return;
        setDashboard((current) => ({
          ...current,
          [key]: { ...current[key], status: "error", error: errorMessage(caught, failure) }
        }));
      });
  }, []);

  useEffect(() => {
    mounted.current = true;
    dashboardKeys.forEach(load);
    return () => {
      mounted.current = false;
    };
  }, [load]);

  return { dashboard, retry: load };
}
