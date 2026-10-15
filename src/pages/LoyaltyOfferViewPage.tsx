import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFullUrl, API_CONFIG, getAuthHeader } from "@/config/apiConfig";
import axios from "axios";
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
} from "@mui/material";
import { Settings } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { ArrowLeft, ChevronRight } from "lucide-react";

const steps = [
  "Basic Info",
  "Media & Display",
  "Applicability",
  "Coupon",
  "Validity & Status",
  "Visibility",
];

const CustomStepConnector = styled(StepConnector)(() => ({
  top: 20,
  "& .MuiStepConnector-line": {
    borderTop: "1.5px dashed rgba(26, 26, 24, 0.18)",
  },
}));

const StepPill = styled(Box)<{ $active?: boolean; $completed?: boolean }>(
  ({ $active, $completed }) => ({
    height: 36,
    padding: "0 16px",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: "nowrap",
    cursor: "pointer",
    backgroundColor: $active ? "#1A1A18" : "#FFFFFF",
    color: $active
      ? "#FFFFFF"
      : $completed
        ? "#1A1A18"
        : "rgba(26, 26, 24, 0.68)",
    border:
      $active || $completed
        ? "1px solid #1A1A18"
        : "1px solid rgba(26, 26, 24, 0.09)",
  })
);

function formatDate(dateString?: string) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function OfferViewPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState(0);
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchOfferDetails(id);
  }, [id]);

  const fetchOfferDetails = async (offerId: string) => {
    setLoading(true);
    try {
      const token = API_CONFIG.TOKEN || localStorage.getItem("token") || "";
      const response = await axios.get(
        getFullUrl(`/crm/offers/${offerId}.json`),
        {
          params: { token },
          headers: { Authorization: getAuthHeader() },
        }
      );
      // Handle both response.data and response.data.offer structures
      const offerData = response.data.offer || response.data;
      console.log("Fetched offer data:", offerData);
      setOffer(offerData);
    } catch (error) {
      console.error("Error fetching offer details:", error);
      setOffer(null);
    } finally {
      setLoading(false);
    }
  };

  // --- UI helpers for the card/tab content ---
  const getImages = () => [
    {
      label: "1:1",
      data: offer?.image_1_by_1,
    },
    {
      label: "9:16",
      data: offer?.image_9_by_16,
    },
    {
      label: "3:2",
      data: offer?.image_3_by_2,
    },
    {
      label: "16:9",
      data: offer?.image_16_by_9,
    },
  ];

  const getUniqueImages = () => {
    const allImages = getImages();
    const seenFileNames = new Set<string>();
    const uniqueImages: Array<{ label: string; data: any }> = [];

    for (const img of allImages) {
      if (
        img.data &&
        img.data.document_file_name &&
        !seenFileNames.has(img.data.document_file_name)
      ) {
        seenFileNames.add(img.data.document_file_name);
        uniqueImages.push(img);
      }
    }

    return uniqueImages;
  };

  const getOfferStatus = () => {
    if (offer?.active === 1) return "Active";
    if (offer?.active === 0) return "Inactive";
    return "-";
  };

  const getShowOnHome = () => {
    // Check for show_on_home field from API
    if (offer?.show_on_home === true || offer?.show_on_home === 1) return "Yes";
    if (offer?.show_on_home === false || offer?.show_on_home === 0) return "No";
    // If null or undefined, return 'No' as per API data
    return "No";
  };

  const getFeatured = () => {
    // Check for featured field from API
    if (offer?.featured === true || offer?.featured === 1) return "Yes";
    if (offer?.featured === false || offer?.featured === 0) return "No";
    // If null or undefined, return 'No' as per API data
    return "No";
  };

  const getOfferType = () => {
    if (offer?.offer_type) return offer.offer_type;
    return "-";
  };

  const getTemplateTitle = () => {
    if (offer?.offer_template_name) return offer.offer_template_name;
    if (offer?.offer_template?.title) return offer.offer_template.title;
    return "-";
  };

  const getProjectNames = () => {
    // Check for offer_applicable_sites array
    if (
      offer?.offer_applicable_sites &&
      Array.isArray(offer.offer_applicable_sites) &&
      offer.offer_applicable_sites.length > 0
    ) {
      return offer.offer_applicable_sites
        .map((oas: any) => oas.name || `Site ${oas.resource_id}`)
        .join(", ");
    }
    // If offer_applicable_projects is empty array, show appropriate message
    if (
      offer?.offer_applicable_projects &&
      Array.isArray(offer.offer_applicable_projects) &&
      offer.offer_applicable_projects.length === 0
    ) {
      return "No projects assigned";
    }
    return "-";
  };

  // --- Card content for each tab ---
  const renderCardContent = () => {
    if (!offer) return null;
    switch (activeTab) {
      case 0: // Basic Info
        return (
          <div className="w-full bg-white rounded-2xl border border-[rgba(26,26,24,0.09)]">
            <div className="flex items-center justify-between gap-3 px-6 pt-[22px]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex-none rounded-full flex items-center justify-center bg-[#F5F4F0]">
                  <Settings sx={{ color: "#1A1A18", fontSize: "16px" }} />
                </div>
                <h3 className="text-sm font-semibold text-[#1A1A18]">
                  Basic Info
                </h3>
              </div>
            </div>

            <div className="px-6 pt-5 pb-[22px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-5 gap-x-6">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">
                    Offer Title
                  </div>
                  <div className="text-[13.5px] font-medium text-[#1A1A18] break-words">
                    {offer.title || "-"}
                  </div>
                </div>

                {/* <div className="flex flex-col gap-1 min-w-0">
                  <div className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">
                    Legal Policies
                  </div>
                  <div className="text-[13.5px] font-medium text-[#1A1A18] break-words">
                    {offer.offer_template_name || '-'}
                  </div>
                </div> */}

                {/* <div className="flex flex-col gap-1 min-w-0">
                  <div className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">
                    Offer Type
                  </div>
                  <div className="text-[13.5px] font-medium text-[#1A1A18] break-words">
                    {getOfferType()}
                  </div>
                </div> */}

                <div className="flex flex-col gap-1 min-w-0 lg:col-span-2">
                  <div className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">
                    Offer Description
                  </div>
                  <div className="text-[13.5px] font-medium text-[#1A1A18] break-words">
                    {offer.description || "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 1: // Media & Display
        return (
          <div className="w-full bg-white rounded-2xl border border-[rgba(26,26,24,0.09)]">
            <div className="flex items-center justify-between gap-3 px-6 pt-[22px]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex-none rounded-full flex items-center justify-center bg-[#F5F4F0]">
                  <Settings sx={{ color: "#1A1A18", fontSize: "16px" }} />
                </div>
                <h3 className="text-sm font-semibold text-[#1A1A18]">
                  Media & Display
                </h3>
              </div>
            </div>

            <div className="px-6 pt-5 pb-[22px]">
              {/* Offer Banner Image Section */}
              <div className="mb-6">
                <div className="text-[11px] font-medium text-[rgba(26,26,24,0.48)] mb-3">
                  Offer Banner Image
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-[2fr_2fr_1fr_1fr] gap-4 px-3 py-2 bg-[#FAF9F7] border border-[rgba(26,26,24,0.08)] rounded-t-xl">
                  <div className="text-[13.5px] font-medium text-[#1A1A18]">
                    File Name
                  </div>
                  <div className="text-[13.5px] font-medium text-[#1A1A18]">
                    Preview
                  </div>
                  <div className="text-[13.5px] font-medium text-[#1A1A18]">
                    Ratio
                  </div>
                  <div className="text-[13.5px] font-medium text-[#1A1A18]">
                    Action
                  </div>
                </div>

                {/* Table Body */}
                <div className="bg-white border border-t-0 border-[rgba(26,26,24,0.08)] px-3 py-3 rounded-b-xl">
                  {getUniqueImages().length > 0 ? (
                    getUniqueImages().map((img, index) => (
                      <div
                        key={img.data.document_url}
                        className="grid grid-cols-[2fr_2fr_1fr_1fr] gap-4 items-center py-2"
                        style={{
                          borderBottom:
                            index !== getUniqueImages().length - 1
                              ? "1px solid #E5E5E5"
                              : "none",
                        }}
                      >
                        <div className="text-[13.5px] font-medium text-[#1A1A18]">
                          {img.data.document_file_name}
                        </div>
                        <div>
                          <img
                            src={img.data.document_url}
                            alt={img.data.document_file_name}
                            style={{
                              width: 80,
                              height: 80,
                              objectFit: "cover",
                              borderRadius: 8,
                              border: "1px solid #E5E5E5",
                            }}
                          />
                        </div>
                        <div className="text-[13.5px] font-medium text-[#1A1A18]">
                          {img.label}
                        </div>
                        <div>
                          <span className="text-[14px] text-[rgba(26,26,24,0.55)] cursor-pointer">
                            🗑️
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-[rgba(26,26,24,0.48)] py-4 text-[13px]">
                      No images uploaded
                    </div>
                  )}
                </div>
              </div>

              {/* File Upload Section (PDF) */}
              <div>
                <div className="text-[11px] font-medium text-[rgba(26,26,24,0.48)] mb-3">
                  Offer Thumbnail Image
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-[2fr_2fr_1fr_1fr] gap-4 px-3 py-2 bg-[#FAF9F7] border border-[rgba(26,26,24,0.08)] rounded-t-xl">
                  <div className="text-[13.5px] font-medium text-[#1A1A18]">
                    File Name
                  </div>
                  <div className="text-[13.5px] font-medium text-[#1A1A18]">
                    Preview
                  </div>
                  <div className="text-[13.5px] font-medium text-[#1A1A18]">
                    Ratio
                  </div>
                  <div className="text-[13.5px] font-medium text-[#1A1A18]">
                    Action
                  </div>
                </div>

                {/* Table Body */}
                <div className="bg-white border border-t-0 border-[rgba(26,26,24,0.08)] px-3 py-3 rounded-b-xl">
                  {offer?.offer_pdf ? (
                    <div className="grid grid-cols-[2fr_2fr_1fr_1fr] gap-4 items-center py-2">
                      <div className="text-[13.5px] font-medium text-[#1A1A18]">
                        {offer.offer_pdf.document_file_name}
                      </div>
                      <div>
                        <a
                          href={offer.offer_pdf.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[13.5px] font-medium text-[#1A1A18] underline"
                        >
                          View
                        </a>
                      </div>
                      <div className="text-[13.5px] font-medium text-[#1A1A18]">
                        -
                      </div>
                      <div>
                        <span className="text-[14px] text-[rgba(26,26,24,0.55)] cursor-pointer">
                          🗑️
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-[rgba(26,26,24,0.48)] py-4 text-[13px]">
                      No files uploaded
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 2: // Applicability
        return (
          <div className="w-full bg-white rounded-2xl border border-[rgba(26,26,24,0.09)]">
            <div className="flex items-center justify-between gap-3 px-6 pt-[22px]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex-none rounded-full flex items-center justify-center bg-[#F5F4F0]">
                  <Settings sx={{ color: "#1A1A18", fontSize: "16px" }} />
                </div>
                <h3 className="text-sm font-semibold text-[#1A1A18]">
                  Applicability
                </h3>
              </div>
            </div>

            <div className="px-6 pt-5 pb-[22px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-5 gap-x-6">
                <div className="flex flex-col gap-1 min-w-0 lg:col-span-4">
                  <div className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">
                    Applicable Site(s)
                  </div>
                  <div className="text-[13.5px] font-medium text-[#1A1A18] break-words">
                    {getProjectNames()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 3: // Coupon
        return (
          <div className="w-full bg-white rounded-2xl border border-[rgba(26,26,24,0.09)]">
            <div className="flex items-center justify-between gap-3 px-6 pt-[22px]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex-none rounded-full flex items-center justify-center bg-[#F5F4F0]">
                  <Settings sx={{ color: "#1A1A18", fontSize: "16px" }} />
                </div>
                <h3 className="text-sm font-semibold text-[#1A1A18]">Coupon</h3>
              </div>
            </div>
            <div className="px-6 pt-5 pb-[22px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-5 gap-x-6">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">
                    Coupon Code
                  </div>
                  <div className="text-[13.5px] font-medium text-[#1A1A18] break-words">
                    {offer?.coupon_code || "-"}
                  </div>
                </div>
                <div className="flex flex-col gap-1 min-w-0 lg:col-span-3">
                  <div className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">
                    Coupon Code Description
                  </div>
                  <div className="text-[13.5px] font-medium text-[#1A1A18] break-words">
                    {offer?.coupon_code_description || "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 4: // Validity & Status
        return (
          <div className="w-full bg-white rounded-2xl border border-[rgba(26,26,24,0.09)]">
            <div className="flex items-center justify-between gap-3 px-6 pt-[22px]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex-none rounded-full flex items-center justify-center bg-[#F5F4F0]">
                  <Settings sx={{ color: "#1A1A18", fontSize: "16px" }} />
                </div>
                <h3 className="text-sm font-semibold text-[#1A1A18]">
                  Validity & Status
                </h3>
              </div>
            </div>

            <div className="px-6 pt-5 pb-[22px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-5 gap-x-6">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">
                    Start Date
                  </div>
                  <div className="text-[13.5px] font-medium text-[#1A1A18] break-words">
                    {formatDate(offer.start_date)}
                  </div>
                </div>

                <div className="flex flex-col gap-1 min-w-0">
                  <div className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">
                    End Date
                  </div>
                  <div className="text-[13.5px] font-medium text-[#1A1A18] break-words">
                    {formatDate(offer.expiry)}
                  </div>
                </div>

                <div className="flex flex-col gap-1 min-w-0 lg:col-span-2">
                  <div className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">
                    Status
                  </div>
                  <div className="text-[13.5px] font-medium text-[#1A1A18] break-words">
                    {getOfferStatus()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 5: // Visibility
        return (
          <div className="w-full bg-white rounded-2xl border border-[rgba(26,26,24,0.09)]">
            <div className="flex items-center justify-between gap-3 px-6 pt-[22px]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex-none rounded-full flex items-center justify-center bg-[#F5F4F0]">
                  <Settings sx={{ color: "#1A1A18", fontSize: "16px" }} />
                </div>
                <h3 className="text-sm font-semibold text-[#1A1A18]">
                  Visibility
                </h3>
              </div>
            </div>

            <div className="px-6 pt-5 pb-[22px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-5 gap-x-6">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">
                    Show on Home Page
                  </div>
                  <div className="text-[13.5px] font-medium text-[#1A1A18] break-words">
                    {getShowOnHome()}
                  </div>
                </div>

                {/* <div className="flex flex-col gap-1 min-w-0">
                  <div className="text-[11px] font-medium text-[rgba(26,26,24,0.48)]">
                    Featured Offer
                  </div>
                  <div className="text-[13.5px] font-medium text-[#1A1A18] break-words">
                    {getFeatured()}
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="p-6 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A1A18] mx-auto mb-4"></div>
          <p>Loading offer details...</p>
        </div>
      </div>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 4 },
        backgroundColor: "#FFFFFF",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div className="mb-[22px]">
        <div className="flex items-center gap-2 text-[13px] font-medium mb-3 text-[rgba(26,26,24,0.48)]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#F5F4F0] transition-colors"
            aria-label="Back to Offers List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span>Offers</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-[#1A1A18]">Details</span>
        </div>
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em] text-[#1A1A18]">
          {offer?.title || "Offer Details"}
        </h1>
      </div>
      <Box sx={{ mb: 3 }}>
        <Stepper
          activeStep={activeTab}
          connector={<CustomStepConnector />}
          sx={{ "& .MuiStep-root": { padding: 0 } }}
        >
          {steps.map((label, index) => {
            const active = index === activeTab;
            const completed = false;
            return (
              <Step key={label} onClick={() => setActiveTab(index)}>
                <StepLabel StepIconComponent={() => null}>
                  <Box>
                    <StepPill $active={active} $completed={completed}>
                      {index + 1}. {label}
                    </StepPill>
                  </Box>
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      </Box>
      {renderCardContent()}
    </Box>
  );
}
