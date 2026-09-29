import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// In-Memory Database Store for Forge Developer Cockpit & PocketBase Collections
const db = {
  repos: [
    {
      id: 'repo-forge',
      name: 'forge-engine',
      owner: 'forge-org',
      defaultBranch: 'main',
      status: 'dirty',
      remotes: ['origin (russh://git.forge.internal/engine)', 'seaweed-s3 (s3://artifacts.forge.internal)'],
    },
    {
      id: 'repo-client',
      name: 'gitbutler-client',
      owner: 'forge-org',
      defaultBranch: 'main',
      status: 'clean',
      remotes: ['origin (russh://git.forge.internal/client)'],
    },
    {
      id: 'repo-spacetime',
      name: 'spacetimedb-runtime',
      owner: 'spacetime-labs',
      defaultBranch: 'v0.9.4',
      status: 'clean',
      remotes: ['origin (https://github.com/spacetime-labs/runtime)'],
    },
  ],
  branches: [
    {
      id: 'branch-1',
      ref: 'refs/gitbutler/feat-auth-wasm',
      name: 'feat-auth-wasm',
      description: 'Port token validation to WebAssembly with SpacetimeDB broadcast',
      baseCommit: 'a89c4d2',
      upstreamBranch: 'origin/main',
      author: 'Alex Vance',
      updatedAt: '12m ago',
      status: 'active',
      hunkIds: ['hunk-1', 'hunk-2'],
      blastRadius: 'med',
      blastScore: 42,
      astConflictsWith: ['branch-3'],
    },
    {
      id: 'branch-2',
      ref: 'refs/gitbutler/storage-presigned-urls',
      name: 'storage-presigned-urls',
      description: 'Add presigned S3 URLs for SeaweedFS artifact downloads',
      baseCommit: 'a89c4d2',
      upstreamBranch: 'origin/main',
      author: 'Sarah Chen',
      updatedAt: '35m ago',
      status: 'ready',
      hunkIds: ['hunk-3'],
      blastRadius: 'low',
      blastScore: 18,
    },
    {
      id: 'branch-3',
      ref: 'refs/gitbutler/fix-cache-lock',
      name: 'fix-cache-lock',
      description: 'Eliminate lock contention in TokenStore fast path LRU',
      baseCommit: 'a89c4d2',
      upstreamBranch: 'origin/main',
      author: 'Marcus Brody',
      updatedAt: '1h ago',
      status: 'conflicted',
      hunkIds: ['hunk-4'],
      blastRadius: 'high',
      blastScore: 78,
      astConflictsWith: ['branch-1'],
    },
  ],
  hunks: [
    {
      id: 'hunk-1',
      file: 'crates/auth/src/token.rs',
      oldStart: 42,
      oldLines: 12,
      newStart: 42,
      newLines: 18,
      header: 'impl TokenStore { pub fn validate(&self, bearer: &str) -> Result<Session, AuthError>',
      content: [
        '-   pub fn validate(&self, bearer: &str) -> Result<Session, AuthError> {',
        '-       if bearer.is_empty() { return Err(AuthError::Empty); }',
        '+   pub async fn validate_wasm(&self, bearer: &str, claims: &Claims) -> Result<Session, AuthError> {',
        '+       let token = self.cache.get_or_fetch(bearer).await?;',
        '+       if token.is_expired() {',
        '+           telemetry::counter!("auth.expired_token").increment(1);',
        '+           return Err(AuthError::Expired);',
        '+       }',
        '+       self.verify_signatures(token, claims).await',
      ],
      assignedBranchId: 'branch-1',
      astSymbols: ['TokenStore::validate', 'Claims::verify'],
      status: 'modified',
    },
    {
      id: 'hunk-2',
      file: 'crates/auth/src/token.rs',
      oldStart: 104,
      oldLines: 8,
      newStart: 110,
      newLines: 14,
      header: 'pub fn revoke_session(&mut self, session_id: &Uuid) -> bool',
      content: [
        '-   pub fn revoke_session(&mut self, session_id: &Uuid) -> bool {',
        '-       self.sessions.remove(session_id).is_some()',
        '+   pub async fn revoke_session(&mut self, session_id: &Uuid) -> bool {',
        '+       let removed = self.sessions.remove(session_id).is_some();',
        '+       spacetimedb::broadcast_revocation(session_id).await;',
        '+       removed',
      ],
      assignedBranchId: 'branch-1',
      astSymbols: ['TokenStore::revoke_session', 'broadcast_revocation'],
      status: 'modified',
    },
    {
      id: 'hunk-3',
      file: 'crates/storage/src/seaweed.rs',
      oldStart: 18,
      oldLines: 6,
      newStart: 18,
      newLines: 15,
      header: 'pub struct SeaweedFsClient { endpoint: Url, bucket: String }',
      content: [
        '-   pub async fn fetch_artifact(&self, path: &str) -> Result<Bytes> {',
        '-       reqwest::get(&format!("{}/{}", self.endpoint, path)).await?.bytes().await',
        '+   pub async fn fetch_artifact_presigned(&self, path: &str, ttl_secs: u64) -> Result<PresignedUrl> {',
        '+       let signer = S3Presigner::new(&self.secret_key, ttl_secs);',
        '+       signer.generate_get_url(&self.bucket, path)',
        '+   }',
      ],
      assignedBranchId: 'branch-2',
      astSymbols: ['SeaweedFsClient::fetch_artifact_presigned'],
      status: 'added',
    },
    {
      id: 'hunk-4',
      file: 'crates/auth/src/token.rs',
      oldStart: 45,
      oldLines: 10,
      newStart: 45,
      newLines: 12,
      header: 'impl TokenStore { pub fn validate(&self, bearer: &str) -> Result<Session, AuthError>',
      content: [
        '-   let cache_key = hash_bearer(bearer);',
        '+   // Conflicting fast-path lock in branch-3',
        '+   let cache_key = self.fast_lru.get_or_insert_with(bearer, hash_bearer);',
      ],
      assignedBranchId: 'branch-3',
      astSymbols: ['TokenStore::validate'],
      status: 'modified',
    },
    {
      id: 'hunk-5',
      file: 'src/lib/stores/presence.ts',
      oldStart: 88,
      oldLines: 14,
      newStart: 88,
      newLines: 22,
      header: 'export function subscribePresence(channel: string)',
      content: [
        '+ export const activePresence = derived(spacetimeWs, ($ws) => {',
        '+   return $ws.table("teammates").filter(t => t.active);',
        '+ });',
        '+ export function broadcastCursor(file: string, line: number) {',
        '+   spacetime.reducers.updateCursor({ file, line, timestamp: Date.now() });',
        '+ }',
      ],
      assignedBranchId: null,
      astSymbols: ['subscribePresence', 'broadcastCursor'],
      status: 'added',
    },
    {
      id: 'hunk-6',
      file: 'crates/russh/src/gateway.rs',
      oldStart: 120,
      oldLines: 5,
      newStart: 120,
      newLines: 11,
      header: 'pub async fn handle_push_negotiation(&mut self)',
      content: [
        '+   tracing::info!("Negotiating packfile stream with russh client");',
        '+   let stream = self.channel.open_stream().await?;',
        '+   git_pack::unpack_header(&stream).await?;',
      ],
      assignedBranchId: null,
      astSymbols: ['handle_push_negotiation'],
      status: 'modified',
    },
  ],
  reviews: [
    {
      id: 'rev-1',
      line: 44,
      author: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      color: '#388bfd',
      timestamp: '14m ago',
      text: 'Should we ensure the Wasm runtime instance handles memory limits gracefully if claims payload exceeds 64KB?',
      suggestion: '+       if claims.encoded_len() > 65_536 { return Err(AuthError::PayloadTooLarge); }',
      resolved: false,
    },
    {
      id: 'rev-2',
      line: 48,
      author: 'Marcus Brody',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
      color: '#f0883e',
      timestamp: '8m ago',
      text: 'Note that the fast LRU lock conflict is already avoided if claims verification is offloaded to the async worker pool.',
      resolved: false,
    },
  ],
  activity: [
    {
      id: 'act-1',
      user: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      action: 'opened review thread on line 44',
      target: 'token.rs',
      time: '2m ago',
      type: 'review',
    },
    {
      id: 'act-2',
      user: 'CI Runner #4',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop&crop=faces',
      action: 'completed step "Cargo Check & AST Analysis"',
      target: 'matrix-ci',
      time: '4m ago',
      type: 'ci',
    },
  ],
  chat: [
    {
      id: 'msg-1',
      user: 'Alex Vance',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
      time: '11:24 AM',
      text: 'Just finished staging the Wasm validation routine in `feat-auth-wasm`.',
    },
    {
      id: 'msg-2',
      user: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      time: '11:27 AM',
      text: 'Looks solid! I left a review note on line 44 about the buffer size limit.',
    },
  ],
  collections: {
    virtual_branches: [] as any[],
    diff_hunks: [] as any[],
    review_threads: [] as any[],
    presence_pips: [] as any[],
    ci_runs: [] as any[],
  },
};

