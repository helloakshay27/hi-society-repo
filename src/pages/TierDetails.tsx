import React from "react";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, ChevronRight, Star, Trophy, Zap, Gift, Clock } from "lucide-react";

export default function TierDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

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
      const response = await axios.get(
        `https://runwal-api.lockated.com/loyalty/tiers/${id}.json?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ&&q[loyalty_type_id_eq]=1`
      );
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

  if (loading) {
    return (
      <div className="p-6 bg-[#fafafa] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#C72030] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading tier details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-[#fafafa] min-h-screen">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Tiers</span>
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#fafafa] min-h-screen">
      {/* Header Card */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border p-6">
        {/* Back Button */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Tiers</span>
          </button>
        </div>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
          <span>Setup Member</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>Loyalty</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#C72030] font-medium">Tier Details</span>
        </div>

        {/* Tier Name and Point Type Badge */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            {tierDetails?.display_name || tierDetails?.name || "Tier Details"}
          </h1>
          <span
            className={`px-3 py-1 rounded text-sm font-medium ${
              tierDetails?.point_type === "lifetime"
                ? "bg-green-100 text-green-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {tierDetails?.point_type === "lifetime" ? "Lifetime" : "Rolling Year"}
          </span>
        </div>

        {/* Created Date */}
        {tierDetails?.created_at && (
          <p className="text-sm text-gray-500 mt-2">
            Created: {formatDate(tierDetails.created_at)}
          </p>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tier Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tier Details Card */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-6">
              <h2 className="text-lg font-semibold text-[#C72030] mb-6">Tier Configuration</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tier Name */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-[#C72030]/10 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-[#C72030]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Tier Name</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {tierDetails?.display_name || tierDetails?.name || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Exit Points */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Star className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Exit Points</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {tierDetails?.exit_points ?? "N/A"}
                    </p>
                  </div>
                </div>

                {/* Multipliers */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Multipliers</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {tierDetails?.multipliers ?? "N/A"}x
                    </p>
                  </div>
                </div>

                {/* Welcome Bonus */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Gift className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Welcome Bonus</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {tierDetails?.welcome_bonus ?? "N/A"} Points
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Point Type Info */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-6">
              <h2 className="text-lg font-semibold text-[#C72030] mb-6">Point Accumulation</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Timeframe</p>
                    <p className="font-semibold text-gray-900">
                      {tierDetails?.point_type === "lifetime"
                        ? "Lifetime"
                        : "Rolling Year"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {tierDetails?.point_type === "lifetime"
                        ? "Points accumulate throughout member's lifetime."
                        : "Points reset annually and tier status is re-evaluated."}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Exit Points Threshold</span>
                    <span className="font-semibold text-gray-900">{tierDetails?.exit_points ?? "-"}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Points Multiplier</span>
                    <span className="font-semibold text-gray-900">{tierDetails?.multipliers ?? "-"}x</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Welcome Bonus</span>
                    <span className="font-semibold text-gray-900">{tierDetails?.welcome_bonus ?? "-"} pts</span>
                  </div>
                </div>

                {tierDetails?.created_at && (
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Created On</span>
                      <span className="text-gray-900">{formatDate(tierDetails.created_at)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
