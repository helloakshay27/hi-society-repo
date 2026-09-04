import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ScheduleSetupPanel } from "@/components/appointmentz/ScheduleSetupPanel";

export const AppointmentzScheduleSetup: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4 md:p-6 bg-brand-bg min-h-screen">
      {/* Top Header Card */}
      <div className="bg-white border border-brand-border rounded-lg p-5 mb-6 shadow-system-sm">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/appointmentz/slots-config")}
              className="p-1.5 rounded-md hover:bg-brand-bg border border-brand-border bg-white text-brand-text transition-colors cursor-pointer"
              title="Back to Slots Configuration"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-brand-body-2 font-bold text-brand-text">Schedule Setup</h1>
          </div>
        </div>

        <ScheduleSetupPanel />
      </div>
    </div>
  );
};

export default AppointmentzScheduleSetup;
