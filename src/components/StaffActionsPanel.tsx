import React, { useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StaffActionsPanelProps {
  onAdd?: () => void;
  onImport?: () => void;
  onClearSelection?: () => void;
  loading?: boolean;
}

export const StaffActionsPanel: React.FC<StaffActionsPanelProps> = ({
  onAdd,
  onImport,
  onClearSelection,
  loading
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClearSelection?.();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClearSelection]);

  return (
    <div
      className="fixed bg-white border border-gray-200 rounded-sm shadow-lg z-50"
      style={{ top: "50%", left: "30%", width: "max-content", height: "105px" }}
      ref={panelRef}
    >
      <div className="flex items-center h-full pr-6" style={{ width: "max-content" }}>
        <div className="flex items-center gap-3">
          <div className="text-[#C72030] bg-[#C4B89D] rounded-lg w-[44px] h-[105px] flex items-center justify-center text-xs font-bold">
            S
          </div>
          <div className="flex flex-col justify-center px-3 py-2 min-w-[140px]">
            <span className="text-[16px] font-semibold text-[#1A1A1A] whitespace-nowrap leading-none">
              Actions
            </span>
            <span className="text-[12px] font-medium text-[#6B7280] whitespace-nowrap leading-tight mt-1">
              Quick actions available
            </span>
          </div>
        </div>

        <div className="flex items-center ml-8 gap-4">
          {onAdd && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAdd}
              disabled={loading}
              className="text-gray-600 hover:bg-gray-100 flex flex-col items-center justify-center h-auto p-2 disabled:opacity-50 min-w-[60px]"
              style={{ width: "60px", height: "70px" }}
            >
              <Plus className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium text-center leading-tight">Add Staff</span>
            </Button>
          )}

          {onImport && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onImport}
              disabled={loading}
              className="text-gray-600 hover:bg-gray-100 flex flex-col items-center justify-center h-auto p-2 disabled:opacity-50 min-w-[60px]"
              style={{ width: "60px", height: "70px" }}
            >
              <Upload className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium text-center leading-tight">Import</span>
            </Button>
          )}

          <div className="w-px h-12 bg-gray-300 mx-2"></div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClearSelection}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
