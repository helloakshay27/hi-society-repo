import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw } from "lucide-react";
import {
  getAppointmentzFlatDetails,
  AppointmentzFlat,
} from "@/services/appointmentzService";

// Helper to safely render strings/numbers without crashing
const safeStr = (val: any, fallback = ""): string => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") return val.trim() ? val : fallback;
  if (typeof val === "number") return String(val);
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (typeof val === "object") {
    return (
      val.name ||
      val.title ||
      val.flat_no ||
      val.label ||
      val.society_flat_type ||
      val.floor_name ||
      val.wing_name ||
      (val.id !== undefined ? String(val.id) : fallback)
    );
  }
  return String(val);
};

export const AppointmentzManageFlatDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [flat, setFlat] = useState<AppointmentzFlat | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);

  // Fetch flat data safely from API
  const fetchFlatData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefetching(true);
    } else {
      setLoading(true);
    }

    try {
      if (id) {
        const raw = await getAppointmentzFlatDetails(id);
        const data = raw?.society_flat || raw;
        if (data && typeof data === "object") {
          const mapped: AppointmentzFlat = {
            id: Number(data.id) || Number(id),
            tower: safeStr(data.society_block?.name || data.tower, ""),
            flat: safeStr(data.flat_no || data.flat, ""),
            flat_type: safeStr(
              data.society_flat_type?.society_flat_type ||
                data.society_flat_type?.name ||
                data.flat_type,
              ""
            ),
            payment_status: safeStr(data.payment_status, ""),
            master_status: safeStr(data.master_status || data.owner_name, ""),
            current_level: safeStr(data.current_level, ""),
            current_status: safeStr(data.current_status, ""),
            rm_assigned: safeStr(data.rm_user?.name || data.rm_assigned, ""),
            email_sent_by: safeStr(data.email_sent_by, ""),
            email_sent_at: safeStr(data.email_sent_at || data.created_at, ""),
            site_visits: Number(data.site_visits_count ?? data.site_visits ?? 0),
            snags_count: Number(data.snags_count ?? 0),
            customer_name: safeStr(data.customer_name || data.bill_to_party || data.owner_name, ""),
            customer_code: safeStr(data.customer_code, ""),
            customer_status: safeStr(data.customer_status, ""),
            carpet_area: safeStr(data.build_up_area, ""),
            built_up_area: safeStr(data.super_area, ""),
            floor: safeStr(data.society_floor?.name || data.society_floor_id, ""),
            wing: safeStr(data.society_wing?.name || data.society_wing_id, ""),
            possession: Boolean(data.possession),
            sold: Boolean(data.sold),
            status: Boolean(data.approve),
          };
          setFlat(mapped);
          if (isRefresh) {
            toast.success("Flat data refetched successfully");
          }
          return;
        }
      }
    } catch (err) {
      console.warn("Error fetching flat details for ID", id, err);
      if (isRefresh) {
        toast.error("Failed to refetch flat data");
      }
    } finally {
      setLoading(false);
      setIsRefetching(false);
    }
  }, [id]);

  useEffect(() => {
    fetchFlatData();
  }, [fetchFlatData]);

  // Handle Refetch Data button click
  const handleRefetch = () => {
    fetchFlatData(true);
  };

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen">
      {/* Top Header Container matching exact View Image */}
      <div className="bg-white border border-[#D5DbDB] rounded-lg p-5 mb-6 shadow-xs">
        {/* Row 1: Back Navigation & Refetch Data button */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/appointmentz/manage-flats")}
              className="p-1.5 rounded-md hover:bg-[#f6f4ee] border border-[#D5DbDB] bg-white text-[#1A1A1A] transition-colors"
              title="Back to Manage Flats"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <Button
              onClick={handleRefetch}
              disabled={isRefetching}
              className="bg-[#fdf3ef] hover:bg-[#fbe7df] border border-[#f5cfbf] text-[#1A1A1A] px-3.5 py-1.5 rounded text-xs font-medium shadow-2xs transition-colors h-8 flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#da5677] ${isRefetching ? "animate-spin" : ""}`} />
              <span>Refetch Data</span>
            </Button>
          </div>

          <div className="text-xs text-gray-500 font-medium">
            Flat ID: <span className="text-[#1A1A1A] font-semibold">{safeStr(flat?.id || id)}</span>
          </div>
        </div>

        {/* Row 2: Metadata Points matching Screenshot View Image */}
        <div className="flex flex-wrap items-center gap-x-12 gap-y-3 text-xs md:text-sm pt-2">
          {/* Point 1: Timestamp in Orange (#da7756) */}
          <div className="font-semibold text-[#da7756] text-sm">
            {safeStr(flat?.email_sent_at, "")}
          </div>

          {/* Point 2: Payment Status */}
          <div className="flex items-center gap-1.5 text-xs md:text-sm">
            <span className="font-medium text-gray-600">Payment Status :</span>
            <span className="font-semibold text-[#1A1A1A]">
              {safeStr(flat?.payment_status, "")}
            </span>
          </div>

          {/* Point 3: Customer Name */}
          <div className="flex items-center gap-1.5 text-xs md:text-sm">
            <span className="font-medium text-gray-600">Customer Name :</span>
            <span className="font-semibold text-[#1A1A1A]">
              {safeStr(flat?.customer_name, "")}
            </span>
          </div>

          {/* Point 4: Customer Code */}
          <div className="flex items-center gap-1.5 text-xs md:text-sm">
            <span className="font-medium text-gray-600">Customer Code :</span>
            <span className="font-semibold text-[#1A1A1A]">
              {safeStr(flat?.customer_code, "")}
            </span>
          </div>

          {/* Point 5: Customer Status */}
          <div className="flex items-center gap-1.5 text-xs md:text-sm">
            <span className="font-medium text-gray-600">Customer Status :</span>
            <span className="font-semibold text-[#1A1A1A]">
              {safeStr(flat?.customer_status, "")}
            </span>
          </div>
        </div>

        {/* Row 3: Horizontal Divider Line */}
        <hr className="border-t border-[#e5e7eb] mt-5 mb-1" />
      </div>
    </div>
  );
};

export default AppointmentzManageFlatDetails;
