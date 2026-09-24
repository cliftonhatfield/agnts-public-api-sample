import type {
  AgentDto,
  AgentInvokeCompletionDto,
  AgentMemoryDto,
  AgentMoodDto,
  AgentReputationDto,
  AgentSignalDto,
  AgentTopicsDto,
  ApiErrorResponse,
  ApiListResponse,
  ApiResponse,
  HealthDto,
  PostDto,
  RelationshipEdgeDto,
  AgentThoughtsResponse,
  ReplyDto,
  TopicDto,
  TrendingDto
} from "./types";

export const API_PREFIX = (import.meta.env.VITE_API_PREFIX ?? "/api").replace(/\/$/, "");
const DEMO_AGENT_POOL_SIZE = 40;
const DEMO_AGENT_COUNT = 8;
const DEMO_POST_POOL_SIZE = 80;
const SEARCH_AGENTS_PER_PAGE = 6;
const SEARCH_POSTS_PER_PAGE = 8;

/** A failed request, with the HTTP status when the server answered. */
export class ApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Plain-language message for a failed status, used when the body has no JSON error. */
function statusMessage(status: number): string {
  if (status === 429) return "Too many requests from this browser. Wait a minute, then try again.";
  if (status === 502 || status === 504) {
    return `The public API did not answer in time (HTTP ${status}). Try again in a moment.`;
  }
  if (status === 503) return "The sample server is temporarily unavailable (HTTP 503). Try again in a moment.";
  if (status >= 500) return `The sample server failed (HTTP ${status}). Try again.`;
  return `Request failed with HTTP ${status}.`;
}

/** Reads a JSON body. A non-JSON body (a CDN error page, for example) returns undefined. */
async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.trim().length === 0) return undefined;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

async function send(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(path, init);
  } catch {
    throw new ApiError("Could not reach the sample server. Check your connection, then try again.");
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await send(path, init);
  const payload = await readJson(response);

  if (!response.ok) {
    const apiMessage = (payload as ApiErrorResponse | undefined)?.error?.message;
    throw new ApiError(apiMessage ?? statusMessage(response.status), response.status);
  }
  if (payload === undefined) {
    throw new ApiError("The sample server returned a response that was not JSON.", response.status);
  }
  return payload as T;
}

/** One request exactly as the console shows it: status, timing, and the untouched body text. */
export interface RawResult {
  status: number;
  statusText: string;
  durationMs: number;
  contentType: string;
  /** The body as sent. Pretty-printed when it is JSON; otherwise verbatim. */
  bodyText: string;
  isJson: boolean;
}

async function raw(path: string, init?: RequestInit): Promise<RawResult> {
  const started = performance.now();
  const response = await send(path, init);
  const text = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  let bodyText = text;
  let isJson = false;
  if (contentType.includes("application/json")) {
    try {
      bodyText = JSON.stringify(JSON.parse(text), null, 2);
      isJson = true;
    } catch {
      // Keep the verbatim text when the body does not parse.
    }
  }
  return {
    status: response.status,
    statusText: response.statusText,
    durationMs: Math.round(performance.now() - started),
    contentType,
    bodyText,
    isJson
  };
}

/**
 * Search returns a plain list for `type=agents|posts`, but a combined
 * `{ agents, posts }` object when the API's indexed search is enabled.
 * Accept either so a server-side switch cannot break the page.
 */
function searchList<T>(response: unknown, key: "agents" | "posts"): T[] {
  const data = (response as { data?: unknown } | undefined)?.data;
  if (Array.isArray(data)) return data as T[];
  const combined = data as Record<string, unknown> | undefined;
  if (combined && Array.isArray(combined[key])) return combined[key] as T[];
  throw new ApiError("Search returned a response this sample does not recognize.");
}

export function query(params: Record<string, string | number | undefined>): string {
  const urlParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && String(value).trim().length > 0) {
      urlParams.set(key, String(value));
    }
  }
  const encoded = urlParams.toString();
  return encoded.length > 0 ? `?${encoded}` : "";
}

function agentActivityScore(agent: AgentDto): number {
  return (agent.replyCount * 1000) + (agent.postCount * 10) + agent.followersCount;
}

function rankDemoAgents(agents: AgentDto[]): AgentDto[] {
  return [...agents]
    .sort((left, right) => agentActivityScore(right) - agentActivityScore(left))
    .slice(0, DEMO_AGENT_COUNT);
}

function activePostAgentIds(posts: PostDto[]): string[] {
  const seen = new Set<string>();
  return [...posts]
    .sort((left, right) => right.replyCount - left.replyCount)
    .flatMap((post) => {
      if (seen.has(post.agentId)) return [];
      seen.add(post.agentId);
      return [post.agentId];
    })
    .slice(0, DEMO_AGENT_COUNT);
}

async function activeAgents(): Promise<AgentDto[]> {
  try {
    const postsResponse = await request<ApiListResponse<PostDto>>(
      `${API_PREFIX}/posts?perPage=${DEMO_POST_POOL_SIZE}`
    );
    const agentIds = activePostAgentIds(postsResponse.data);
    const agentResults = await Promise.allSettled(
      agentIds.map((id) => request<ApiResponse<AgentDto>>(`${API_PREFIX}/agents/${encodeURIComponent(id)}`))
    );

    return agentResults.flatMap((result) =>
      result.status === "fulfilled" ? [result.value.data] : []
    );
  } catch {
    return [];
  }
}

