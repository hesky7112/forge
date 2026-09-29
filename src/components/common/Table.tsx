import React from 'react';
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  selectedIds?: Set<string>;
  onSelectRow?: (id: string) => void;
  onSelectAll?: () => void;
  onRowClick?: (row: T) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  emptyMessage?: string;
  loading?: boolean;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  selectedIds,
  onSelectRow,
  onSelectAll,
  onRowClick,
  sortField,
  sortDirection,
  onSort,
  emptyMessage = 'No records found',
  loading = false,
}: TableProps<T>) {
  const allSelected = data.length > 0 && selectedIds && selectedIds.size === data.length;

  return (
    <div className="w-full overflow-hidden border border-[#21262d] rounded-lg bg-[#0d1117]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#f0f6fc] border-collapse">
          <thead className="bg-[#161b22] text-[#8b949e] border-b border-[#21262d] uppercase text-[11px] font-mono tracking-wider">
            <tr>
              {onSelectRow && (
                <th className="w-8 px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onSelectAll}
                    className="rounded border-[#30363d] bg-[#0d1117] text-[#388bfd] focus:ring-0 cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => {
                const isSorted = sortField === col.key;
                return (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    onClick={() => col.sortable && onSort?.(col.key)}
                    className={`px-3 py-2.5 font-medium select-none ${
                      col.sortable ? 'cursor-pointer hover:text-[#f0f6fc]' : ''
                    } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === 'right' ? 'justify-end w-full' : ''
                      }`}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-[#484f58]">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp size={12} className="text-[#388bfd]" />
                            ) : (
                              <ChevronDown size={12} className="text-[#388bfd]" />
                            )
                          ) : (
                            <ArrowUpDown size={11} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#21262d]">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (onSelectRow ? 1 : 0)} className="py-12 text-center text-[#8b949e]">
                  <div className="inline-block w-4 h-4 border-2 border-[#388bfd] border-t-transparent rounded-full animate-spin mr-2" />
                  Streaming table records...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onSelectRow ? 1 : 0)} className="py-12 text-center text-[#484f58]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const id = String(row[keyField]);
                const isSelected = selectedIds?.has(id);
                return (
                  <tr
                    key={id}
                    onClick={() => onRowClick?.(row)}
                    className={`group transition-colors h-10 ${
                      isSelected ? 'bg-[#388bfd]/10' : 'hover:bg-[#161b22]/70'
                    } ${onRowClick ? 'cursor-pointer' : ''}`}
                  >
                    {onSelectRow && (
                      <td
                        className="w-8 px-3 py-2 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRow(id);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-[#30363d] bg-[#0d1117] text-[#388bfd] focus:ring-0 cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-3 py-2 font-mono whitespace-nowrap truncate ${
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                        }`}
                      >
                        {col.render ? col.render(row) : String(row[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
