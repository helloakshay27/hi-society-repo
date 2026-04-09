import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CallDirectory: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 lg:p-10 font-sans">
      {/* Header */}
      <div className="relative mb-8">
        <button
          onClick={() => navigate(-1)}
          className="absolute left-0 top-0 flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="text-center w-full max-w-5xl mx-auto pt-2">
          <h1 className="text-xl font-bold text-gray-900 mb-4">
            Call Directory
          </h1>
          <p className="text-xs text-gray-500 leading-relaxed max-w-3xl mx-auto text-center">
            View and manage your call directory elements here. UI details will be defined later.
          </p>
        </div>
      </div>

      {/* Content Placeholder */}
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow p-6 min-h-[400px] flex items-center justify-center">
        <p className="text-gray-500 text-sm">Call Directory Content Coming Soon</p>
      </div>
    </div>
  );
};

export default CallDirectory;
