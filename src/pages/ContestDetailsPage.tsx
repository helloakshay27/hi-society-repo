import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trophy,
  Gift,
  FileText,
  Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  brand: string;
  base_price: string;
  sale_price: string;
  final_price: string;
  stock_quantity: number;
  status: string;
  banner_image: string | null;
}

interface Prize {
  id: number;
  title: string;
  display_name: string | null;
  reward_type: "points" | "coupon" | "merchandise" | "none";
  coupon_code: string | null;
  partner_name: string | null;
  points_value: number | null;
  probability_value: number;
  probability_out_of: number;
  icon_url: string | null;
  image: {
    id: number;
    url: string;
  } | null;
  product: Product | null;
  total_quantity: number | null;
  validity: string | null;
  terms_and_conditions: string | null;
  // other fields omitted if not used in UI
}

interface ContestDetails {
  id: number;
  name: string;
  description: string | null;
  terms_and_conditions: string | null;
  redemption_guide: string | null;
  content_type: string;
  active: boolean;
  start_at: string; // ISO string
  end_at: string; // ISO string
  user_caps: number | null;
  user_attemp_remaining: number | null;
  access_type: string | null;
  societies: Array<{ id: number; name: string }> | null;
  prizes: Prize[];
}

// Removed hardcoded constants - will use localStorage instead