// ==================== REST API ENDPOINTS ====================

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.4.0-forge',
    spacetimedb: 'connected',
    seaweedfs: 'ready',
    russh_gateway: 'listening',
    timestamp: new Date().toISOString(),
  });
});

// Repositories
app.get('/api/v1/repos', (req, res) => {
  res.json(db.repos);
});

// Virtual Branches
app.get('/api/v1/branches', (req, res) => {
  res.json(db.branches);
});

app.post('/api/v1/branches', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const newBranch = {
    id: `branch-${Date.now()}`,
    ref: `refs/gitbutler/${name}`,
    name,
    description: description || '',
    baseCommit: 'a89c4d2',
    upstreamBranch: 'origin/main',
    author: 'Alex Vance',
    updatedAt: 'Just now',
    status: 'active',
    hunkIds: [],
    blastRadius: 'low',
    blastScore: 12,
  };
  db.branches.push(newBranch);
  res.status(201).json(newBranch);
});

app.post('/api/v1/branches/:id/push', (req, res) => {
  const branch = db.branches.find((b) => b.id === req.params.id);
  if (!branch) return res.status(404).json({ error: 'Branch not found' });
  branch.status = 'pushed';
  branch.updatedAt = 'Just now';
  res.json({ success: true, branch, remote: 'russh://git.forge.internal/engine' });
});

