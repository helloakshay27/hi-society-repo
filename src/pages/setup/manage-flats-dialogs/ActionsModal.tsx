import React from "react";
import { Plus, Upload, X } from "lucide-react";

interface ActionsModalProps {
  show: boolean;
  onClose: () => void;
  onAdd: () => void;
  onImport: () => void;
}

export const ActionsModal: React.FC<ActionsModalProps> = ({
  show,
  onClose,
  onAdd,
  onImport,
}) => {
  if (!show) return null;

  return (
    <div className="fixed bg-white border border-gray-200 rounded-sm shadow-lg z-50" style={{ top: '50%', left: '30%', width: 'max-content', height: '105px' }}>
      <div className="flex items-center h-full pr-6" style={{ width: 'max-content' }}>
        <div className="flex items-center gap-3">
          {/* Left Sidebar */}
          <div className="text-[#C72030] bg-[#C4B89D] rounded-lg w-[44px] h-[105px] flex items-center justify-center text-xs font-bold">
            A
          </div>

          {/* Header Section */}
          <div className="flex flex-col justify-center px-3 py-2 min-w-[140px]">
            <span className="text-[16px] font-semibold text-[#1A1A1A] whitespace-nowrap leading-none">
              Actions
            </span>
            <span className="text-[12px] font-medium text-[#6B7280] whitespace-nowrap leading-tight mt-1">
              Quick actions available
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center ml-8 gap-4">
          {/* Add Button */}
          <button
            onClick={() => {
              onAdd();
              onClose();
            }}
            className="text-gray-600 hover:bg-gray-100 flex flex-col items-center justify-center h-auto p-2 disabled:opacity-50 min-w-[60px]"
            style={{ width: '60px', height: '70px' }}
            title="Add"
          >
            <Plus className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium text-center leading-tight">Add</span>
          </button>

          {/* Import Button */}
          <button
            onClick={() => {
              onImport();
              onClose();
            }}
            className="text-gray-600 hover:bg-gray-100 flex flex-col items-center justify-center h-auto p-2 disabled:opacity-50 min-w-[60px]"
            style={{ width: '60px', height: '70px' }}
            title="Import"
          >
            <Upload className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium text-center leading-tight">Import</span>
          </button>

          {/* Divider */}
          <div className="w-px h-12 bg-gray-300 mx-2"></div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="text-gray-600 hover:bg-gray-100 flex items-center justify-center"
            style={{ width: '44px', height: '44px' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
