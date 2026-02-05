import React from "react";
import { getFullUrl, getAuthenticatedFetchOptions } from "@/config/apiConfig";
import { toast } from "sonner";

const SettingsGenericPage: React.FC = () => {
  const handleSync = async () => {
    try {
      // Build the correct endpoint with .json and token as query param
      const token = localStorage.getItem("token") || "";
      const url = getFullUrl(`/crm/admin/sync_allow_visitors.json?token=${token}`);
      const options = getAuthenticatedFetchOptions("GET");
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error("Failed to sync");
      }
      const data = await response.json();
      toast.success("SYNC Visitor Allow Success", {
        description: JSON.stringify(data),
      });
    } catch (error) {
      toast.error("SYNC Visitor Allow Failed", {
        description: String(error),
      });
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <button
        className="bg-[#C72030] hover:bg-[#B8252F] text-white px-8 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleSync}
      >
        SYNC Visitor Allow
      </button>
    </div>
  );
};

export default SettingsGenericPage;
