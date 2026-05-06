import React, { useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Upload,
  Filter,
  AlertCircle,
  Trash2,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SelectionAction {
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
  loading?: boolean;
}

interface SelectionPanelProps {
  actions?: SelectionAction[];
  onAdd?: () => void;
  onImport?: () => void;
  onChecklist?: () => void;
  onClearSelection?: () => void;
  loading?: boolean;
}

export const SelectionPanel: React.FC<SelectionPanelProps> = ({
  actions = [],
  onAdd,
  onImport,
  onChecklist,
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

  const defaultActions: SelectionAction[] = [
    ...(onAdd ? [{ label: 'Add', icon: Plus, onClick: onAdd }] : []),
    ...(onImport ? [{ label: 'Import', icon: Upload, onClick: onImport }] : []),
    ...actions,
  ];

  return (
    <div
      className="fixed bg-white border border-gray-200 rounded-lg shadow-xl z-50"
      style={{ 
        top: "50%", 
        left: "50%", 
        transform: "translate(-50%, -50%)",
        width: "auto", 
        maxWidth: "90vw",
        maxHeight: "85vh",
        overflow: "auto"
      }}
      ref={panelRef}
    >
      <div className="flex items-center p-3 sm:p-4 gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="text-[#C72030] bg-[#C4B89D] rounded-lg w-[40px] h-[40px] sm:w-[44px] sm:h-[44px] flex items-center justify-center text-xs font-bold flex-shrink-0">
            A
          </div>
          <div className="flex flex-col justify-center px-2 sm:px-3 py-1 sm:py-2">
            <span className="text-[13px] sm:text-[16px] font-semibold text-[#1A1A1A] whitespace-nowrap leading-none">
              Actions
            </span>
            <span className="text-[10px] sm:text-[12px] font-medium text-[#6B7280] whitespace-nowrap leading-tight mt-1">
              Quick actions available
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 ml-2 sm:ml-8">
          {defaultActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={action.onClick}
                disabled={action.loading}
                className="text-gray-600 hover:bg-gray-100 flex flex-col items-center justify-center h-auto p-1 sm:p-2 disabled:opacity-50 min-w-[45px] sm:min-w-[60px]"
                style={{ width: "45px", height: "50px" }}
              >
                <Icon className="w-3 h-3 sm:w-5 sm:h-5 mb-1" />
                <span className="text-[9px] sm:text-xs font-medium text-center leading-tight">{action.label}</span>
              </Button>
            );
          })}

          <div className="w-px h-8 sm:h-12 bg-gray-300 mx-1 sm:mx-2"></div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClearSelection}
            className="text-gray-600 hover:bg-gray-100 flex items-center justify-center"
            style={{ width: "40px", height: "40px" }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
