import React, { useEffect, useRef } from "react";
import { X, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SelectionAction {
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
  loading?: boolean;
}

interface SelectionPanelProps {
  actions?: SelectionAction[];
  onAdd?: () => void;
  addLabel?: string;
  onImport?: () => void;
  onChecklist?: () => void;
  onClearSelection?: () => void;
  subtitle?: string | null;
  loading?: boolean;
  className?: string;
}

export const SelectionPanel: React.FC<SelectionPanelProps> = ({
  actions = [],
  onAdd,
  addLabel = 'Add',
  onImport,
  onChecklist,
  onClearSelection,
  subtitle,
  loading,
  className = "",
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        onClearSelection?.();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClearSelection]);

  const defaultActions: SelectionAction[] = [
    ...(onAdd ? [{ label: addLabel, icon: Plus, onClick: onAdd }] : []),
    ...(onImport ? [{ label: "Import", icon: Upload, onClick: onImport }] : []),
    ...actions,
  ];
  const panelSubtitle = subtitle ?? "";

  return (
    <div
      className={`selection-panel bg-white ${className}`}
      ref={panelRef}
    >
      <div className="flex items-stretch w-full min-h-[105px]">
        <div className="w-11 flex-shrink-0 bg-[#C4B89D] flex items-center justify-center">
          <span className="text-[#C72030] text-xs font-bold">
            {addLabel?.trim()?.[0]?.toUpperCase() || "A"}
          </span>
        </div>

        <div className="flex items-center min-w-0">
          <div className="w-[190px] px-6">
            <div className="text-[16px] font-semibold text-[#1A1A1A] leading-tight">
              Actions
            </div>
            {panelSubtitle && (
              <div className="mt-1 text-[13px] font-medium text-[#6B7280] leading-tight whitespace-nowrap">
                {panelSubtitle}
              </div>
            )}
          </div>

          <div className="flex items-center gap-8 px-4">
            {defaultActions.map((action, index) => {
              const Icon = action.label.toLowerCase().includes("qr")
                ? Plus
                : action.icon;
              return (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={action.onClick}
                  disabled={action.loading}
                  className="w-[74px] h-[76px] p-0 text-gray-700 hover:bg-gray-50 flex flex-col items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Icon className="w-5 h-5 text-black" />
                  <span className="text-[13px] font-semibold text-[#4B5563] text-center leading-tight">
                    {action.label}
                  </span>
                </Button>
              );
            })}
          </div>

          <div className="w-px h-12 bg-gray-300 mx-3" />

          <Button
            variant="ghost"
            size="icon"
            onClick={onClearSelection}
            className="w-12 h-12 mr-5 text-black hover:bg-gray-50 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