export const ContestDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [contest, setContest] = useState<ContestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchContest = async () => {
      setLoading(true);
      setError(null);

      try {
        const baseUrl = localStorage.getItem("baseUrl");
        const token = localStorage.getItem("token");
        // const baseUrl =  "https://uat-hi-society.lockated.com";
        //     const token = "O08MAh4ADTSweyKwK8zwR5CDVlzKYKLcu825jhnvEjI"

        if (!baseUrl || !token) {
          throw new Error("Base URL or token not set in localStorage");
        }

        // Ensure protocol is present
        const url = /^https?:\/\//i.test(baseUrl)
          ? baseUrl
          : `https://${baseUrl}`;

        const res = await fetch(`${url}/contests/${id}.json`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} - ${res.statusText}`);
        }

        const data: ContestDetails = await res.json();
        setContest(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load contest details");
        toast.error("Could not load contest details");
      } finally {
        setLoading(false);
      }
    };

    fetchContest();
  }, [id]);

  const formatDate = (iso: string): string => {
    try {
      const date = new Date(iso);
      return date.toLocaleDateString("en-GB"); // 07/02/2026
    } catch {
      return iso;
    }
  };

  const formatTime = (iso: string): string => {
    try {
      const date = new Date(iso);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }); // 2:00 PM
    } catch {
      return iso;
    }
  };

  const getProbability = (prize: Prize) => {
    return `${prize.probability_value}`;
  };

  const handleEdit = (section: string) => {
    navigate(`/contests/${id}/edit`);
  };

  const handleBack = () => {
    navigate("/contests");
  };

  if (loading) {
    return (
      <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden min-h-screen bg-white flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-gray-300 border-t-[#1A1A18] animate-spin" />
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Contest not found"}</p>
          <Button
            onClick={handleBack}
            variant="outline"
            className="btn-cancel h-9 px-4 text-sm font-medium"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden min-h-screen bg-white">
      {/* Header */}
      <div className="mb-[22px]">
        <div className="flex items-center gap-2 text-[13px] font-medium mb-3 text-[rgba(26,26,24,0.48)]">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#F5F4F0] transition-colors"
            aria-label="Back to Contest List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span>Contests</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-[#1A1A18]">Contest Details</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em] text-[#1A1A18]">
                {contest.name}
              </h1>
              <span
                className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium text-black ${contest.active ? "bg-[#C7EDDA]" : "bg-[#F2C8C4]"}`}
              >
                {contest.active ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-[12.5px] font-medium text-[rgba(26,26,24,0.48)]">
              {contest.content_type.charAt(0).toUpperCase() +
                contest.content_type.slice(1)}{" "}
              Contest
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleEdit("all")}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 text-[13px] font-medium text-[#1A1A18] bg-white border border-[rgba(26,26,24,0.12)] rounded-[10px] hover:bg-[#F5F4F0] transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit Contest
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Basic Contest Info */}
        <Card className="w-full bg-white border border-[rgba(26,26,24,0.09)] rounded-2xl shadow-none">
          <div className="px-6 pt-[22px] pb-1 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex-none rounded-full bg-[#F5F4F0] flex items-center justify-center">
                <Trophy className="w-3.5 h-3.5 text-[#1A1A18]" />
              </div>
              <h3 className="text-sm font-semibold text-[#1A1A18]">
                Basic Contest Info
              </h3>
            </div>
            {/* <Button
              onClick={() => handleEdit("basic")}
              variant="outline"
              size="sm"
              className="border-[#C72030] text-[#C72030] hover:bg-[#C72030]/10"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button> */}
          </div>
          <CardContent className="px-6 pt-4 pb-[22px]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">
                  Contest Name
                </p>
                <p className="text-[13.5px] font-medium text-[#1A1A18]">{contest.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">
                  Contest Type
                </p>
                <p className="text-[13.5px] font-medium text-[#1A1A18]">
                  {contest.content_type.charAt(0).toUpperCase() +
                    contest.content_type.slice(1)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">Description</p>
                <p className="text-[13.5px] font-medium text-[#1A1A18] break-words whitespace-pre-wrap">
                  {contest.description || "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validity & Status */}
        <Card className="w-full bg-white border border-[rgba(26,26,24,0.09)] rounded-2xl shadow-none">
          <div className="px-6 pt-[22px] pb-1 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex-none rounded-full bg-[#F5F4F0] flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5 text-[#1A1A18]" />
              </div>
              <h3 className="text-sm font-semibold text-[#1A1A18]">
                Validity & Status
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium text-black ${contest.active ? "bg-[#C7EDDA]" : "bg-[#F2C8C4]"}`}
              >
                {contest.active ? "Active" : "Inactive"}
              </span>
              {/* <Button
                onClick={() => handleEdit("validity")}
                variant="outline"
                size="sm"
                className="border-[#C72030] text-[#C72030] hover:bg-[#C72030]/10"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button> */}
            </div>
          </div>
          <CardContent className="px-6 pt-4 pb-[22px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">Start Date</p>
                <p className="text-[13.5px] font-medium text-[#1A1A18]">
                  {formatDate(contest.start_at)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">Start Time</p>
                <p className="text-[13.5px] font-medium text-[#1A1A18]">
                  {formatTime(contest.start_at)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">End Date</p>
                <p className="text-[13.5px] font-medium text-[#1A1A18]">
                  {formatDate(contest.end_at)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">End Time</p>
                <p className="text-[13.5px] font-medium text-[#1A1A18]">
                  {formatTime(contest.end_at)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">Users Cap</p>
                <p className="text-[13.5px] font-medium text-[#1A1A18]">
                  {contest.user_caps ?? "—"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">
                  Attempts Required
                </p>
                <p className="text-[13.5px] font-medium text-[#1A1A18]">
                  {contest.user_attemp_remaining ?? "—"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">Access Type</p>
                <p className="text-[13.5px] font-medium text-[#1A1A18] capitalize">
                  {contest.access_type ? contest.access_type.replace('_', ' ') : "—"}
                </p>
              </div>
              {contest.access_type === 'multiple_sites' && contest.societies && (
                <div className="space-y-1 md:col-span-3">
                  <p className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">Societies</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {contest.societies.map((s) => (
                      <span key={s.id} className="inline-flex items-center px-3 py-0.5 bg-[#F5F4F0] text-[#1A1A18] text-xs font-medium rounded-full">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Offers & Media (Prizes) */}
        <Card className="w-full bg-white border border-[rgba(26,26,24,0.09)] rounded-2xl shadow-none">
          <div className="px-6 pt-[22px] pb-1 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex-none rounded-full bg-[#F5F4F0] flex items-center justify-center">
                <Gift className="w-3.5 h-3.5 text-[#1A1A18]" />
              </div>
              <h3 className="text-sm font-semibold text-[#1A1A18]">
                Prizes / Offers
              </h3>
            </div>
            {/* <Button
              onClick={() => handleEdit("prizes")}
              variant="outline"
              size="sm"
              className="border-[#C72030] text-[#C72030] hover:bg-[#C72030]/10"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button> */}
          </div>
          <CardContent className="px-6 pt-4 pb-[22px]">
            {contest.prizes.length === 0 ? (
              <p className="text-[13px] text-[rgba(26,26,24,0.48)] text-center py-8">
                No prizes defined yet
              </p>
            ) : (
              contest.prizes.map((prize, index) => (
                <div
                  key={prize.id}
                  className="mb-6 last:mb-0 border-b border-[rgba(26,26,24,0.08)] pb-6 last:border-b-0"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <span className="text-sm font-semibold text-[rgba(26,26,24,0.48)]">
                      {index + 1}.
                    </span>
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-5 gap-x-6">
                        {/* Row 1 */}
                        <div className="space-y-1">
                          <p className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">
                            Prize Title
                          </p>
                          <p className="text-[13.5px] font-medium text-[#1A1A18]">
                            {prize.title}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">
                            {" "}
                            Reward Type
                          </p>
                          <p className="text-[13.5px] font-medium text-[#1A1A18]">
                            {prize.reward_type === "points"
                              ? "Points"
                              : prize.reward_type === "coupon"
                                ? "Coupon Code"
                                : prize.reward_type === "merchandise"
                                  ? "Merchandise"
                                  : prize.reward_type === "none"
                                    ? "None"
                                    : "—"}
                          </p>
                        </div>

                        <div className="md:row-span-4 flex items-start justify-end">
                          <div className="w-48 h-32 bg-[#FAF9F7] rounded-xl border border-[rgba(26,26,24,0.09)] flex items-center justify-center overflow-hidden">
                            {prize.image?.url || prize.icon_url ? (
                              <img
                                src={prize.image?.url || prize.icon_url || ""}
                                alt={prize.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <p className="text-xs text-gray-500 text-center p-3">
                                No banner / icon
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Row 2 */}
                        {prize.reward_type !== "none" && (
                          <div className="space-y-1">
                            <p className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">
                              {prize.reward_type === "points"
                                ? "Points Value"
                                : prize.reward_type === "merchandise"
                                  ? "Resource"
                                  : "Coupon Code"}
                            </p>

                            <p className="text-[13.5px] font-medium text-[#1A1A18]">
                              {prize.reward_type === "points"
                                ? `${prize.points_value ?? 0} Points`
                                : prize.reward_type === "merchandise"
                                  ? (prize.product?.name ?? "—")
                                  : (prize.coupon_code ?? "—")}
                            </p>
                          </div>
                        )}

                        <div className="space-y-1">
                          <p className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">
                            Partner
                          </p>
                          <p className="text-[13.5px] font-medium text-[#1A1A18]">
                            {prize.partner_name ?? "—"}
                          </p>
                        </div>

                        {/* Row 3 */}
                        <div className="space-y-1">
                          <p className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">
                            Probability
                          </p>
                          <p className="text-[13.5px] font-medium text-[#1A1A18]">
                            {getProbability(prize)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">
                            Total Quantity
                          </p>
                          <p className="text-[13.5px] font-medium text-[#1A1A18]">
                            {prize.total_quantity !== null ? prize.total_quantity : "—"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">
                            Validity
                          </p>
                          <p className="text-[13.5px] font-medium text-[#1A1A18]">
                            {prize.validity ?? "—"}
                          </p>
                        </div>
                        {prize.display_name && (
                          <div className="space-y-1">
                            <p className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">
                              Display Name
                            </p>
                            <p className="text-[13.5px] font-medium text-[#1A1A18]">
                              {prize.display_name}
                            </p>
                          </div>
                        )}
                        {prize.terms_and_conditions && (
                          <div className="md:col-span-2 space-y-1">
                            <p className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">
                              Prize Terms & Conditions
                            </p>
                            <div
                              className="text-[13.5px] font-medium text-[#1A1A18] prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: prize.terms_and_conditions }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Product Details for Merchandise */}
                      {prize.reward_type === "merchandise" && prize.product && (
                        <div className="mt-6 p-4 bg-white rounded-xl border border-[rgba(26,26,24,0.09)]">
                          <h4 className="text-sm font-semibold text-[#1A1A18] mb-3">Product Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <p className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">Product Name</p>
                              <p className="text-[13.5px] font-medium text-[#1A1A18]">{prize.product.name}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">SKU</p>
                              <p className="text-[13.5px] font-medium text-[#1A1A18]">{prize.product.sku}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">Brand</p>
                              <p className="text-[13.5px] font-medium text-[#1A1A18]">{prize.product.brand || "—"}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">Price</p>
                              <p className="text-[13.5px] font-medium text-[#1A1A18]">₹{prize.product.final_price}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">Stock Quantity</p>
                              <p className="text-[13.5px] font-medium text-[#1A1A18]">{prize.product.stock_quantity}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">Status</p>
                              <p className="text-[13.5px] font-medium text-[#1A1A18] capitalize">{prize.product.status}</p>
                            </div>
                            {prize.product.description && (
                              <div className="space-y-1 md:col-span-3">
                                <p className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">Description</p>
                                <p className="text-[13.5px] font-medium text-[#1A1A18]">{prize.product.description}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Terms & Conditions */}
        <Card className="w-full bg-white border border-[rgba(26,26,24,0.09)] rounded-2xl shadow-none">
          <div className="px-6 pt-[22px] pb-1 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex-none rounded-full bg-[#F5F4F0] flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-[#1A1A18]" />
              </div>
              <h3 className="text-sm font-semibold text-[#1A1A18]">
                Terms & Conditions
              </h3>
            </div>
          </div>
          <CardContent className="px-6 pt-4 pb-[22px]">
            <div className="prose max-w-none text-sm quill-content">
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    contest.terms_and_conditions ||
                    "<p className='text-gray-500'>No terms and conditions provided</p>",
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Redemption Guide */}
        {contest.content_type.toLowerCase() === "scratch" && (
          <Card className="w-full bg-white border border-[rgba(26,26,24,0.09)] rounded-2xl shadow-none">
            <div className="px-6 pt-[22px] pb-1 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex-none rounded-full bg-[#F5F4F0] flex items-center justify-center">
                  <Gift className="w-3.5 h-3.5 text-[#1A1A18]" />
                </div>
                <h3 className="text-sm font-semibold text-[#1A1A18]">
                  Redemption Guide
                </h3>
              </div>
            </div>
            <CardContent className="px-6 pt-4 pb-[22px]">
              <div className="prose max-w-none text-sm quill-content">
                <div
                  dangerouslySetInnerHTML={{
                    __html:
                      contest.redemption_guide ||
                      "<p className='text-gray-500'>No redemption guide provided</p>",
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ContestDetailsPage;
