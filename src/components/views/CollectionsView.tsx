import React, { useState, useMemo } from 'react';
import {
  Database,
  Plus,
  Search,
  Filter,
  Code,
  Download,
  Trash2,
  Edit2,
  FileJson,
  Check,
  Table as TableIcon,
  Layers,
} from 'lucide-react';
import { CollectionSchema } from '../../types';
import { Table, Column } from '../common/Table';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Drawer } from '../common/Drawer';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { useToast } from '../common/Toast';

interface CollectionsViewProps {
  schemas: CollectionSchema[];
  initialData: Record<string, any[]>;
}

export const CollectionsView: React.FC<CollectionsViewProps> = ({ schemas, initialData }) => {
  const { addToast } = useToast();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(schemas[0].id);
  const [activeTab, setActiveTab] = useState<'records' | 'schema' | 'api'>('records');
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isNewRecordModalOpen, setIsNewRecordModalOpen] = useState(false);
  const [newRecordData, setNewRecordData] = useState<Record<string, any>>({});
  const [allData, setAllData] = useState<Record<string, any[]>>(initialData);
  const [sortField, setSortField] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const currentSchema = schemas.find((s) => s.id === selectedCollectionId) || schemas[0];
  const currentRecords = allData[currentSchema.name] || [];

  // Filter and sort records
  const processedRecords = useMemo(() => {
    let result = [...currentRecords];

    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((val) =>
          String(val).toLowerCase().includes(q)
        )
      );
    }

    if (sortField) {
      result.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA === valB) return 0;
        if (valA === undefined) return 1;
        if (valB === undefined) return -1;
        const res = valA > valB ? 1 : -1;
        return sortDirection === 'asc' ? res : -res;
      });
    }

    return result;
  }, [currentRecords, filterQuery, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `rec_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();
    const record = {
      id,
      created: now,
      updated: now,
      ...newRecordData,
    };

    setAllData((prev) => ({
      ...prev,
      [currentSchema.name]: [record, ...(prev[currentSchema.name] || [])],
    }));

    setIsNewRecordModalOpen(false);
    setNewRecordData({});
    addToast({
      type: 'success',
      title: 'Record Created',
      description: `Added record ${id} to ${currentSchema.name}`,
    });
  };

  const handleDeleteRecord = (recordId: string) => {
    setAllData((prev) => ({
      ...prev,
      [currentSchema.name]: prev[currentSchema.name].filter((r) => r.id !== recordId),
    }));
    setSelectedRecord(null);
    addToast({
      type: 'info',
      title: 'Record Removed',
      description: `Deleted ${recordId} from ${currentSchema.name}`,
    });
  };

  const handleExportJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(currentRecords, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${currentSchema.name}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast({
      type: 'success',
      title: 'JSON Exported',
      description: `Exported ${currentRecords.length} records`,
    });
  };

  // Generate dynamic table columns from schema
  const tableColumns: Column<any>[] = useMemo(() => {
    const cols: Column<any>[] = [
      {
        key: 'id',
        header: 'ID',
        sortable: true,
        width: '120px',
        render: (row) => (
          <span className="font-mono text-[#58a6ff] hover:underline cursor-pointer">
            {row.id}
          </span>
        ),
      },
    ];

    currentSchema.fields
      .filter((f) => f.name !== 'id')
      .forEach((field) => {
        cols.push({
          key: field.name,
          header: field.name,
          sortable: true,
          render: (row) => {
            const val = row[field.name];
            if (typeof val === 'boolean') {
              return (
                <span className={val ? 'text-[#3fb950]' : 'text-[#8b949e]'}>
                  {val ? 'true' : 'false'}
                </span>
              );
            }
            if (typeof val === 'object' && val !== null) {
              return (
                <span className="text-[#8b949e] font-mono text-[10px]">
                  {JSON.stringify(val).slice(0, 30)}...
                </span>
              );
            }
            if (field.name === 'status') {
              return (
                <Badge
                  variant={
                    val === 'active' || val === 'ready' || val === 'online' || val === 'success'
                      ? 'success'
                      : val === 'conflicted'
                      ? 'warning'
                      : 'default'
                  }
                  subtleBox
                >
                  {String(val)}
                </Badge>
              );
            }
            return String(val ?? '');
          },
        });
      });

    return cols;
  }, [currentSchema]);

  return (
    <div className="flex-1 flex h-full min-h-0 overflow-hidden bg-[#07090e]">
      {/* PocketBase Collections Sidebar */}
      <div className="w-64 border-r border-[#21262d] bg-[#0d1117] flex flex-col shrink-0">
        <div className="p-3 border-b border-[#21262d] flex items-center justify-between bg-[#161b22]/40">
          <div className="flex items-center gap-2">
            <Database size={15} className="text-[#388bfd]" />
            <span className="font-semibold text-xs text-[#f0f6fc]">Collections</span>
          </div>
          <span className="text-[10px] font-mono text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded">
            {schemas.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {schemas.map((schema) => {
            const isSelected = schema.id === selectedCollectionId;
            const recordsCount = allData[schema.name]?.length ?? schema.recordsCount;

            return (
              <button
                key={schema.id}
                onClick={() => setSelectedCollectionId(schema.id)}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between font-mono text-xs transition-colors ${
                  isSelected
                    ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d]'
                    : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <TableIcon size={13} className={isSelected ? 'text-[#388bfd]' : 'text-[#484f58]'} />
                  <span className="truncate">{schema.name}</span>
                </div>
                <span className="text-[10px] font-mono text-[#8b949e]">{recordsCount}</span>
              </button>
            );
          })}
        </div>

        {/* Database Stats footer */}
        <div className="p-3 border-t border-[#21262d] bg-[#161b22]/30 text-[11px] text-[#8b949e] font-mono space-y-1">
          <div className="flex justify-between">
            <span>Engine:</span>
            <span className="text-[#3fb950]">SpacetimeDB + SQLite</span>
          </div>
          <div className="flex justify-between">
            <span>Storage:</span>
            <span className="text-[#58a6ff]">SeaweedFS S3</span>
          </div>
        </div>
      </div>

      {/* Main Content Area: PocketBase Table & Schema Explorer */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#07090e]">
        {/* Collection Action Bar */}
        <div className="px-4 py-2.5 border-b border-[#21262d] bg-[#0d1117] flex items-center justify-between gap-4 shrink-0 text-xs">
          {/* Collection Name & Tabs */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[#f0f6fc] font-mono">
                {currentSchema.name}
              </span>
            </div>

            <div className="flex items-center gap-1 bg-[#161b22] border border-[#30363d] p-0.5 rounded-md">
              <button
                onClick={() => setActiveTab('records')}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  activeTab === 'records'
                    ? 'bg-[#21262d] text-[#f0f6fc]'
                    : 'text-[#8b949e] hover:text-[#f0f6fc]'
                }`}
              >
                Records ({processedRecords.length})
              </button>
              <button
                onClick={() => setActiveTab('schema')}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  activeTab === 'schema'
                    ? 'bg-[#21262d] text-[#f0f6fc]'
                    : 'text-[#8b949e] hover:text-[#f0f6fc]'
                }`}
              >
                Schema & Fields
              </button>
              <button
                onClick={() => setActiveTab('api')}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  activeTab === 'api'
                    ? 'bg-[#21262d] text-[#f0f6fc]'
                    : 'text-[#8b949e] hover:text-[#f0f6fc]'
                }`}
              >
                API Preview
              </button>
            </div>
          </div>

          {/* Action Buttons: New Record, Search, Export */}
          <div className="flex items-center gap-2">
            {activeTab === 'records' && (
              <>
                <div className="w-56">
                  <Input
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder='Filter records (e.g. "auth")...'
                    icon={<Search size={12} />}
                    onClear={() => setFilterQuery('')}
                  />
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Download size={13} />}
                  onClick={handleExportJson}
                >
                  Export JSON
                </Button>

                <Button
                  size="sm"
                  variant="primary"
                  icon={<Plus size={13} />}
                  onClick={() => {
                    const initial: Record<string, any> = {};
                    currentSchema.fields.forEach((f) => {
                      if (f.name !== 'id') initial[f.name] = '';
                    });
                    setNewRecordData(initial);
                    setIsNewRecordModalOpen(true);
                  }}
                >
                  New Record
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tab Viewport */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'records' && (
            <Table
              columns={tableColumns}
              data={processedRecords}
              keyField="id"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              onRowClick={(row) => setSelectedRecord(row)}
              emptyMessage={`No records found in collection '${currentSchema.name}'`}
            />
          )}

          {activeTab === 'schema' && (
            <div className="max-w-3xl space-y-4">
              <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d] space-y-3">
                <div className="font-semibold text-xs text-[#f0f6fc]">Schema Definition</div>
                <div className="divide-y divide-[#21262d]">
                  {currentSchema.fields.map((field) => (
                    <div
                      key={field.name}
                      className="py-2.5 flex items-center justify-between font-mono text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[#58a6ff] font-semibold">{field.name}</span>
                        {field.required && (
                          <span className="text-[10px] text-[#f85149] bg-[#da3633]/15 px-1 py-0.2 rounded">
                            REQUIRED
                          </span>
                        )}
                      </div>
                      <span className="text-[#8b949e]">{field.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="max-w-3xl space-y-4 font-mono text-xs">
              <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d] space-y-2">
                <div className="text-[#8b949e]"># Subscribe to Real-time Changes (SpacetimeDB / WebSocket)</div>
                <pre className="p-3 rounded bg-[#07090e] text-[#58a6ff] overflow-x-auto">
{`import { forge } from '@forge/client';

// Real-time subscription to table updates
forge.collection('${currentSchema.name}').subscribe('*', (e) => {
  console.log('Action:', e.action); // 'create', 'update', 'delete'
  console.log('Record:', e.record);
});`}
                </pre>
              </div>

              <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d] space-y-2">
                <div className="text-[#8b949e]"># Query Filtered List</div>
                <pre className="p-3 rounded bg-[#07090e] text-[#3fb950] overflow-x-auto">
{`const records = await forge.collection('${currentSchema.name}').getList(1, 20, {
  filter: 'status = "active"',
  sort: '-created',
});`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Record Inspection & Editing Drawer (PocketBase style) */}
      <Drawer
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title={`Record: ${selectedRecord?.id || ''}`}
        subtitle={`Collection: ${currentSchema.name}`}
        width="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="danger"
              size="xs"
              icon={<Trash2 size={12} />}
              onClick={() => handleDeleteRecord(selectedRecord.id)}
            >
              Delete Record
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" size="xs" onClick={() => setSelectedRecord(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="xs"
                onClick={() => {
                  addToast({
                    type: 'success',
                    title: 'Record Saved',
                    description: `Updated record ${selectedRecord.id}`,
                  });
                  setSelectedRecord(null);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        }
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="space-y-3 font-mono text-xs">
              {Object.entries(selectedRecord).map(([key, val]) => (
                <div key={key} className="space-y-1">
                  <label className="text-[11px] text-[#8b949e] uppercase">{key}</label>
                  {typeof val === 'object' && val !== null ? (
                    <textarea
                      readOnly
                      value={JSON.stringify(val, null, 2)}
                      rows={4}
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-[#58a6ff] focus:outline-none"
                    />
                  ) : (
                    <input
                      value={String(val ?? '')}
                      onChange={(e) =>
                        setSelectedRecord({ ...selectedRecord, [key]: e.target.value })
                      }
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2.5 py-1.5 text-[#f0f6fc] focus:outline-none focus:border-[#388bfd]"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>

      {/* New Record Modal */}
      <Modal
        isOpen={isNewRecordModalOpen}
        onClose={() => setIsNewRecordModalOpen(false)}
        title={`New Record in ${currentSchema.name}`}
        description="Fill in the schema attributes to create a persistent record"
        maxWidth="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsNewRecordModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateRecord}>
              Create Record
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateRecord} className="space-y-3">
          {currentSchema.fields
            .filter((f) => f.name !== 'id')
            .map((field) => (
              <div key={field.name}>
                <label className="text-xs font-semibold text-[#f0f6fc] block mb-1">
                  {field.name}{' '}
                  {field.required && <span className="text-[#f85149]">*</span>}
                </label>
                <Input
                  value={newRecordData[field.name] || ''}
                  onChange={(e) =>
                    setNewRecordData({ ...newRecordData, [field.name]: e.target.value })
                  }
                  placeholder={`Enter ${field.type} value`}
                  required={field.required}
                />
              </div>
            ))}
        </form>
      </Modal>
    </div>
  );
};
