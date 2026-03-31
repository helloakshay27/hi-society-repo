
import React, { useState } from 'react';
import { ResponseEscalationTab } from '@/components/escalation-matrix/ResponseEscalationTab';
import { ResolutionEscalationTab } from '@/components/escalation-matrix/ResolutionEscalationTab';

export const EscalationMatrixPage: React.FC = () => {
  const [activeMainTab, setActiveMainTab] = useState<'resolution' | 'response'>('resolution');

  return (
    <div className="p-0 space-y-0">
      {/* Top-level tabs: Resolution | Response */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setActiveMainTab('resolution')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeMainTab === 'resolution'
              ? 'border-[#C72030] text-[#C72030]'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Resolution
        </button>
        <button
          onClick={() => setActiveMainTab('response')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeMainTab === 'response'
              ? 'border-[#C72030] text-[#C72030]'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Response
        </button>
      </div>

      {/* Tab content */}
      <div className="p-6">
        {activeMainTab === 'resolution' && <ResolutionEscalationTab />}
        {activeMainTab === 'response' && <ResponseEscalationTab />}
      </div>
    </div>
  );
};
