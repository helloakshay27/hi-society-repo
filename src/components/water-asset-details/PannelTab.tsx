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
  addLabel = "Add",
  onImport,
  onClearSelection,
  subtitle,
  className = "",
}) => {
  const desktopPanelRef = useRef<HTMLDivElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickedOutside = 
        (desktopPanelRef.current && !desktopPanelRef.current.contains(target)) &&
        (mobilePanelRef.current && !mobilePanelRef.current.contains(target));
      
      if (isClickedOutside) {
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
    <>
      {/* ══════════════════════════════════════════
          DESKTOP layout  (hidden on mobile)
          Fixed bottom bar, centered in content area
      ══════════════════════════════════════════ */}
      <div
        ref={desktopPanelRef}
        className={`selection-panel hidden sm:flex ${className}`}
      >
        {/* Colored initial strip */}
        <div className="w-11 flex-shrink-0 bg-[#C4B89D] flex items-center justify-center self-stretch">
          <span className="text-[#C72030] text-xs font-bold">
            {addLabel?.trim()?.[0]?.toUpperCase() || "A"}
          </span>
        </div>

        {/* Content row */}
        <div className="flex items-center min-w-0">
          {/* Label */}
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

          {/* Action buttons */}
          <div className="flex items-center gap-8 px-4">
            {defaultActions.map((action, index) => {
              const Icon = action.label.toLowerCase().includes("qr") ? Plus : action.icon;
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

          {/* Divider */}
          <div className="w-px h-12 bg-gray-300 mx-3" />

          {/* Close */}
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

      {/* ══════════════════════════════════════════
          MOBILE layout  (hidden on desktop)
          Fixed bottom sheet, full width
      ══════════════════════════════════════════ */}
      <div
        ref={mobilePanelRef}
        className={`sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white
          border-t-2 border-[#C4B89D]
          rounded-t-2xl
          shadow-[0_-4px_24px_rgba(0,0,0,0.15)]
          pb-safe ${className}`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* Header row: label + close button */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div>
            <div className="text-[15px] font-semibold text-[#1A1A1A]">
              Actions
            </div>
            {panelSubtitle && (
              <div className="text-[12px] font-medium text-[#6B7280] mt-0.5">
                {panelSubtitle}
              </div>
            )}
          </div>
          <button
            onClick={onClearSelection}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Buttons row */}
        <div className="flex items-center gap-2 px-4 pb-4 overflow-x-auto no-scrollbar">
          {defaultActions.map((action, index) => {
            const Icon = action.label.toLowerCase().includes("qr") ? Plus : action.icon;
            return (
              <button
                key={index}
                onClick={action.onClick}
                disabled={action.loading}
                className="flex flex-col items-center justify-center gap-1.5
                  min-w-[72px] h-[72px] px-2
                  rounded-xl bg-gray-50 hover:bg-[#f6f4ee]
                  border border-gray-200
                  disabled:opacity-50 flex-shrink-0"
              >
                <Icon className="w-5 h-5 text-[#1A1A1A]" />
                <span className="text-[11px] font-semibold text-[#4B5563] text-center leading-tight">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
