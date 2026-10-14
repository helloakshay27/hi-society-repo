
import React from 'react';

interface ActionButtonsProps {
  onSave: () => void;
  onBack: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ onSave, onBack }) => {
  return (
    <div className="flex justify-end gap-4">
      <button
        type="button"
        onClick={onBack}
        className="btn-cancel h-9 px-4 text-sm font-medium bg-white border border-[#da7756] text-[#da7756] hover:bg-gray-100"
      >
        Back
      </button>
      <button
        type="button"
        onClick={onSave}
        className="btn-primary h-9 px-4 text-sm font-medium"
      >
        Save
      </button>
    </div>
  );
};
