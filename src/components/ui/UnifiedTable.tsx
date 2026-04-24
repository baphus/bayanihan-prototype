import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  title: string;
  className?: string; // e.g. w-32 or text-right
  render?: (row: T) => ReactNode;
}

export interface FilterChip {
  key: string;
  label: string;
  value: string;
}

export interface UnifiedTableProps<T> {
  // --- Data and Columns ---
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string | number;

  title?: string;
  description?: string;

  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;

  onAdvancedFilters?: () => void;
  isAdvancedFiltersOpen?: boolean;
  advancedFiltersContent?: ReactNode;
  onColumnsControl?: () => void;
  onNewRecord?: () => void;
  newRecordLabel?: string;

  viewMode?: "list" | "grid";
  onViewModeChange?: (mode: "list" | "grid") => void;

  activeFilters?: FilterChip[];
  onRemoveFilter?: (filter: FilterChip) => void;
  onClearFilters?: () => void;

  currentPage?: number;
  totalPages?: number;
  totalRecords?: number;
  startIndex?: number;
  endIndex?: number;
  rowsPerPage?: number;
  rowsPerPageOptions?: number[];
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rows: number) => void;
  
  hideControlBar?: boolean;
  hidePagination?: boolean;
  variant?: "default" | "embedded";
}

export function UnifiedTable<T>({
  data,
  columns,
  keyExtractor,

  title,
  description,

  searchPlaceholder = "Search records...",
  searchValue = "",
  onSearchChange,

  onAdvancedFilters,
  isAdvancedFiltersOpen = false,
  advancedFiltersContent,
  onColumnsControl,
  onNewRecord,
  newRecordLabel = "+ New Record",

  viewMode = "list",
  onViewModeChange,

  activeFilters = [],
  onRemoveFilter,
  onClearFilters,

  currentPage = 1,
  totalPages = 1,
  totalRecords = 0,
  startIndex = 1,
  endIndex = 10,
  rowsPerPage = 10,
  rowsPerPageOptions = [10, 25, 50],
  onPageChange,
  onRowsPerPageChange,

  hideControlBar = false,
  hidePagination = false,
  variant = "default"
}: UnifiedTableProps<T>) {

  return (
    <div className="space-y-8 w-full">
      {(title || description) && (
        <div className="space-y-2">
          {title && <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>}
          {description && <p className="text-slate-500 max-w-2xl">{description}</p>}
        </div>
      )}

      <div className={variant === "embedded" ? "bg-white overflow-hidden w-full" : "bg-white border border-[#cbd5e1] overflow-hidden w-full rounded-md shadow-sm"}>
        
        {!hideControlBar && (
        <div className="p-4 bg-[#f8fafc] flex flex-col lg:flex-row items-center justify-between gap-4 border-b border-[#cbd5e1] min-h-[72px]">
          <div className="relative flex-1 w-full max-w-md h-[40px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full h-full pl-10 pr-4 bg-white border border-[#cbd5e1] rounded-[2px] text-[14px] text-slate-600 placeholder-slate-400 outline-none focus:ring-1 focus:ring-[#0b5384] transition"
            />
          </div>
          
          <div className="flex w-full flex-wrap items-center gap-3 pb-2 lg:w-auto lg:flex-nowrap lg:pb-0">
            {onAdvancedFilters && (
              <div className="relative shrink-0">
                <button 
                  onClick={onAdvancedFilters}
                  className="h-[40px] px-4 border border-[#cbd5e1] text-[14px] font-bold text-slate-600 rounded-[2px] bg-white flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors whitespace-nowrap relative"
                >
                  <span className="material-symbols-outlined text-[18px]">tune</span> Filters
                </button>

                {isAdvancedFiltersOpen && advancedFiltersContent ? (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 rounded-[3px] border border-[#cbd5e1] bg-white p-5 shadow-lg">
                    {advancedFiltersContent}
                  </div>
                ) : null}
              </div>
            )}
            
            {onColumnsControl && (
              <button 
                onClick={onColumnsControl}
                className="h-[40px] px-4 border border-[#cbd5e1] text-[14px] font-bold text-slate-600 rounded-[2px] bg-white flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[18px]">view_column</span> Columns
              </button>
            )}
            
            {onViewModeChange && (
              <div className="flex items-center bg-[#f1f5f9] rounded-[2px] p-1 border border-[#cbd5e1] h-[40px] shrink-0">
                <button 
                  onClick={() => onViewModeChange('list')}
                  className={`h-full w-8 flex items-center justify-center rounded-[2px] ${viewMode === 'list' ? 'bg-white shadow-sm border border-[#cbd5e1] text-[#0b5384]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <span className="material-symbols-outlined text-[18px]">list</span>
                </button>
                <button 
                  onClick={() => onViewModeChange('grid')}
                  className={`h-full w-8 flex items-center justify-center rounded-[2px] ${viewMode === 'grid' ? 'bg-white shadow-sm border border-[#cbd5e1] text-[#0b5384]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <span className="material-symbols-outlined text-[18px]">grid_view</span>
                </button>
              </div>
            )}
            
            {onNewRecord && (
              <button 
                onClick={onNewRecord}
                className="h-[40px] px-5 bg-[#0b5384] text-white text-[14px] font-bold rounded-[3px] flex items-center gap-2 hover:bg-[#09416a] transition-colors ml-2 shadow-sm whitespace-nowrap shrink-0"
              >
                <span className="font-semibold text-[16px]">+</span> {newRecordLabel.replace('+ ', '')}
              </button>
            )}
          </div>
        </div>
        )}

        {activeFilters && activeFilters.length > 0 && (
          <div className="px-5 py-[14px] flex items-center flex-wrap gap-4 border-b border-[#cbd5e1] bg-white text-[12px]">
            <span className="font-bold uppercase tracking-widest text-[#94a3b8]">Active Filters:</span>
            {activeFilters.map((filter, index) => (
              <div 
                key={`${filter.key}-${index}`} 
                className="flex items-center gap-1.5 bg-[#f0f7fc] text-[#0b5384] px-3 py-1 rounded-[2px] font-bold border border-[#d2e5f3]"
              >
                {filter.label}: {filter.value}
                <button 
                  onClick={() => onRemoveFilter?.(filter)}
                  className="flex items-center justify-center hover:opacity-75 transition-opacity"
                >
                  <span className="material-symbols-outlined text-[15px]">close</span>
                </button>
              </div>
            ))}
            {onClearFilters && (
              <button 
                onClick={onClearFilters}
                className="font-bold text-[#0b5384] hover:underline text-[13px]"
              >
                Clear All
              </button>
            )}
          </div>
        )}

        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-[#cbd5e1]">
                  {columns.map((col) => (
                    <th 
                      key={col.key} 
                      className={`px-5 py-4 text-[12px] font-extrabold uppercase tracking-widest text-[#64748b] whitespace-nowrap ${col.className || ''}`}
                    >
                      {col.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cbd5e1] bg-white">
                {data.map((row) => (
                  <tr key={keyExtractor(row)} className="hover:bg-slate-50 transition-colors group">
                    {columns.map((col) => (
                      <td key={`${keyExtractor(row)}-${col.key}`} className={`px-5 py-4 ${col.className || ''}`}>
                        {col.render ? col.render(row) : (row as unknown as Record<string, ReactNode>)[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length === 0 && (
               <div className="flex flex-col items-center justify-center p-12 text-center">
                 <span className="material-symbols-outlined mb-3 text-4xl text-slate-300">inbox</span>
                 <p className="text-[14px] font-bold text-slate-700">No records found</p>
                 <p className="mt-1 max-w-sm text-xs text-slate-500">We couldn't find any records matching your current criteria. Try adjusting your filters or search term.</p>
               </div>
            )}
          </div>
        ) : (
          <div className="p-5 bg-slate-50 border-t border-[#cbd5e1]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.map((row) => (
                <div key={keyExtractor(row)} className="border border-[#cbd5e1] rounded-[4px] p-5 bg-white shadow-sm flex flex-col gap-4 hover:shadow-md transition">
                  {columns.map((col) => (
                    <div 
                      key={col.key} 
                      className={
                        col.title === 'ACTIONS' 
                          ? "mt-auto pt-4 border-t border-slate-100 flex items-center justify-end" 
                          : "flex flex-col gap-1.5"
                      }
                    >
                      {col.title !== 'ACTIONS' && (
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{col.title}</span>
                      )}
                      <div>
                        {col.render ? col.render(row) : (row as unknown as Record<string, ReactNode>)[col.key]}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {data.length === 0 && (
               <div className="flex flex-col items-center justify-center p-12 text-center">
                 <span className="material-symbols-outlined mb-3 text-4xl text-slate-300">inbox</span>
                 <p className="text-[14px] font-bold text-slate-700">No records found</p>
                 <p className="mt-1 max-w-sm text-xs text-slate-500">We couldn't find any records matching your current criteria. Try adjusting your filters or search term.</p>
               </div>
            )}
          </div>
        )}

        {!hidePagination && (
        <div className="px-6 py-4 bg-[#f8fafc] flex flex-col md:flex-row items-center justify-between gap-4 border-t border-[#cbd5e1]">
          <div className="text-[13px] text-slate-500 text-left">
            Showing <span className="font-bold text-slate-700">{startIndex}–{endIndex}</span> of <span className="font-bold text-slate-700">{totalRecords.toLocaleString()}</span> records
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Rows per page:</label>
              <select 
                value={rowsPerPage} 
                onChange={(e) => onRowsPerPageChange?.(Number(e.target.value))}
                className="bg-white border border-[#cbd5e1] text-[13px] font-bold text-slate-700 rounded-[2px] px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#0b5384]"
              >
                {rowsPerPageOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-1.5 text-[#cbd5e1]">
              <button 
                onClick={() => onPageChange?.(1)}
                className="w-7 h-7 flex items-center justify-center rounded-sm text-slate-300 hover:text-slate-700 transition"
              >
                <span className="material-symbols-outlined text-[20px] font-bold">first_page</span>
              </button>
              <button 
                onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
                className="w-7 h-7 flex items-center justify-center rounded-sm text-slate-300 hover:text-slate-700 transition"
              >
                <span className="material-symbols-outlined text-[20px] font-bold">chevron_left</span>
              </button>
              
              <div className="flex items-center gap-1 px-3">
                <button className="w-[30px] h-[30px] flex items-center justify-center rounded-[2px] bg-[#0b5384] text-white text-[13px] font-bold shadow-sm">
                  {currentPage}
                </button>
                <button className="w-[30px] h-[30px] flex items-center justify-center rounded-[2px] hover:bg-[#f1f5f9] text-slate-700 text-[13px] font-bold transition">
                  {currentPage + 1}
                </button>
                <button className="w-[30px] h-[30px] flex items-center justify-center rounded-[2px] hover:bg-[#f1f5f9] text-slate-700 text-[13px] font-bold transition">
                  {currentPage + 2}
                </button>
                <span className="w-[30px] h-[30px] flex items-center justify-center text-slate-400 text-[13px] font-bold">
                  ...
                </span>
                <button className="w-[30px] h-[30px] flex items-center justify-center rounded-[2px] hover:bg-[#f1f5f9] text-slate-700 text-[13px] font-bold transition">
                  {totalPages}
                </button>
              </div>
              
              <button 
                onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
                className="w-7 h-7 flex items-center justify-center rounded-sm text-slate-700 hover:text-slate-900 transition"
              >
                <span className="material-symbols-outlined text-[20px] font-bold">chevron_right</span>
              </button>
              <button 
                onClick={() => onPageChange?.(totalPages)}
                className="w-7 h-7 flex items-center justify-center rounded-sm text-slate-700 hover:text-slate-900 transition"
              >
                <span className="material-symbols-outlined text-[20px] font-bold">last_page</span>
              </button>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