app.post('/api/v1/branches/:id/commit', (req, res) => {
  const branch = db.branches.find((b) => b.id === req.params.id);
  if (!branch) return res.status(404).json({ error: 'Branch not found' });
  branch.updatedAt = 'Just now';
  res.json({ success: true, branch });
});

// Diff Hunks
app.get('/api/v1/hunks', (req, res) => {
  res.json(db.hunks);
});

app.post('/api/v1/hunks/:id/assign', (req, res) => {
  const hunk = db.hunks.find((h) => h.id === req.params.id);
  if (!hunk) return res.status(404).json({ error: 'Hunk not found' });
  const { branchId } = req.body;
  hunk.assignedBranchId = branchId || null;

  // Update branch hunk references
  db.branches.forEach((b) => {
    if (b.id === branchId) {
      if (!b.hunkIds.includes(hunk.id)) b.hunkIds.push(hunk.id);
    } else {
      b.hunkIds = b.hunkIds.filter((id) => id !== hunk.id);
    }
  });

  res.json(hunk);
});

// Reviews
app.get('/api/v1/reviews', (req, res) => {
  res.json(db.reviews);
});

app.post('/api/v1/reviews', (req, res) => {
  const { line, text, suggestion } = req.body;
  const newRev = {
    id: `rev-${Date.now()}`,
    line: Number(line),
    author: 'Alex Vance',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
    color: '#388bfd',
    timestamp: 'Just now',
    text,
    suggestion,
    resolved: false,
  };
  db.reviews.push(newRev);
  res.status(201).json(newRev);
});

app.patch('/api/v1/reviews/:id/resolve', (req, res) => {
  const rev = db.reviews.find((r) => r.id === req.params.id);
  if (!rev) return res.status(404).json({ error: 'Review not found' });
  rev.resolved = true;
  res.json(rev);
});

// PocketBase Collections REST API
app.get('/api/v1/collections/:name/records', (req, res) => {
  const name = req.params.name as keyof typeof db.collections;
  const records = db.collections[name] || [];
  const q = req.query.filter as string;
  if (q) {
    return res.json(
      records.filter((r) =>
        Object.values(r).some((v) => String(v).toLowerCase().includes(q.toLowerCase()))
      )
    );
  }
  res.json(records);
});

app.post('/api/v1/collections/:name/records', (req, res) => {
  const name = req.params.name as keyof typeof db.collections;
  if (!db.collections[name]) db.collections[name] = [];
  const record = {
    id: `rec_${Math.random().toString(36).substring(2, 9)}`,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    ...req.body,
  };
  db.collections[name].unshift(record);
  res.status(201).json(record);
});

app.delete('/api/v1/collections/:name/records/:id', (req, res) => {
  const name = req.params.name as keyof typeof db.collections;
  if (db.collections[name]) {
    db.collections[name] = db.collections[name].filter((r) => r.id !== req.params.id);
  }
  res.json({ success: true, id: req.params.id });
});

