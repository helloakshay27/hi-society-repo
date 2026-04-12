import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  QrCode,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Staff {
  id: string;
  name: string;
}

interface StaffSelectionPanelProps {
  selectedCount: number;
  selectedStaffs: Staff[];
  selectedStaffIds: string[];
  isAllSelected: boolean;
  totalStaffCount: number;
  isLoading?: boolean;
  onPrintQRCode: () => void;
  onPrintAllQRCodes: () => void;
  onClearSelection: () => void;
}

export const StaffSelectionPanel: React.FC<StaffSelectionPanelProps> = ({
  selectedCount,
  selectedStaffs,
  selectedStaffIds,
  isAllSelected,
  totalStaffCount,
  isLoading = false,
  onPrintQRCode,
  onPrintAllQRCodes,
  onClearSelection,
}) => {
  const [showAll, setShowAll] = useState(false);

  const handleClearClick = () => {
    console.warn('🔄 Clear selection clicked');
    onClearSelection();
  };

  const getDisplayText = () => {
    if (selectedStaffs.length === 0) return "";
    if (selectedStaffs.length === 1) return selectedStaffs[0].name;
    if (showAll) {
      return selectedStaffs.map((staff) => staff.name).join(", ");
    }
    if (selectedStaffs.length <= 6) {
      return selectedStaffs.map((staff) => staff.name).join(", ");
    }
    return (
      <>
        {selectedStaffs
          .slice(0, 6)
          .map((staff) => staff.name)
          .join(", ")}{" "}
        and{" "}
        <button
          onClick={() => setShowAll(true)}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {selectedStaffs.length - 6} more
        </button>
      </>
    );
  };

  const safeGetDisplayText = () => {
    if (selectedCount > 0 && selectedStaffs.length === 0) {
      return `${selectedCount} staff member(s) selected`;
    }
    return getDisplayText();
  };

  return (
    <div
      className="fixed bg-white border border-gray-200 rounded-sm shadow-lg z-50"
      style={{ top: "50%", left: "50%", transform: "translateX(-50%)", width: "auto" }}
    >
      <div className="flex items-center w-full h-full pr-4">
        <div className="flex items-center gap-2">
          <div className="text-[#C72030] bg-[#C4B89D] rounded-lg w-[44px] h-[70px] flex items-center justify-center text-xs font-bold flex-shrink-0">
            {selectedCount}
          </div>
          <div className="flex flex-col justify-center px-3 py-2">
            <span className="text-[16px] font-semibold text-[#1A1A1A] whitespace-nowrap leading-none">
              Selection
            </span>
            <span className="text-[12px] font-medium text-[#6B7280] break-words leading-tight mt-0.5">
              {safeGetDisplayText()}
            </span>
          </div>
        </div>

        <div className="w-px h-8 bg-gray-300 mx-3 flex-shrink-0"></div>

        <div className="flex items-center gap-2">
          {!isAllSelected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.warn('📤 Print QR Codes clicked for', selectedStaffIds.length, 'staff');
                onPrintQRCode();
              }}
              disabled={isLoading}
              className="text-gray-600 hover:bg-gray-100 flex items-center gap-2 h-auto px-3 py-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <QrCode className="w-5 h-5" />
              )}
              <span className="text-xs font-medium whitespace-nowrap">Print QR Codes</span>
            </Button>
          )}

          {isAllSelected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.warn('📤 Print All QR clicked, total:', totalStaffCount);
                onPrintAllQRCodes();
              }}
              disabled={isLoading}
              className="text-gray-600 hover:bg-gray-100 flex items-center gap-2 h-auto px-3 py-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <QrCode className="w-5 h-5" />
              )}
              <span className="text-xs font-medium whitespace-nowrap">Print All QR</span>
            </Button>
          )}

          <div className="w-px h-8 bg-gray-300 flex-shrink-0"></div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearClick}
            className="text-gray-600 hover:bg-gray-100 flex-shrink-0"
            style={{ width: "36px", height: "36px" }}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