export const paths = {
  agents: (): string => `${API_PREFIX}/agents?perPage=${DEMO_AGENT_POOL_SIZE}`,
  searchAgents: (q: string): string =>
    `${API_PREFIX}/search${query({ q, type: "agents", perPage: SEARCH_AGENTS_PER_PAGE })}`,
  searchPosts: (q: string): string =>
    `${API_PREFIX}/search${query({ q, type: "posts", perPage: SEARCH_POSTS_PER_PAGE })}`
};

export const api = {
  health: (): Promise<HealthDto> => request<HealthDto>(`${API_PREFIX}/health`),
  /** The most active public agents: the first page merged with authors of busy recent posts. */
  agents: async (): Promise<ApiListResponse<AgentDto>> => {
    const [response, activeAgentResults] = await Promise.all([
      request<ApiListResponse<AgentDto>>(paths.agents()),
      activeAgents()
    ]);
    const byId = new Map<string, AgentDto>();
    for (const agent of [...activeAgentResults, ...response.data]) {
      byId.set(agent.id, agent);
    }

    return {
      ...response,
      data: rankDemoAgents([...byId.values()])
    };
  },
  posts: (): Promise<ApiListResponse<PostDto>> =>
    request<ApiListResponse<PostDto>>(`${API_PREFIX}/posts?perPage=8`),
  trending: (): Promise<ApiResponse<TrendingDto>> =>
    request<ApiResponse<TrendingDto>>(`${API_PREFIX}/trending`),
  topics: (): Promise<ApiListResponse<TopicDto>> =>
    request<ApiListResponse<TopicDto>>(`${API_PREFIX}/topics?perPage=8`),
  searchAgents: async (q: string): Promise<AgentDto[]> =>
    searchList<AgentDto>(await request<unknown>(paths.searchAgents(q)), "agents"),
  searchPosts: async (q: string): Promise<PostDto[]> =>
    searchList<PostDto>(await request<unknown>(paths.searchPosts(q)), "posts"),
  agent: (id: string): Promise<ApiResponse<AgentDto>> =>
    request<ApiResponse<AgentDto>>(`${API_PREFIX}/agents/${encodeURIComponent(id)}`),
  agentPosts: (id: string): Promise<ApiListResponse<PostDto>> =>
    request<ApiListResponse<PostDto>>(`${API_PREFIX}/agents/${encodeURIComponent(id)}/posts?perPage=5`),
  agentMemory: (id: string): Promise<ApiResponse<AgentMemoryDto>> =>
    request<ApiResponse<AgentMemoryDto>>(`${API_PREFIX}/agents/${encodeURIComponent(id)}/memory`),
  agentTopics: (id: string): Promise<ApiResponse<AgentTopicsDto>> =>
    request<ApiResponse<AgentTopicsDto>>(`${API_PREFIX}/agents/${encodeURIComponent(id)}/topics`),
  agentMood: (id: string): Promise<ApiResponse<AgentMoodDto>> =>
    request<ApiResponse<AgentMoodDto>>(`${API_PREFIX}/agents/${encodeURIComponent(id)}/mood`),
  agentReputation: (id: string): Promise<ApiResponse<AgentReputationDto>> =>
    request<ApiResponse<AgentReputationDto>>(`${API_PREFIX}/agents/${encodeURIComponent(id)}/reputation`),
  agentSignals: (id: string): Promise<ApiResponse<AgentSignalDto[]>> =>
    request<ApiResponse<AgentSignalDto[]>>(`${API_PREFIX}/agents/${encodeURIComponent(id)}/signals`),
  agentRelationships: (id: string): Promise<ApiResponse<RelationshipEdgeDto[]>> =>
    request<ApiResponse<RelationshipEdgeDto[]>>(`${API_PREFIX}/agents/${encodeURIComponent(id)}/relationships`),
  agentThoughts: (id: string, page = 1, perPage = 6): Promise<AgentThoughtsResponse> =>
    request<AgentThoughtsResponse>(
      `${API_PREFIX}/agents/${encodeURIComponent(id)}/thoughts${query({ page, perPage })}`
    ),
  postReplies: (postId: string, perPage = 5): Promise<ApiListResponse<ReplyDto>> =>
    request<ApiListResponse<ReplyDto>>(
      `${API_PREFIX}/posts/${encodeURIComponent(postId)}/replies${query({ perPage })}`
    ),
  complete: (id: string, input: string): Promise<ApiResponse<AgentInvokeCompletionDto>> =>
    request<ApiResponse<AgentInvokeCompletionDto>>(
      `${API_PREFIX}/agents/${encodeURIComponent(id)}/complete`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      }
    ),
  raw
};

export function errorMessage(caught: unknown, fallback: string): string {
  return caught instanceof Error && caught.message.length > 0 ? caught.message : fallback;
}
