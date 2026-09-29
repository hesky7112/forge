export type WorkspaceMode = 'branches' | 'graph' | 'diffs' | 'ci' | 'storage' | 'collections' | 'meet';

export interface MeetingParticipant {
  id: string;
  name: string;
  avatar: string;
  role: 'host' | 'presenter' | 'attendee';
  isAudioOn: boolean;
  isVideoOn: boolean;
  isSpeaking: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  audioLevel: number; // 0 - 100
  color: string;
  title: string;
}

export interface MeetingRoom {
  id: string;
  name: string;
  topic: string;
  branchContext: string;
  startedAt: string;
  isRecording: boolean;
  participantsCount: number;
}

export interface InMeetingChatMessage {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  timestamp: string;
  codeSnippet?: string;
  color?: string;
}

export interface MeetingPoll {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  totalVotes: number;
  userVotedOptionId?: string;
}

export interface MeetingCaption {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
}

export interface AudioVideoSettings {
  microphoneId: string;
  speakerId: string;
  cameraId: string;
  noiseSuppression: boolean;
  virtualBackground: 'none' | 'blur-light' | 'blur-deep' | 'office' | 'server-room' | 'slate';
}

export interface BackendServiceStatus {
  id: string;
  name: string;
  engine: string;
  protocol: 'WebSocket' | 'HTTP/S3' | 'IPC/SSH' | 'REST' | 'gRPC';
  endpoint: string;
  port: number;
  status: 'healthy' | 'degraded' | 'connecting' | 'offline';
  latencyMs: number;
  description: string;
  docsUrl: string;
}

export interface SeaweedBucket {
  name: string;
  objectsCount: number;
  totalSizeBytes: number;
  createdAt: string;
  description: string;
  replication?: string;
}

export interface SeaweedObject {
  key: string;
  name: string;
  bucket: string;
  sizeBytes: number;
  sizeFormatted: string;
  contentType: string;
  lastModified: string;
  etag: string;
  storageClass: 'STANDARD' | 'COLD' | 'WARM';
  presignedUrl?: string;
  contentSnippet?: string;
  folder?: string;
}

export interface SeaweedTelemetry {
  filerUrl: string;
  s3Url: string;
  volumeServersCount: number;
  totalDiskBytes: number;
  usedDiskBytes: number;
  replication: string;
  activeChunkStreams: number;
}

export interface Repository {
  id: string;
  name: string;
  owner: string;
  defaultBranch: string;
  status: 'clean' | 'dirty' | 'syncing';
  remotes: string[];
}

export interface DiffHunk {
  id: string;
  file: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  header: string;
  content: string[];
  assignedBranchId: string | null; // null = unassigned staging
  astSymbols: string[]; // e.g. ["TokenStore::validate", "AuthHandler::login"]
  status: 'modified' | 'added' | 'deleted';
}

export interface VirtualBranch {
  id: string;
  ref: string; // e.g. refs/gitbutler/feat-auth-wasm
  name: string;
  description: string;
  baseCommit: string;
  upstreamBranch: string;
  author: string;
  updatedAt: string;
  status: 'active' | 'conflicted' | 'ready' | 'pushed';
  hunkIds: string[];
  blastRadius: 'low' | 'med' | 'high';
  blastScore: number; // 0 - 100
  astConflictsWith?: string[]; // IDs of other branches
}

export interface GraphNode {
  id: string;
  name: string;
  type: 'module' | 'struct' | 'function' | 'interface' | 'store';
  cluster: 'Auth & Crypto' | 'Routing & API' | 'Storage & S3' | 'UI & Visual' | 'CI Pipeline';
  clusterColor: string;
  pageRank: number; // 0.0 to 1.0
  file: string;
  lines: number;
  impacted?: boolean;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'calls' | 'imports' | 'implements' | 'depends_on';
}

export interface TeammatePresence {
  id: string;
  name: string;
  avatar: string;
  color: string;
  activeFile: string;
  activeLine: number;
  branch: string;
  status: 'online' | 'idle';
}

export interface ReviewComment {
  id: string;
  line: number;
  author: string;
  avatar: string;
  color: string;
  timestamp: string;
  text: string;
  suggestion?: string;
  resolved: boolean;
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  author: string;
  sourceBranch: string;
  targetBranch: string;
  status: 'open' | 'merged' | 'closed';
  hunksCount: number;
  commentsCount: number;
  blastRadius: 'low' | 'med' | 'high';
  createdAt: string;
}

export interface CiStep {
  id: string;
  name: string;
  status: 'success' | 'running' | 'failed' | 'queued';
  duration: string;
  logs: string[];
}

export interface CiJob {
  id: string;
  workflowName: string;
  branch: string;
  commitHash: string;
  status: 'success' | 'running' | 'failed';
  startedAt: string;
  duration: string;
  steps: CiStep[];
}

export interface ActivityEvent {
  id: string;
  user: string;
  avatar: string;
  action: string;
  target: string;
  time: string;
  type: 'commit' | 'push' | 'review' | 'ci' | 'branch';
}

export interface ChatMessage {
  id: string;
  user: string;
  avatar: string;
  time: string;
  text: string;
  codeSnippet?: string;
}

export interface CollectionRecord {
  id: string;
  created: string;
  updated: string;
  [key: string]: any;
}

export interface CollectionSchema {
  id: string;
  name: string;
  type: 'base' | 'auth' | 'view';
  fields: { name: string; type: string; required?: boolean }[];
  recordsCount: number;
}