// ==================== SeaweedFS S3 Storage Endpoints ====================
const storageDb = {
  buckets: [
    {
      name: 'forge-ci-artifacts',
      objectsCount: 14,
      totalSizeBytes: 34816000,
      createdAt: '2026-09-12',
      description: 'Build outputs, wasm-pack bundles, and raw act CI run logs',
    },
    {
      name: 'graphify-cache',
      objectsCount: 8,
      totalSizeBytes: 12450000,
      createdAt: '2026-09-15',
      description: 'graph.json AST representations and Leiden algorithmic cluster exports',
    },
    {
      name: 'git-lfs-objects',
      objectsCount: 42,
      totalSizeBytes: 198200000,
      createdAt: '2026-08-20',
      description: 'Git Large File Storage blobs and model checkpoint tensors',
    },
    {
      name: 'release-binaries',
      objectsCount: 6,
      totalSizeBytes: 84900000,
      createdAt: '2026-09-20',
      description: 'Tauri v2 desktop installer bundles and wasm32 binaries',
    },
  ],
  objects: [
    {
      key: 'matrix-ci/runs/9842/raw_console.log',
      name: 'raw_console.log',
      bucket: 'forge-ci-artifacts',
      sizeBytes: 142800,
      sizeFormatted: '142.8 KB',
      contentType: 'text/plain',
      lastModified: '5m ago',
      etag: '"3b8f1d2e4a5c6b7"',
      storageClass: 'STANDARD',
      presignedUrl: 'https://s3.seaweedfs.forge.internal/forge-ci-artifacts/matrix-ci/runs/9842/raw_console.log?X-Amz-Expires=3600',
      contentSnippet: '[act] Initializing sparse checkout from russh gateway\n[act] Fetched commit 7c81d2f33b1e9c5f89\n[act] Compiling forge-auth v0.8.0\n✓ All 18 wasm integration tests passed in 02:44',
    },
    {
      key: 'matrix-ci/runs/9842/wasm_test_results.json',
      name: 'wasm_test_results.json',
      bucket: 'forge-ci-artifacts',
      sizeBytes: 89400,
      sizeFormatted: '89.4 KB',
      contentType: 'application/json',
      lastModified: '5m ago',
      etag: '"9c7a2d4f1e6b8c3"',
      storageClass: 'STANDARD',
      presignedUrl: 'https://s3.seaweedfs.forge.internal/forge-ci-artifacts/matrix-ci/runs/9842/wasm_test_results.json?X-Amz-Expires=3600',
      contentSnippet: '{\n  "suite": "wasm-integration",\n  "passed": 18,\n  "failed": 0,\n  "duration_ms": 2840,\n  "memory_peak_kb": 4120\n}',
    },
    {
      key: 'ast/graph.json',
      name: 'graph.json',
      bucket: 'graphify-cache',
      sizeBytes: 428000,
      sizeFormatted: '428 KB',
      contentType: 'application/json',
      lastModified: '14m ago',
      etag: '"1f4e7a9b2c5d8e0"',
      storageClass: 'STANDARD',
      presignedUrl: 'https://s3.seaweedfs.forge.internal/graphify-cache/ast/graph.json?X-Amz-Expires=3600',
      contentSnippet: '{\n  "nodes_count": 11,\n  "edges_count": 9,\n  "clusters": 5,\n  "leiden_modularity": 0.812,\n  "generated_by": "graphify-rs v0.4.1"\n}',
    },
  ],
  telemetry: {
    filerUrl: 'http://seaweedfs:8888',
    s3Url: 'http://seaweedfs:8333',
    volumeServersCount: 4,
    totalDiskBytes: 1099511627776,
    usedDiskBytes: 322122547200,
    replication: '001 (rack-aware dual copy)',
    activeChunkStreams: 18,
  },
};

app.get('/api/v1/storage/buckets', (req, res) => {
  res.json(storageDb.buckets);
});

app.get('/api/v1/storage/buckets/:bucket/objects', (req, res) => {
  const bucket = req.params.bucket;
  const filtered = storageDb.objects.filter((o) => o.bucket === bucket);
  res.json(filtered);
});

app.post('/api/v1/storage/buckets/:bucket/upload', (req, res) => {
  const { name, sizeBytes, contentType } = req.body;
  const bucket = req.params.bucket;
  const formatted = sizeBytes > 1000000 ? `${(sizeBytes / 1000000).toFixed(2)} MB` : `${(sizeBytes / 1000).toFixed(1)} KB`;
  const newObj = {
    key: name,
    name: name.split('/').pop() || name,
    bucket,
    sizeBytes: sizeBytes || 1024,
    sizeFormatted: formatted,
    contentType: contentType || 'application/octet-stream',
    lastModified: 'Just now',
    etag: `"${Math.random().toString(36).substring(2, 10)}"`,
    storageClass: 'STANDARD',
    presignedUrl: `https://s3.seaweedfs.forge.internal/${bucket}/${name}?X-Amz-Expires=3600`,
    contentSnippet: 'Uploaded stream payload',
  };
  storageDb.objects.unshift(newObj);
  res.status(201).json(newObj);
});

app.delete('/api/v1/storage/buckets/:bucket/objects/:key(*)', (req, res) => {
  const key = req.params.key;
  storageDb.objects = storageDb.objects.filter((o) => o.key !== key);
  res.json({ success: true, key });
});

app.get('/api/v1/storage/telemetry', (req, res) => {
  res.json(storageDb.telemetry);
});

// Start Express Server with Vite Middlewares in Dev
async function startServer() {
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        port: PORT,
        host: '0.0.0.0',
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Forge Studio full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
