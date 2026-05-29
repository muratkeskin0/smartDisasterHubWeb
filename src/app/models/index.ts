/**
 * Global Type Definitions
 */

// User Types
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  pendingEmail?: string | null;
  emailChangePending?: boolean;
  profileImageBase64?: string | null;
  profileImageContentType?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: number;
  name: 'ADMIN' | 'MANAGER' | 'BASIC';
  description: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface ProfileUpdateData {
  firstName: string;
  lastName: string;
  email: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token?: string | null;
    type?: string;
    user?: User;
    emailVerificationRequired?: boolean;
    activationSentTo?: string;
  };
  timestamp: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

export interface ApiError {
  code: string;
  details: string;
  validationErrors?: Record<string, string>;
}

// Error Types
export interface AppError {
  message: string;
  code: string;
  status?: number;
  details?: string;
  severity?: 'error' | 'warning' | 'info';
}

// Reddit Post Types
export enum RedditPostStatus {
  PENDING = 'PENDING',
  ANALYZED = 'ANALYZED',
  FAILED = 'FAILED'
}

export enum PostModerationStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  /** Afet adayı değil; moderasyon/harita dışı (APPROVED değil). */
  NOT_REQUIRED = 'NOT_REQUIRED'
}

export interface RedditPost {
  id: number;
  redditPostId: string;
  title: string;
  content?: string | null;
  url: string;
  mediaUrl?: string | null;
  mediaUrls?: string[] | null;
  mediaContentHash?: string | null;
  duplicateOfPostId?: number | null;
  /** Reddit post id of the canonical row when this post duplicates another (same image). */
  duplicateOfRedditPostId?: string | null;
  author?: string | null;
  subreddit: string;
  upvotes?: number | null;
  commentCount?: number | null;
  redditCreatedAt: string;
  fetchedAt: string;
  isDisasterRelated?: boolean | null;
  relevanceScore?: number | null;
  baseRelevanceScore?: number | null;
  finalRelevanceScore?: number | null;
  relevanceAdjustmentDelta?: number | null;
  relevanceAdjustmentReasons?: string | null;
  appliedAuthorTrustScore?: number | null;
  analysisMessage?: string | null;
  // T2 fields (help request + humanitarian categories)
  isHelpRequest?: boolean | null;
  helpRequestProbability?: number | null;
  humanitarianCategories?: string | null;
  // Vision (optional)
  isImageTextMatch?: boolean | null;
  imageTextMatchScore?: number | null;
  imageCaption?: string | null;
  hasImageDamage?: boolean | null;
  imageDamageSeverity?: 'none' | 'minor' | 'moderate' | 'severe' | 'unknown' | string | null;
  imageDamageScore?: number | null;
  imageAnalyzedAt?: string | null;
  analyzedAt?: string | null;
  status: RedditPostStatus;
  moderationStatus?: PostModerationStatus | null;
  moderationReviewedAt?: string | null;
  moderationReviewedBy?: string | null;
  moderationNotes?: string | null;
  assignedModeratorId?: number | null;
  assignedModeratorEmail?: string | null;
  assignedModeratorName?: string | null;
  assignedAt?: string | null;
  /** Extracted after Location: / Konum: markers in post text */
  locationText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationCountry?: string | null;
  locationCity?: string | null;
  /** Report / chart key: marmara, aegean, southeast_anatolia, … */
  locationRegionKey?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ModerationStats {
  unassignedCount: number;
  mineCount: number;
  allPendingCount: number;
  todayApproved: number;
  todayRejected: number;
}

export interface PostStatistics {
  totalPosts: number;
  pendingPosts: number;
  analyzedPosts: number;
  failedPosts: number;
  disasterRelatedPosts: number;
  disasterPercentage: number;
  approvedDisasterPosts?: number;
  pendingModerationPosts?: number;
  rejectedModerationPosts?: number;
}

// About Types
export interface About {
  id?: number;
  title: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

// Content authors aggregated from ingested posts (API may still expose Reddit-specific field names)
export interface RedditAuthor {
  id: number;
  redditUsername: string;
  redditUserId?: string | null;
  totalPosts: number;
  analyzedPosts: number;
  disasterRelatedPosts: number;
  failedAnalysisPosts: number;
  trustScore?: number | null;
  firstSeenAt?: string | null;
  lastPostAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface RedditAuthorInsights {
  totalAuthors: number;
  averageTrust?: number | null;
  topByTrust: RedditAuthor[];
  topByPostVolume: RedditAuthor[];
}

// Map Types
export interface MapMarker {
  latitude: number;
  longitude: number;
  count: number;
  posts: MapPostInfo[];
}

export interface MapPostInfo {
  id: number;
  title: string;
  url: string;
  contentPreview?: string | null;
  locationText?: string | null;
  locationCountry?: string | null;
  locationCity?: string | null;
  locationRegionKey?: string | null;
}

export interface HistoricalReportSummary {
  analyzedWithHistoricalScores: number;
  averageBaseScore: number;
  averageFinalScore: number;
  averageAdjustmentDelta: number;
  penalizedCount: number;
  boostedCount: number;
  imageMismatchCount: number;
  noImagePenaltyCount: number;
  lowTrustPenaltyCount: number;
}

export interface HistoricalTrendPoint {
  day: string;
  postCount: number;
  avgBaseScore: number;
  avgFinalScore: number;
  avgDelta: number;
}

export interface NamedCount {
  key: string;
  count: number;
}

export interface ReportBreakdown {
  disasterTypes: NamedCount[];
  postsByRedditDay: NamedCount[];
  postsByRegion: NamedCount[];
}

export type ComplaintCategory = 'BUG' | 'CONTENT' | 'ACCOUNT' | 'OTHER';
export type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface Complaint {
  id: number;
  subject: string;
  body: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  submitterId: number;
  submitterName: string;
  submitterEmail: string;
  assignedStaffId?: number | null;
  assignedStaffName?: string | null;
  staffNotes?: string | null;
  assignedAt?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintCreateRequest {
  subject: string;
  body: string;
  category: ComplaintCategory;
}

export interface ComplaintStats {
  unassignedCount: number;
  mineCount: number;
  allOpenCount: number;
  resolvedCount: number;
}

