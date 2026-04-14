import { UnifiedTable, type Column } from './UnifiedTable';
import type { ReactNode } from 'react';

interface RecentTableProps<T> {
  title: string;
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string | number;
  onViewAll?: () => void;
  viewAllText?: string;
  emptyStateMessage?: string;
}

export function RecentTable<T>({ 
  title, 
  data, 
  columns, 
  keyExtractor, 
  onViewAll,
  viewAllText = "View All",
  emptyStateMessage: _emptyStateMessage = "No recent records found."
}: RecentTableProps<T>): ReactNode {
  // Ensure we only display up to 5 items in recent tables
  const recentData = data.slice(0, 5);

  return (
    <section className="bg-white border border-[#d8dee8] rounded-[2px] overflow-hidden flex flex-col w-full">
      <div className="px-4 py-3 flex items-center justify-between border-b border-[#e2e8f0] bg-white">
        <h3 className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#0f172a]">{title}</h3>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="text-[10px] font-bold uppercase tracking-widest text-[#0b5384] hover:underline transition-colors outline-none"
          >
            {viewAllText}
          </button>
        )}
      </div>
      <div className="bg-white">
        <UnifiedTable
          data={recentData}
          columns={columns}
          keyExtractor={keyExtractor}
          hideControlBar={true}
          hidePagination={true}
          variant="embedded"
        />
      </div>
    </section>
  );
}