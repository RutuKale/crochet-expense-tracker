import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Filter } from 'lucide-react';
import EmptyState from './EmptyState.jsx';

export default function DataTable({
  columns = [],
  data = [],
  searchPlaceholder = 'Search records...',
  searchKeys = [],
  initialSortKey = null,
  initialSortDirection = 'asc',
  pageSize = 10,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records matching your criteria.',
  action = null,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState(initialSortKey || (columns[0]?.key || ''));
  const [sortDirection, setSortDirection] = useState(initialSortDirection);
  const [currentPage, setCurrentPage] = useState(1);

  // Search filtering
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter(item => {
      if (searchKeys.length > 0) {
        return searchKeys.some(key => {
          const val = item[key];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(term);
        });
      }
      // Default: check all primitive object values
      return Object.values(item).some(val => 
        val !== undefined && val !== null && String(val).toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm, searchKeys]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-brand-plum-100 shadow-sm overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-brand-plum-100/75 flex flex-col sm:flex-row items-center justify-between gap-3 bg-brand-cream-50/50">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-brand-plum-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white rounded-xl border border-brand-plum-200/80 text-brand-plum-950 placeholder-brand-plum-400 focus:outline-none focus:ring-2 focus:ring-brand-plum-500/20 focus:border-brand-plum-600 transition"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-brand-plum-600 font-medium">
          <span>Showing <strong>{sortedData.length}</strong> records</span>
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        {paginatedData.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title={emptyTitle}
              description={emptyDescription}
              action={action}
            />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-brand-plum-100 bg-brand-plum-50/40 text-[11px] font-bold text-brand-plum-800 uppercase tracking-wider">
                {columns.map((col) => (
                  <th
                    key={col.key || col.header}
                    className={`py-3.5 px-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.sortable !== false ? 'cursor-pointer select-none hover:bg-brand-plum-100/60 transition' : ''}`}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                  >
                    <div className={`inline-flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                      <span>{col.header}</span>
                      {col.sortable !== false && (
                        <ArrowUpDown className={`w-3 h-3 ${sortKey === col.key ? 'text-brand-plum-900 font-bold' : 'text-brand-plum-300'}`} />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-plum-100/60 text-sm">
              {paginatedData.map((row, rowIdx) => (
                <tr 
                  key={row.id || rowIdx}
                  className="hover:bg-brand-cream-50/70 transition-colors duration-150"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key || col.header}
                      className={`py-3 px-4 text-brand-plum-950 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                    >
                      {col.render ? col.render(row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="p-3.5 border-t border-brand-plum-100/75 flex items-center justify-between text-xs text-brand-plum-700 bg-brand-cream-50/30">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-brand-plum-200 text-brand-plum-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-brand-plum-200 text-brand-plum-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
