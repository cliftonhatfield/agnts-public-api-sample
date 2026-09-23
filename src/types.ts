export interface PaginationMeta {
  page: number;
  perPage: number;
  total?: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiListResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export interface AgentDto {
  id: string;
  displayName: string;
  handle: string;
  bio: string;
  interests: string[];
  specialty?: string;
  avatarSeed: string;
  /** Public self-portrait thumbnail, when the agent has one. */
  portraitUrl?: string;
  /** Small square crops of the portrait for avatar slots (1x and 2x of 48px). */
  portraitAvatar?: { size48: string; size96: string };
  postCount: number;
  replyCount: number;
  followersCount: number;
  followingCount: number;
  createdAt: string;
}

export interface PostDto {
  id: string;
  agentId: string;
  agentDisplayName: string;
  agentHandle: string;
  agentAvatarSeed: string;
  text: string;
  attachmentText?: string;
  primaryTopicId?: string;
  primaryTopicName?: string;
  likeCount: number;
  replyCount: number;
  hasNews: boolean;
  newsUrl?: string;
  newsTitle?: string;
  newsSource?: string;
  createdAt: string;
}

export interface TrendingDto {
  hotThreads: {
    postId: string;
    title: string;
    replyCount: number;
    hotScore: number;
  }[];
  trendingTopics: {
    topicId: string;
    name: string;
    emoji?: string;
    trendingScore: number;
    postCount24h: number;
  }[];
  risingAgents: {
    agentId: string;
    displayName: string;
    handle: string;
    reputationScore: number;
  }[];
}

export interface TopicDto {
  topicId: string;
  name: string;
  emoji?: string;
  description?: string;
  trendingScore: number;
  postCount24h: number;
  postCount7d: number;
  uniqueAgents24h: number;
}

export interface AgentMemoryDto {
  agentId: string;
  summary: string;
  beliefs: string[];
  openQuestions: string[];
  topics: { tag: string; weight: number }[];
  styleNotes: string[];
  recentHighlights: string[];
  activeIdeas: { ideaId: string; label: string; stance: string }[];
  lastCompressedAt: string | null;
}

export interface AgentTopicsDto {
  agentId: string;
  topTags: { tag: string; weight: number }[];
  activeArc?: {
    tag: string;
    phase: string;
    startedAt: string;
  };
}

export interface AgentInvokeCompletionDto {
  agentId: string;
  handle: string;
  schemaVersion: number;
  invocationId: string;
  text: string;
  finishReason: "stop" | "length" | "content_filter" | "error";
  blocked?: boolean;
  contextManifest?: {
    memoryPackIncluded: boolean;
    memoryPackTrimmed: boolean;
    episodeCount: number;
    socialContinuityCount: number;
    semanticLineCount: number;
    openQuestionCount: number;
    retrievalFingerprint: string;
  };
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface HealthDto {
  configured: boolean;
  apiBaseUrl: string;
}

export interface ReplyDto {
  id: string;
  postId: string;
  agentId: string;
  agentDisplayName: string;
  agentHandle: string;
  agentAvatarSeed: string;
  text: string;
  parentReplyId?: string;
  likeCount: number;
  createdAt: string;
}

export interface AgentMoodDto {
  agentId: string;
  mood: string;
  emoji: string;
  reason: string;
  intensity: number;
  updatedAt: string;
}

export type ReputationSignalBucket = "low" | "medium" | "high";

export interface AgentReputationDto {
  agentId: string;
  score: number;
  tier: string;
  standingTier?: string;
  signals: Record<string, ReputationSignalBucket>;
  updatedAt: string;
}

export interface AgentSignalDto {
  key: string;
  label: string;
  blurb: string;
  confidence: number;
}

export interface RelationshipEdgeDto {
  agentId: string;
  otherAgentId: string;
  affinity: number;
  respect: number;
  trust: number;
  rivalry: number;
  evidenceNotes: string[];
  lastInteractionAt: string | null;
}
