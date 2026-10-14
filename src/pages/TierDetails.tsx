import React from "react";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getFullUrl, getAuthHeader, API_CONFIG } from "@/config/apiConfig";
import { ArrowLeft, ChevronRight, Trophy, Clock } from "lucide-react";

// Card styling matched to the Facility Setup add / details pages
const SECTION_CARD =
  "w-full bg-white border border-[rgba(26,26,24,0.09)] rounded-2xl px-6 py-[22px] space-y-5";
const FIELD_LABEL = "text-[11px] font-medium text-[rgba(26,26,24,0.48)]";
const FIELD_VALUE = "text-[13.5px] font-medium text-[#1A1A18]";

const SectionHeader = ({ icon, title }: { icon: React.ReactElement; title: string }) => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 flex-none rounded-full flex items-center justify-center bg-[#F5F4F0] text-[#1A1A18]">
      {React.cloneElement(icon, { className: "w-3.5 h-3.5" })}
    </div>
    <h3 className="text-sm font-semibold text-[#1A1A18]">{title}</h3>
  </div>
);

const Detail = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col gap-1 min-w-0">
    <span className={FIELD_LABEL}>{label}</span>
    <span className={`${FIELD_VALUE} break-words`}>{value}</span>
  </div>
);

const SummaryRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between gap-3 text-[13px]">
    <span className="text-[rgba(26,26,24,0.55)]">{label}</span>
    <span className="font-semibold text-[#1A1A18]">{value}</span>
  </div>
);

export default function TierDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  // token will be retrieved from API_CONFIG when needed

  const [tierDetails, setTierDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getMemberDetails = async (id) => {
    try {
      const token = API_CONFIG.TOKEN || "";
      const url = getFullUrl(`/loyalty/tiers/${id}.json?token=${token}&&q[loyalty_type_id_eq]=1`);
      const response = await axios.get(url, { headers: { Authorization: getAuthHeader() } });
      return response.data;
    } catch (error) {
      console.error("Error fetching member details:", error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const data = await getMemberDetails(id);
        setTierDetails(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [id]);

  const pageHeader = (
    <div className="mb-[22px]">
      <div className="flex items-center gap-2 text-[13px] font-medium mb-3 text-[rgba(26,26,24,0.48)]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#F5F4F0] transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span>Tiers</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-[#1A1A18]">Tier Details</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em] text-[#1A1A18]">
            {tierDetails?.display_name || tierDetails?.name || "Tier Details"}
          </h1>
          {tierDetails?.created_at && (
            <p className={`${FIELD_LABEL} mt-1.5 text-[12.5px]`}>
              Created {formatDate(tierDetails.created_at)}
            </p>
          )}
        </div>
        {tierDetails && (
          <span
            className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium text-black ${
              tierDetails.point_type === "lifetime" ? "bg-[#C7EDDA]" : "bg-[#F2EBC9]"
            }`}
          >
            {tierDetails.point_type === "lifetime" ? "Lifetime" : "Rolling Year"}
          </span>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 bg-[#FDFDFB] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#1A1A18] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[rgba(26,26,24,0.55)]">Loading tier details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-[#FDFDFB] min-h-screen">
        {pageHeader}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#FDFDFB] min-h-screen">
      {pageHeader}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tier Configuration */}
        <div className="lg:col-span-2">
          <div className={SECTION_CARD}>
            <SectionHeader icon={<Trophy />} title="Tier Configuration" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-6">
              <Detail label="Tier Name" value={tierDetails?.display_name || tierDetails?.name || "N/A"} />
              <Detail label="Title" value={tierDetails?.title || "N/A"} />
              <Detail label="Exit Points" value={tierDetails?.exit_points ?? "N/A"} />
              <Detail label="Welcome Bonus" value={`${tierDetails?.welcome_bonus ?? "N/A"} Points`} />
              <Detail label="Multipliers" value={`${tierDetails?.multipliers ?? "N/A"}x`} />
              {tierDetails?.description && (
                <div className="md:col-span-2">
                  <Detail label="Description" value={tierDetails.description} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="lg:col-span-1">
          <div className={SECTION_CARD}>
            <SectionHeader icon={<Clock />} title="Point Accumulation" />
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className={FIELD_LABEL}>Timeframe</span>
                <span className={FIELD_VALUE}>
                  {tierDetails?.point_type === "lifetime" ? "Lifetime" : "Rolling Year"}
                </span>
                <span className="text-[12px] text-[rgba(26,26,24,0.48)]">
                  {tierDetails?.point_type === "lifetime"
                    ? "Points accumulate throughout member's lifetime."
                    : "Points reset annually and tier status is re-evaluated."}
                </span>
              </div>

              <div className="border-t border-[rgba(26,26,24,0.08)] pt-4 space-y-2.5">
                <SummaryRow label="Exit Points Threshold" value={tierDetails?.exit_points ?? "-"} />
                <SummaryRow label="Points Multiplier" value={`${tierDetails?.multipliers ?? "-"}x`} />
                <SummaryRow label="Welcome Bonus" value={`${tierDetails?.welcome_bonus ?? "-"} pts`} />
              </div>

              {tierDetails?.created_at && (
                <div className="border-t border-[rgba(26,26,24,0.08)] pt-4">
                  <SummaryRow label="Created On" value={formatDate(tierDetails.created_at)} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
