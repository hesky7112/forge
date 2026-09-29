import React, { useState, useMemo } from 'react';
import {
  HardDrive,
  Folder,
  FolderPlus,
  File,
  FileText,
  FileCode,
  Download,
  Copy,
  Trash2,
  Plus,
  Search,
  ExternalLink,
  Shield,
  Server,
  Clock,
  Eye,
  Check,
  RefreshCw,
  UploadCloud,
  Layers,
  LayoutGrid,
  List,
  ChevronRight,
  Code2,
  Terminal,
  Activity,
} from 'lucide-react';
import { SeaweedBucket, SeaweedObject, SeaweedTelemetry } from '../../types';
import { Table, Column } from '../common/Table';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Drawer } from '../common/Drawer';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { useToast } from '../common/Toast';
import { seaweedClient } from '../../lib/api';

interface SeaweedStorageViewProps {
  buckets: SeaweedBucket[];
  objects: SeaweedObject[];
  telemetry: SeaweedTelemetry;
  onUploadObject: (bucket: string, name: string, size: number, type: string) => void;
  onDeleteObject: (key: string) => void;
  onCreateBucket?: (name: string, description: string, replication: string) => void;
}

export const SeaweedStorageView: React.FC<SeaweedStorageViewProps> = ({
  buckets,
  objects,
  telemetry,
  onUploadObject,
  onDeleteObject,
  onCreateBucket,
}) => {
  const { addToast } = useToast();
  const [selectedBucketName, setSelectedBucketName] = useState<string>(buckets[0]?.name || 'forge-ci-artifacts');
  const [currentFolder, setCurrentFolder] = useState<string>(''); // '' = root
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'wasm' | 'json' | 'log' | 'binary'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedObject, setSelectedObject] = useState<SeaweedObject | null>(null);

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateBucketModalOpen, setIsCreateBucketModalOpen] = useState(false);
  const [isBackendCodeModalOpen, setIsBackendCodeModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);

  // Upload state
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadContentType, setUploadContentType] = useState('application/json');
  const [uploadingProgress, setUploadingProgress] = useState<number | null>(null);

  // New Bucket state
  const [newBucketName, setNewBucketName] = useState('');
  const [newBucketDescription, setNewBucketDescription] = useState('');
  const [newBucketReplication, setNewBucketReplication] = useState('001');

  // New Folder state
  const [newFolderName, setNewFolderName] = useState('');

  // Presigned URL generator
  const [presignTtlSecs, setPresignTtlSecs] = useState<number>(3600);
  const [isCopied, setIsCopied] = useState(false);
  const [isCopiedCurl, setIsCopiedCurl] = useState(false);

  const currentBucket = buckets.find((b) => b.name === selectedBucketName) || buckets[0];

  // Filter objects by current bucket
  const bucketObjects = useMemo(() => {
    return objects.filter((obj) => obj.bucket === currentBucket.name);
  }, [objects, currentBucket]);

  // Extract folder hierarchy
  const foldersInBucket = useMemo(() => {
    const folders = new Set<string>();
    bucketObjects.forEach((obj) => {
      const parts = obj.key.split('/');
      if (parts.length > 1) {
        folders.add(parts[0]);
      }
    });
    return Array.from(folders);
  }, [bucketObjects]);

  // Filter objects by folder, search query, and MIME filter
  const filteredObjects = useMemo(() => {
    return bucketObjects.filter((obj) => {
      // Folder check
      if (currentFolder && !obj.key.startsWith(currentFolder + '/')) {
        return false;
      }

      // Filter type check
      if (filterType === 'wasm' && !obj.contentType.includes('wasm')) return false;
      if (filterType === 'json' && !obj.contentType.includes('json')) return false;
      if (filterType === 'log' && !obj.contentType.includes('plain') && !obj.name.includes('.log')) return false;
      if (filterType === 'binary' && !obj.contentType.includes('stream') && !obj.name.includes('.bin')) return false;

      // Search query check
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        obj.name.toLowerCase().includes(q) ||
        obj.key.toLowerCase().includes(q) ||
        obj.contentType.toLowerCase().includes(q) ||
        obj.storageClass.toLowerCase().includes(q)
      );
    });
  }, [bucketObjects, currentFolder, filterType, searchQuery]);

  const handleCopyPresigned = (url: string) => {
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    addToast({
      type: 'success',
      title: 'Presigned S3 URL Copied',
      description: `Valid for ${presignTtlSecs / 60} minutes via SeaweedFS S3 gateway`,
    });
  };

  const handleCopyCurl = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setIsCopiedCurl(true);
    setTimeout(() => setIsCopiedCurl(false), 2000);
    addToast({
      type: 'success',
      title: 'cURL Command Copied',
      description: 'Ready to run in terminal or CI script',
    });
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName.trim()) return;

    // Simulate real chunked multipart upload to SeaweedFS
    setUploadingProgress(10);
    const interval = setInterval(() => {
      setUploadingProgress((prev) => {
        if (!prev || prev >= 90) {
          clearInterval(interval);
          return 100;
        }
        return prev + 30;
      });
    }, 150);

    setTimeout(() => {
      clearInterval(interval);
      setUploadingProgress(null);
      const mockSize = Math.floor(Math.random() * 250000) + 12000;
      const fullPath = currentFolder ? `${currentFolder}/${uploadFileName.trim()}` : uploadFileName.trim();
      onUploadObject(currentBucket.name, fullPath, mockSize, uploadContentType);
      setUploadFileName('');
      setIsUploadModalOpen(false);
      addToast({
        type: 'success',
        title: 'Uploaded to SeaweedFS S3',
        description: `Chunked blob stored in '${currentBucket.name}' (${telemetry.replication})`,
      });
    }, 700);
  };

  const handleCreateBucketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBucketName.trim()) return;
    if (onCreateBucket) {
      onCreateBucket(newBucketName.trim(), newBucketDescription.trim(), newBucketReplication);
    }
    setSelectedBucketName(newBucketName.trim());
    setNewBucketName('');
    setNewBucketDescription('');
    setIsCreateBucketModalOpen(false);
    addToast({
      type: 'success',
      title: 'S3 Bucket Provisioned',
      description: `New SeaweedFS volume assigned with replication ${newBucketReplication}`,
    });
  };

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const folder = newFolderName.trim().replace(/^\/+|\/+$/g, '');
    setCurrentFolder(folder);
    setNewFolderName('');
    setIsNewFolderModalOpen(false);
    addToast({
      type: 'info',
      title: 'Directory Created',
      description: `Now viewing /${folder}`,
    });
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.includes('wasm')) {
      return <FileCode size={15} className="text-[#a371f7]" />;
    }
    if (contentType.includes('json')) {
      return <FileCode size={15} className="text-[#388bfd]" />;
    }
    if (contentType.includes('text') || contentType.includes('plain')) {
      return <FileText size={15} className="text-[#3fb950]" />;
    }
    return <File size={15} className="text-[#d29922]" />;
  };

  const columns: Column<SeaweedObject>[] = [
    {
      key: 'name',
      header: 'Object Key & Path',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2 truncate max-w-sm cursor-pointer hover:underline text-[#58a6ff]">
          {getFileIcon(row.contentType)}
          <span className="truncate font-mono font-medium">{row.key}</span>
        </div>
      ),
    },
    {
      key: 'sizeBytes',
      header: 'Size',
      sortable: true,
      align: 'right',
      render: (row) => <span className="font-mono text-[#f0f6fc]">{row.sizeFormatted}</span>,
    },
    {
      key: 'contentType',
      header: 'MIME Type',
      sortable: true,
      render: (row) => (
        <span className="text-[11px] font-mono text-[#8b949e]">{row.contentType}</span>
      ),
    },
    {
      key: 'storageClass',
      header: 'Tier',
      sortable: true,
      render: (row) => (
        <Badge
          variant={row.storageClass === 'STANDARD' ? 'success' : row.storageClass === 'WARM' ? 'info' : 'neutral'}
          subtleBox
        >
          {row.storageClass}
        </Badge>
      ),
    },
    {
      key: 'lastModified',
      header: 'Modified',
      sortable: true,
      render: (row) => (
        <span className="text-[11px] font-mono text-[#8b949e]">{row.lastModified}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleCopyPresigned(row.presignedUrl || `https://s3.seaweedfs/${row.key}`)}
            title="Copy Presigned S3 URL"
            className="p-1 rounded text-[#8b949e] hover:text-[#58a6ff] hover:bg-[#21262d] transition-colors"
          >
            <Copy size={13} />
          </button>
          <button
            onClick={() => {
              addToast({
                type: 'info',
                title: 'Downloading Artifact',
                description: `Streaming ${row.name} directly via SeaweedFS S3 gateway`,
              });
            }}
            title="Download Object"
            className="p-1 rounded text-[#8b949e] hover:text-[#3fb950] hover:bg-[#21262d] transition-colors"
          >
            <Download size={13} />
          </button>
          <button
            onClick={() => onDeleteObject(row.key)}
            title="Delete Object"
            className="p-1 rounded text-[#8b949e] hover:text-[#f85149] hover:bg-[#21262d] transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 flex h-full min-h-0 overflow-hidden bg-[#07090e]">
      {/* Sub-nav: SeaweedFS S3 Buckets & Topology */}
      <div className="w-64 border-r border-[#21262d] bg-[#0d1117] flex flex-col shrink-0">
        {/* Bucket header */}
        <div className="p-3 border-b border-[#21262d] flex items-center justify-between bg-[#161b22]/40">
          <div className="flex items-center gap-2">
            <HardDrive size={15} className="text-[#3fb950]" />
            <span className="font-semibold text-xs text-[#f0f6fc]">SeaweedFS S3</span>
          </div>
          <button
            onClick={() => setIsCreateBucketModalOpen(true)}
            title="Create New Bucket"
            className="p-1 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Bucket list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[10px] font-mono text-[#8b949e] uppercase tracking-wider">
            S3 Buckets ({buckets.length})
          </div>
          {buckets.map((b) => {
            const isSelected = b.name === selectedBucketName;
            return (
              <button
                key={b.name}
                onClick={() => {
                  setSelectedBucketName(b.name);
                  setCurrentFolder('');
                }}
                className={`w-full text-left p-2.5 rounded-lg flex flex-col gap-1 transition-all ${
                  isSelected
                    ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm'
                    : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-xs font-semibold truncate">
                    <Folder size={13} className={isSelected ? 'text-[#3fb950]' : 'text-[#484f58]'} />
                    <span className="truncate">{b.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#8b949e]">{b.objectsCount} objs</span>
                </div>
                <div className="text-[10px] text-[#8b949e] line-clamp-1">{b.description}</div>
              </button>
            );
          })}

          {/* Subfolders in selected bucket */}
          {foldersInBucket.length > 0 && (
            <div className="pt-2">
              <div className="px-2 py-1 text-[10px] font-mono text-[#8b949e] uppercase tracking-wider flex items-center justify-between">
                <span>Folders</span>
                <button
                  onClick={() => setIsNewFolderModalOpen(true)}
                  className="hover:text-[#58a6ff]"
                  title="New Folder"
                >
                  <Plus size={12} />
                </button>
              </div>
              <div className="space-y-0.5 mt-0.5">
                <button
                  onClick={() => setCurrentFolder('')}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-mono flex items-center gap-2 ${
                    currentFolder === '' ? 'text-[#58a6ff] bg-[#161b22] font-semibold' : 'text-[#8b949e] hover:bg-[#161b22]'
                  }`}
                >
                  <Folder size={12} />
                  <span>/ (root)</span>
                </button>
                {foldersInBucket.map((f) => (
                  <button
                    key={f}
                    onClick={() => setCurrentFolder(f)}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-mono flex items-center gap-2 ${
                      currentFolder === f ? 'text-[#58a6ff] bg-[#161b22] font-semibold' : 'text-[#8b949e] hover:bg-[#161b22]'
                    }`}
                  >
                    <Folder size={12} className="text-[#d29922]" />
                    <span className="truncate">/{f}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SeaweedFS Volume Server Telemetry Card */}
        <div className="p-3 border-t border-[#21262d] bg-[#161b22]/40 text-xs font-mono space-y-2">
          <div className="flex items-center justify-between text-[11px] text-[#8b949e]">
            <span className="flex items-center gap-1.5 text-[#f0f6fc]">
              <Server size={12} className="text-[#388bfd]" />
              Filer Cluster
            </span>
            <span className="text-[#3fb950] font-semibold">● 4 Nodes</span>
          </div>

          <div className="w-full bg-[#0d1117] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#388bfd] h-full" style={{ width: '29%' }} />
          </div>

          <div className="flex justify-between text-[10px] text-[#8b949e]">
            <span>Used: 300 GB</span>
            <span>Total: 1 TB (29%)</span>
          </div>

          <div className="text-[10px] text-[#8b949e] pt-1 border-t border-[#21262d] flex items-center justify-between">
            <span className="truncate">Repl: {telemetry.replication.split(' ')[0]}</span>
            <button
              onClick={() => setIsBackendCodeModalOpen(true)}
              className="text-[#58a6ff] hover:underline flex items-center gap-1"
            >
              <Code2 size={11} />
              API Snippets
            </button>
          </div>
        </div>
      </div>

      {/* Main Storage Stage */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#07090e]">
        {/* Top Action & Navigation Bar */}
        <div className="px-4 py-2.5 border-b border-[#21262d] bg-[#0d1117] flex items-center justify-between gap-4 shrink-0 text-xs">
          {/* Breadcrumb Path */}
          <div className="flex items-center gap-1.5 font-mono text-xs text-[#8b949e] truncate">
            <span className="text-[#3fb950] font-semibold">s3://</span>
            <button
              onClick={() => setCurrentFolder('')}
              className="text-[#f0f6fc] font-semibold hover:underline"
            >
              {currentBucket.name}
            </button>
            {currentFolder && (
              <>
                <ChevronRight size={13} className="text-[#484f58]" />
                <span className="text-[#58a6ff] font-semibold">{currentFolder}</span>
              </>
            )}
            <span className="text-[#8b949e]">({filteredObjects.length} items)</span>
          </div>

          {/* Search, Filter & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Filter Chips */}
            <div className="hidden lg:flex items-center gap-1 p-0.5 rounded-lg bg-[#161b22] border border-[#21262d]">
              {(['all', 'wasm', 'json', 'log', 'binary'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors uppercase ${
                    filterType === t ? 'bg-[#21262d] text-[#f0f6fc] font-semibold shadow-xs' : 'text-[#8b949e] hover:text-[#f0f6fc]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="w-52">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter files..."
                icon={<Search size={12} />}
                onClear={() => setSearchQuery('')}
              />
            </div>

            {/* View Mode Toggle (Table / Grid) */}
            <div className="flex items-center border border-[#30363d] rounded-lg overflow-hidden bg-[#161b22]">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 ${viewMode === 'table' ? 'bg-[#21262d] text-white' : 'text-[#8b949e] hover:text-white'}`}
                title="Table List View"
              >
                <List size={14} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 ${viewMode === 'grid' ? 'bg-[#21262d] text-white' : 'text-[#8b949e] hover:text-white'}`}
                title="Grid Tiles View"
              >
                <LayoutGrid size={14} />
              </button>
            </div>

            {/* Upload Button */}
            <Button
              size="sm"
              variant="primary"
              icon={<UploadCloud size={13} />}
              onClick={() => setIsUploadModalOpen(true)}
            >
              Upload Blob
            </Button>
          </div>
        </div>

        {/* Objects View: Table vs Grid */}
        <div className="flex-1 overflow-auto p-4">
          {viewMode === 'table' ? (
            <Table
              columns={columns}
              data={filteredObjects}
              keyField="key"
              onRowClick={(row) => setSelectedObject(row)}
              emptyMessage={`No objects found in bucket '${currentBucket.name}'`}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredObjects.map((obj) => (
                <div
                  key={obj.key}
                  onClick={() => setSelectedObject(obj)}
                  className="p-3.5 rounded-xl bg-[#0d1117] border border-[#21262d] hover:border-[#388bfd]/50 hover:bg-[#161b22] transition-all cursor-pointer flex flex-col justify-between gap-3 group shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-9 h-9 rounded-lg bg-[#161b22] border border-[#30363d] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {getFileIcon(obj.contentType)}
                    </div>
                    <Badge
                      variant={obj.storageClass === 'STANDARD' ? 'success' : 'neutral'}
                      subtleBox
                    >
                      {obj.storageClass}
                    </Badge>
                  </div>

                  <div>
                    <div className="font-mono text-xs font-semibold text-[#f0f6fc] truncate group-hover:text-[#58a6ff] transition-colors" title={obj.name}>
                      {obj.name}
                    </div>
                    <div className="text-[10px] font-mono text-[#8b949e] truncate mt-0.5">
                      {obj.key}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#21262d] flex items-center justify-between text-[11px] font-mono text-[#8b949e]">
                    <span>{obj.sizeFormatted}</span>
                    <span>{obj.lastModified}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Object Inspector & Presigned URL Drawer */}
      <Drawer
        isOpen={Boolean(selectedObject)}
        onClose={() => setSelectedObject(null)}
        title={selectedObject?.name || 'Object Inspector'}
        subtitle={`s3://${selectedObject?.bucket}/${selectedObject?.key}`}
        width="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="danger"
              size="xs"
              icon={<Trash2 size={12} />}
              onClick={() => {
                if (selectedObject) onDeleteObject(selectedObject.key);
                setSelectedObject(null);
              }}
            >
              Delete Object
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" size="xs" onClick={() => setSelectedObject(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="xs"
                icon={<Download size={12} />}
                onClick={() => {
                  addToast({
                    type: 'success',
                    title: 'Downloading from SeaweedFS',
                    description: `Streaming ${selectedObject?.name}`,
                  });
                }}
              >
                Download
              </Button>
            </div>
          </div>
        }
      >
        {selectedObject && (
          <div className="space-y-4 font-mono text-xs">
            {/* Presigned S3 URL Generator */}
            <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-[#f0f6fc] flex items-center gap-1.5">
                  <Shield size={13} className="text-[#3fb950]" />
                  Presigned S3 URL
                </span>
                <select
                  value={presignTtlSecs}
                  onChange={(e) => setPresignTtlSecs(Number(e.target.value))}
                  className="bg-[#161b22] border border-[#30363d] text-[11px] rounded px-2 py-0.5 text-[#f0f6fc]"
                >
                  <option value={900}>TTL: 15 minutes</option>
                  <option value={3600}>TTL: 1 hour</option>
                  <option value={86400}>TTL: 24 hours</option>
                  <option value={604800}>TTL: 7 days</option>
                </select>
              </div>

              <div className="relative">
                <textarea
                  readOnly
                  rows={3}
                  value={
                    selectedObject.presignedUrl ||
                    seaweedClient.generatePresignedUrl(selectedObject.bucket, selectedObject.key, presignTtlSecs)
                  }
                  className="w-full bg-[#161b22] border border-[#21262d] rounded p-2 text-[11px] text-[#58a6ff] focus:outline-none"
                />
                <button
                  onClick={() =>
                    handleCopyPresigned(
                      selectedObject.presignedUrl ||
                        seaweedClient.generatePresignedUrl(selectedObject.bucket, selectedObject.key, presignTtlSecs)
                    )
                  }
                  className="absolute right-2 bottom-3 px-2 py-1 bg-[#21262d] hover:bg-[#388bfd] text-white rounded text-[11px] flex items-center gap-1 transition-colors"
                >
                  {isCopied ? <Check size={11} /> : <Copy size={11} />}
                  <span>{isCopied ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>

              {/* cURL Command Generator */}
              <div className="pt-2 border-t border-[#21262d]">
                <div className="flex items-center justify-between mb-1 text-[11px] text-[#8b949e]">
                  <span>Terminal cURL command:</span>
                  <button
                    onClick={() =>
                      handleCopyCurl(
                        seaweedClient.generateCurlCommand(
                          selectedObject.bucket,
                          selectedObject.key,
                          selectedObject.presignedUrl
                        )
                      )
                    }
                    className="text-[#58a6ff] hover:underline flex items-center gap-1"
                  >
                    {isCopiedCurl ? <Check size={11} /> : <Copy size={11} />}
                    <span>{isCopiedCurl ? 'Copied' : 'Copy cURL'}</span>
                  </button>
                </div>
                <pre className="p-2 rounded bg-[#07090e] border border-[#21262d] text-[10px] text-[#3fb950] overflow-x-auto">
                  <code>
                    {seaweedClient.generateCurlCommand(
                      selectedObject.bucket,
                      selectedObject.key,
                      selectedObject.presignedUrl
                    )}
                  </code>
                </pre>
              </div>
            </div>

            {/* Object Attributes */}
            <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#21262d] space-y-2">
              <div className="flex justify-between py-1 border-b border-[#21262d]">
                <span className="text-[#8b949e]">Size:</span>
                <span className="text-[#f0f6fc]">{selectedObject.sizeFormatted}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#21262d]">
                <span className="text-[#8b949e]">Content Type:</span>
                <span className="text-[#58a6ff]">{selectedObject.contentType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#21262d]">
                <span className="text-[#8b949e]">ETag:</span>
                <span className="text-[#8b949e]">{selectedObject.etag}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#21262d]">
                <span className="text-[#8b949e]">Storage Tier:</span>
                <span className="text-[#3fb950]">{selectedObject.storageClass}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#8b949e]">Last Modified:</span>
                <span className="text-[#f0f6fc]">{selectedObject.lastModified}</span>
              </div>
            </div>

            {/* Content Snippet Preview */}
            {selectedObject.contentSnippet && (
              <div className="space-y-1.5">
                <div className="text-[11px] text-[#8b949e] font-semibold flex items-center gap-1">
                  <Eye size={12} />
                  Raw Content Preview
                </div>
                <pre className="p-3 rounded-lg bg-[#07090e] border border-[#21262d] text-[11px] text-[#3fb950] overflow-x-auto max-h-48">
                  <code>{selectedObject.contentSnippet}</code>
                </pre>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Upload File to SeaweedFS Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title={`Upload Blob to '${currentBucket.name}'`}
        description="Chunked streaming write to SeaweedFS S3 distributed volume server"
        maxWidth="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUploadSubmit} disabled={Boolean(uploadingProgress)}>
              {uploadingProgress ? 'Streaming...' : 'Upload'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleUploadSubmit} className="space-y-3 font-mono text-xs">
          <div>
            <label className="text-xs font-semibold text-[#f0f6fc] block mb-1">
              File Name / S3 Key
            </label>
            <Input
              value={uploadFileName}
              onChange={(e) => setUploadFileName(e.target.value)}
              placeholder="e.g. wasm/release_bundle.wasm or metrics/run.json"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#f0f6fc] block mb-1">
              MIME Content Type
            </label>
            <select
              value={uploadContentType}
              onChange={(e) => setUploadContentType(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-xs text-[#f0f6fc]"
            >
              <option value="application/json">application/json</option>
              <option value="text/plain">text/plain</option>
              <option value="application/wasm">application/wasm</option>
              <option value="application/octet-stream">application/octet-stream</option>
            </select>
          </div>

          {/* Drag & Drop Dropzone */}
          <div className="border border-dashed border-[#30363d] rounded-lg p-6 flex flex-col items-center justify-center text-center bg-[#0d1117]">
            <UploadCloud size={24} className="text-[#388bfd] mb-2" />
            <div className="text-xs font-semibold text-[#f0f6fc]">
              Drop files here or click to browse
            </div>
            <div className="text-[11px] text-[#8b949e] mt-1">
              SeaweedFS Multi-part chunking (5MB segments) supported
            </div>
          </div>

          {/* Upload progress bar */}
          {uploadingProgress !== null && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-[#8b949e]">
                <span>Streaming chunk to volume server #2...</span>
                <span>{uploadingProgress}%</span>
              </div>
              <div className="w-full bg-[#161b22] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#388bfd] h-full transition-all duration-150"
                  style={{ width: `${uploadingProgress}%` }}
                />
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Create New Bucket Modal */}
      <Modal
        isOpen={isCreateBucketModalOpen}
        onClose={() => setIsCreateBucketModalOpen(false)}
        title="Create SeaweedFS S3 Bucket"
        description="Allocate distributed volume space with customized replication rules"
        maxWidth="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCreateBucketModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateBucketSubmit}>
              Create Bucket
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateBucketSubmit} className="space-y-3 font-mono text-xs">
          <div>
            <label className="text-xs font-semibold text-[#f0f6fc] block mb-1">
              Bucket Name
            </label>
            <Input
              value={newBucketName}
              onChange={(e) => setNewBucketName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="e.g. models-cache or build-artifacts"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#f0f6fc] block mb-1">
              Replication Policy
            </label>
            <select
              value={newBucketReplication}
              onChange={(e) => setNewBucketReplication(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-xs text-[#f0f6fc]"
            >
              <option value="000">000 - Single copy (High performance, dev)</option>
              <option value="001">001 - Replicate on different rack (Standard)</option>
              <option value="010">010 - Replicate on different data center (Production)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#f0f6fc] block mb-1">
              Description
            </label>
            <Input
              value={newBucketDescription}
              onChange={(e) => setNewBucketDescription(e.target.value)}
              placeholder="e.g. Model checkpoint tensors and weights"
            />
          </div>
        </form>
      </Modal>

      {/* New Folder Modal */}
      <Modal
        isOpen={isNewFolderModalOpen}
        onClose={() => setIsNewFolderModalOpen(false)}
        title="Create New Directory"
        description={`Add virtual prefix in bucket '${currentBucket.name}'`}
        maxWidth="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsNewFolderModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateFolderSubmit}>
              Create Folder
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateFolderSubmit} className="space-y-3 font-mono text-xs">
          <div>
            <label className="text-xs font-semibold text-[#f0f6fc] block mb-1">
              Folder Path
            </label>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. releases/v1.0"
              required
            />
          </div>
        </form>
      </Modal>

      {/* Backend Integration Code Snippets Modal */}
      <Modal
        isOpen={isBackendCodeModalOpen}
        onClose={() => setIsBackendCodeModalOpen(false)}
        title="SeaweedFS Backend Integration Code"
        description="Ready-to-use production clients for Rust, Node.js, and Go"
        maxWidth="lg"
        footer={
          <Button variant="primary" onClick={() => setIsBackendCodeModalOpen(false)}>
            Done
          </Button>
        }
      >
        <div className="space-y-4 font-mono text-xs">
          <div>
            <div className="text-[11px] text-[#58a6ff] font-semibold mb-1">Rust (aws-sdk-s3):</div>
            <pre className="p-3 rounded-lg bg-[#0d1117] border border-[#21262d] text-[10px] text-[#8b949e] overflow-x-auto">
              <code>{`let config = aws_sdk_s3::config::Builder::new()
    .endpoint_url("${telemetry.s3Url}")
    .force_path_style(true)
    .credentials_provider(Credentials::new("any_key", "any_secret", None, None, "seaweed"))
    .region(Region::new("us-east-1"))
    .build();

let client = aws_sdk_s3::Client::from_conf(config);
let resp = client.get_object().bucket("${currentBucket.name}").key("path/to/blob").send().await?;`}</code>
            </pre>
          </div>

          <div>
            <div className="text-[11px] text-[#3fb950] font-semibold mb-1">TypeScript / Node.js (@aws-sdk/client-s3):</div>
            <pre className="p-3 rounded-lg bg-[#0d1117] border border-[#21262d] text-[10px] text-[#8b949e] overflow-x-auto">
              <code>{`import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint: "${telemetry.s3Url}",
  region: "us-east-1",
  forcePathStyle: true,
  credentials: { accessKeyId: "seaweed", secretAccessKey: "seaweed" },
});`}</code>
            </pre>
          </div>
        </div>
      </Modal>
    </div>
  );
};
