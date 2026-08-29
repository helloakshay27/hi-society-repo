import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Calendar,
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  getPublicSiteSchedulePage,
  getPublicSiteSchedulesForDate,
  bookPublicSiteScheduleSlot,
  PublicSiteSchedulePageResponse,
  PublicSiteSlot,
} from "@/services/appointmentzService";

/**
 * Format ISO date string (YYYY-MM-DD) to DD/MM/YYYY format required by backend
 */
const formatToDDMMYYYY = (isoDate: string): string => {
  if (!isoDate) return "";
  if (isoDate.includes("/")) return isoDate;
  const parts = isoDate.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  }
  return isoDate;
};

/**
 * Normalize DD/MM/YYYY to YYYY-MM-DD for HTML5 date input
 */
const formatToYYYYMMDD = (dateStr: string): string => {
  if (!dateStr) return "";
  if (dateStr.includes("-")) return dateStr;
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return dateStr;
};

export const PublicSiteScheduleBooking: React.FC = () => {
  // Step 1: Pull parameters from URL
  const { encryptedId } = useParams<{ encryptedId: string }>();
  const [searchParams] = useSearchParams();
  const createdBy = searchParams.get("created_by") || "";
  const queryType = searchParams.get("type") || "";

  // Page Load State
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [pageData, setPageData] = useState<PublicSiteSchedulePageResponse | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  // Form State
  const [pickedDate, setPickedDate] = useState<string>("");
  const [minDate, setMinDate] = useState<string>("");
  const [maxDate, setMaxDate] = useState<string>("");
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slots, setSlots] = useState<PublicSiteSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isBookedSuccess, setIsBookedSuccess] = useState(false);

  // Step 2: Hit "load page" API
  useEffect(() => {
    if (!encryptedId) {
      setPageError("Invalid or missing booking link.");
      setIsLoadingPage(false);
      return;
    }

    const loadPage = async () => {
      setIsLoadingPage(true);
      setPageError(null);
      try {
        const response = await getPublicSiteSchedulePage(
          encryptedId,
          createdBy || undefined,
          queryType || undefined
        );

        setPageData(response);

        // Calculate min & max dates if state is bookable / reschedule
        if (
          response.state === "bookable" ||
          response.state === "reschedule"
        ) {
          const bw = response.booking_window;
          let calculatedMin = "";
          let calculatedMax = "";

          if (bw?.start_date) {
            calculatedMin = formatToYYYYMMDD(bw.start_date);
            calculatedMax = bw.end_date ? formatToYYYYMMDD(bw.end_date) : "";
          } else {
            const today = new Date();
            const minD = new Date(today);
            minD.setDate(today.getDate() + Number(bw?.start_days ?? 0));
            calculatedMin = minD.toISOString().split("T")[0];

            const maxD = new Date(today);
            maxD.setDate(
              today.getDate() + Number(bw?.max_days ?? 30) - 1
            );
            calculatedMax = maxD.toISOString().split("T")[0];
          }

          setMinDate(calculatedMin);
          setMaxDate(calculatedMax);
          setPickedDate(calculatedMin);
        }
      } catch (err: any) {
        console.error("Error loading schedule page:", err);
        const errMsg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to load site visit schedule details. Please check the link or contact your relationship manager.";
        setPageError(errMsg);
      } finally {
        setIsLoadingPage(false);
      }
    };

    loadPage();
  }, [encryptedId, createdBy, queryType]);

  // Step 3: Fetch slots when pickedDate changes
  const fetchSlotsForDate = useCallback(
    async (dateIso: string, requestId: number | string) => {
      if (!dateIso || !requestId) return;

      const formattedDate = formatToDDMMYYYY(dateIso);
      setIsLoadingSlots(true);
      setSelectedSlotId(null);
      setSubmitError(null);

      try {
        const res = await getPublicSiteSchedulesForDate(requestId, formattedDate);
        setSlots(res.slots || []);
      } catch (err) {
        console.warn("Could not fetch slots for date:", err);
        setSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    },
    []
  );

  useEffect(() => {
    if (
      pageData &&
      (pageData.state === "bookable" || pageData.state === "reschedule") &&
      pageData.site_schedule_request?.id &&
      pickedDate
    ) {
      fetchSlotsForDate(pickedDate, pageData.site_schedule_request.id);
    }
  }, [pickedDate, pageData, fetchSlotsForDate]);

  // Step 4: Validate and Submit Booking
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Client-side validations
    if (!pickedDate) {
      toast.error("Please select a date for your visit.");
      return;
    }
    if (!selectedSlotId) {
      toast.error("Please select an available time slot.");
      return;
    }
    if (!consentChecked) {
      toast.error("Please confirm your consent to proceed with scheduling.");
      return;
    }

    const requestId = pageData?.site_schedule_request?.id;
    if (!requestId) {
      toast.error("Invalid request ID. Please reload the page.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedDate = formatToDDMMYYYY(pickedDate);
      const res = await bookPublicSiteScheduleSlot(
        requestId,
        formattedDate,
        selectedSlotId
      );

      if (res.code === 200 || res.message) {
        setIsBookedSuccess(true);
        toast.success("Site visit successfully scheduled!");
      }
    } catch (err: any) {
      console.error("Booking error:", err);
      const errorData = err?.response?.data;
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        setSubmitError(errorData.errors.join(", "));
        toast.error(errorData.errors.join(", "));
      } else if (errorData?.message) {
        setSubmitError(errorData.message);
        toast.error(errorData.message);
      } else {
        setSubmitError("Failed to book slot. Please select another slot or retry.");
        toast.error("Failed to book slot. Please retry.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for slot button styling in light theme
  const getSlotColorClasses = (colorCode: string, disabled: boolean, isSelected: boolean) => {
    const code = (colorCode || "").toLowerCase();

    let baseBg = "border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100";
    let badgeText = "Available";
    let badgeStyle = "bg-emerald-200/80 text-emerald-800";
    let dotColor = "bg-emerald-600";

    if (code.includes("yellow") || code === "yellow" || code === "#facc15") {
      baseBg = "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100";
      badgeText = "Fast Filling";
      badgeStyle = "bg-amber-200/80 text-amber-800";
      dotColor = "bg-amber-600";
    } else if (code.includes("red") || code === "red" || code === "#dc2626") {
      baseBg = "border-gray-200 bg-gray-100 text-gray-400 opacity-60 cursor-not-allowed";
      badgeText = "Full";
      badgeStyle = "bg-gray-200 text-gray-500";
      dotColor = "bg-gray-400";
    }

    if (disabled) {
      baseBg = "border-gray-200 bg-gray-100 text-gray-400 opacity-60 cursor-not-allowed";
      badgeText = "Full";
      badgeStyle = "bg-gray-200 text-gray-500";
      dotColor = "bg-gray-400";
    }

    const ringClasses = isSelected
      ? "ring-2 ring-[#DA7756] border-[#DA7756] shadow-xs font-semibold"
      : "";

    return {
      classes: `flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-xs font-medium transition-all ${baseBg} ${ringClasses}`,
      badgeText,
      badgeStyle,
      dotColor,
    };
  };

  // Loading Screen
  if (isLoadingPage) {
    return (
      <div className="min-h-screen bg-[#fbfbfa] flex items-center justify-center p-4">
        <div className="bg-white border border-[#D5DbDB] rounded-2xl p-8 max-w-sm w-full text-center shadow-xl space-y-4">
          <Loader2 className="w-10 h-10 text-[#DA7756] animate-spin mx-auto" />
          <p className="text-sm font-medium text-[#1A1A1A]">
            Loading your site visit details...
          </p>
        </div>
      </div>
    );
  }

  // Page Load Error Screen
  if (pageError) {
    return (
      <div className="min-h-screen bg-[#fbfbfa] flex items-center justify-center p-4">
        <div className="bg-white border border-red-200 rounded-2xl p-8 max-w-md w-full text-center shadow-xl space-y-4">
          <XCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-[#1A1A1A]">Unable to Load Visit</h2>
          <p className="text-sm text-[#6B7280]">{pageError}</p>
        </div>
      </div>
    );
  }

  const state = pageData?.state;
  const isReschedule = state === "reschedule";
  const residentName = pageData?.created_by?.firstname || "Resident";
  const flatLabel = pageData?.society_flat?.flat_new_str || "";

  return (
    <div className="min-h-screen bg-[#fbfbfa] flex items-center justify-center p-4">
      <div className="w-full max-w-[560px]">
        <div className="bg-white border border-[#D5DbDB] rounded-2xl shadow-xl overflow-hidden">
          {/* Header & Branding */}
          <div className="bg-[#f6f4ee] px-6 py-6 border-b border-[#D5DbDB] text-center">
            <div className="flex flex-col items-center justify-center mb-2">
              <div className="flex items-center gap-1.5 text-[#1A1A1A]">
                <Building2 className="w-6 h-6 text-[#DA7756]" />
                <span className="text-base font-black tracking-widest uppercase">SITE VISIT SCHEDULER</span>
              </div>
            </div>

            {/* Resident Greeting */}
            <h1 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] mt-1">
              Hi, {residentName}
            </h1>

            {/* Flat details */}
            {flatLabel && (
              <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
                Please select a preferred slot for flat:{" "}
                <span className="font-semibold text-[#1A1A1A]">{flatLabel}</span>
              </p>
            )}
          </div>

          {/* Decision Tree off 'state' */}
          {state === "cancelled" ? (
            /* State: Cancelled */
            <div className="p-8 text-center space-y-4">
              <XCircle className="w-12 h-12 text-red-500 mx-auto" />
              <h3 className="text-lg font-bold text-[#1A1A1A]">Request Cancelled</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Site Visit request has been cancelled, kindly contact your relationship manager.
              </p>
            </div>
          ) : state === "already_placed" ? (
            /* State: Already Placed */
            <div className="p-8 text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
              <h3 className="text-lg font-bold text-[#1A1A1A]">Visit Already Placed</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Site visit request has been already placed
                {pageData?.created_by_rm ? " by RM" : ""} for {flatLabel || "your flat"}. Kindly
                contact your Relationship Manager.
              </p>
            </div>
          ) : isBookedSuccess ? (
            /* State: Successful Booking Confirmation */
            <div className="p-8 text-center space-y-4">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto animate-bounce" />
              <h3 className="text-xl font-bold text-[#1A1A1A]">Visit Successfully Scheduled!</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Your visit has been successfully scheduled. Please check your email for details.
              </p>
              <div className="pt-2">
                <div className="inline-flex items-center gap-2 bg-[#f6f4ee] px-4 py-2 rounded-lg text-xs text-[#1A1A1A] border border-[#D5DbDB]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Confirmation email has been dispatched</span>
                </div>
              </div>
            </div>
          ) : (
            /* State: Bookable / Reschedule Form (Step 3 & Step 4) */
            <form onSubmit={handleSubmitBooking} className="p-6 bg-white space-y-4">
              {/* Step 3: Date Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#DA7756]" />
                  Select Visit Date
                </label>
                <Input
                  type="date"
                  min={minDate}
                  max={maxDate}
                  value={pickedDate}
                  onChange={(e) => setPickedDate(e.target.value)}
                  className="h-9 text-xs border-[#D5DbDB] bg-white text-[#1A1A1A] focus:ring-[#DA7756] cursor-pointer"
                />
              </div>

              {/* Slots Grid */}
              <div className="pt-1">
                {isLoadingSlots ? (
                  <div className="py-8 text-center space-y-2">
                    <Loader2 className="w-6 h-6 text-[#DA7756] animate-spin mx-auto" />
                    <p className="text-xs text-[#6B7280]">Loading available slots...</p>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="py-6 text-center text-[#6B7280] text-xs sm:text-sm bg-[#fbfbfa] rounded-lg p-4 border border-[#D5DbDB]">
                    No slot available for the given date.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold text-[#1A1A1A]">Select Time Slot</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {slots.map((slot) => {
                        const isSelected = selectedSlotId === slot.id;
                        const { classes, badgeText, badgeStyle, dotColor } =
                          getSlotColorClasses(
                            slot.slot_color_code,
                            slot.slot_disabled,
                            isSelected
                          );

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={slot.slot_disabled}
                            onClick={() => setSelectedSlotId(slot.id)}
                            className={`${classes} cursor-pointer`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {/* Radio circle */}
                              <span
                                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 bg-white ${
                                  isSelected ? "border-[#DA7756]" : "border-gray-300"
                                }`}
                              >
                                {isSelected && (
                                  <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                                )}
                              </span>
                              <span className="truncate">{slot.ampm_timing}</span>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${badgeStyle}`}>
                              {badgeText}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Legends Matching Guidelines */}
                    <div className="flex items-center justify-center gap-4 pt-2 text-xs text-[#6B7280] font-medium flex-wrap">
                      <span className="text-[#1A1A1A] font-semibold">Legends:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                        <span>Available</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                        <span>Fast Filling</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                        <span>Not Available</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 4: Consent Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 text-xs text-[#6B7280] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#DA7756] focus:ring-[#DA7756] cursor-pointer"
                  />
                  <span>
                    I confirm my availability for the selected site visit slot and agree to the visit guidelines.
                  </span>
                </label>
              </div>

              {/* Error Message if submit fails */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 p-2.5 rounded-lg text-xs text-red-700 text-center">
                  {submitError}
                </div>
              )}

              {/* Submit / Reschedule Button */}
              <div className="pt-2 flex justify-center">
                <Button
                  type="submit"
                  disabled={
                    !pickedDate ||
                    !selectedSlotId ||
                    !consentChecked ||
                    isSubmitting ||
                    slots.length === 0
                  }
                  className="btn-primary text-xs font-semibold px-8 h-9 shadow-xs cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{isReschedule ? "Rescheduling..." : "Submitting..."}</span>
                    </div>
                  ) : isReschedule ? (
                    "Reschedule"
                  ) : (
                    "Submit Visit"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicSiteScheduleBooking;
