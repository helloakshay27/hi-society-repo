import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFullUrl, API_CONFIG, getAuthHeader } from '@/config/apiConfig';
import axios from 'axios';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
} from '@mui/material';
import { Settings } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { ArrowLeft } from 'lucide-react';

const steps = [
  'Basic Info',
  'Media & Display',
  'Applicability',
  'Validity & Status',
  'Visibility',
];

const CustomStepConnector = styled(StepConnector)(() => ({
  top: 20,
  '& .MuiStepConnector-line': {
    borderTop: '2px dotted #E6E6E6',
  },
}));

const StepPill = styled(Box)<{ $active?: boolean; $completed?: boolean }>(({ $active, $completed }) => ({
  height: 40,
  padding: '0 20px',
  borderRadius: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 14,
  fontWeight: 500,
  fontFamily: 'Work Sans, sans-serif',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  backgroundColor: $active || $completed ? '#C72030' : '#FFFFFF',
  color: $active ? '#FFFFFF' : $completed ? '#fff' : '#333',
  border: $active || $completed ? '2px solid #C72030' : '2px solid #E6E6E6',
}));

function formatDate(dateString?: string) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
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
      const token = API_CONFIG.TOKEN || localStorage.getItem('token') || '';
      const response = await axios.get(
        getFullUrl(`/crm/offers/${offerId}.json`),
        {
          params: { token },
          headers: { Authorization: getAuthHeader() },
        }
      );
      // Handle both response.data and response.data.offer structures
      const offerData = response.data.offer || response.data;
      console.log('Fetched offer data:', offerData);
      setOffer(offerData);
    } catch (error) {
      console.error('Error fetching offer details:', error);
      setOffer(null);
    } finally {
      setLoading(false);
    }
  };

  // --- UI helpers for the card/tab content ---
  const getImages = () => [
    {
      label: '1:1',
      data: offer?.image_1_by_1,
    },
    {
      label: '9:16',
      data: offer?.image_9_by_16,
    },
    {
      label: '3:2',
      data: offer?.image_3_by_2,
    },
    {
      label: '16:9',
      data: offer?.image_16_by_9,
    },
  ];

  const getUniqueImages = () => {
    const allImages = getImages();
    const seenFileNames = new Set<string>();
    const uniqueImages: Array<{ label: string; data: any }> = [];

    for (const img of allImages) {
      if (img.data && img.data.document_file_name && !seenFileNames.has(img.data.document_file_name)) {
        seenFileNames.add(img.data.document_file_name);
        uniqueImages.push(img);
      }
    }

    return uniqueImages;
  };

  const getOfferStatus = () => {
    if (offer?.active === 1) return 'Active';
    if (offer?.active === 0) return 'Inactive';
    return '-';
  };

  const getShowOnHome = () => {
    // Check for show_on_home field from API
    if (offer?.show_on_home === true || offer?.show_on_home === 1) return 'Yes';
    if (offer?.show_on_home === false || offer?.show_on_home === 0) return 'No';
    // If null or undefined, return 'No' as per API data
    return 'No';
  };

  const getFeatured = () => {
    // Check for featured field from API
    if (offer?.featured === true || offer?.featured === 1) return 'Yes';
    if (offer?.featured === false || offer?.featured === 0) return 'No';
    // If null or undefined, return 'No' as per API data
    return 'No';
  };

  const getOfferType = () => {
    if (offer?.offer_type) return offer.offer_type;
    return '-';
  };

  const getTemplateTitle = () => {
    if (offer?.offer_template_name) return offer.offer_template_name;
    if (offer?.offer_template?.title) return offer.offer_template.title;
    return '-';
  };

  const getProjectNames = () => {
    // Check for offer_applicable_sites array
    if (offer?.offer_applicable_sites && Array.isArray(offer.offer_applicable_sites) && offer.offer_applicable_sites.length > 0) {
      return offer.offer_applicable_sites.map((oas: any) => oas.name || `Site ${oas.resource_id}`).join(', ');
    }
    // If offer_applicable_projects is empty array, show appropriate message
    if (offer?.offer_applicable_projects && Array.isArray(offer.offer_applicable_projects) && offer.offer_applicable_projects.length === 0) {
      return 'No projects assigned';
    }
    return '-';
  };

  // --- Card content for each tab ---
  const renderCardContent = () => {
    if (!offer) return null;
    switch (activeTab) {
      case 0: // Basic Info
        return (
          <div className="w-full bg-white rounded-lg shadow-sm border">
            <div className="flex items-center justify-between gap-3 bg-[#F6F4EE] py-3 px-4 border border-[#D9D9D9]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E5E0D3]">
                  <Settings sx={{ color: '#C72030', fontSize: '24px' }} />
                </div>
                <h3 className="text-lg font-semibold uppercase text-black">
                  Basic Info
                </h3>
              </div>
            </div>

            <div className="bg-[#FBFBFA] border border-t-0 border-[#D9D9D9] px-5 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-8">
                <div className="flex items-start">
                  <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                    Offer Title
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {offer.title || '-'}
                  </div>
                </div>

                {/* <div className="flex items-start">
                  <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                    Legal Policies
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {offer.offer_template_name || '-'}
                  </div>
                </div> */}

                {/* <div className="flex items-start">
                  <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                    Offer Type
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {getOfferType()}
                  </div>
                </div> */}

                <div className="flex items-start lg:col-span-2">
                  <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                    Offer Description
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {offer.description || '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 1: // Media & Display
        return (
          <div className="w-full bg-white rounded-lg shadow-sm border">
            <div className="flex items-center justify-between gap-3 bg-[#F6F4EE] py-3 px-4 border border-[#D9D9D9]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E5E0D3]">
                  <Settings sx={{ color: '#C72030', fontSize: '24px' }} />
                </div>
                <h3 className="text-lg font-semibold uppercase text-black">
                  Media & Display
                </h3>
              </div>
            </div>

            <div className="bg-[#FBFBFA] border border-t-0 border-[#D9D9D9] px-5 py-4">
              {/* Offer Banner Image Section */}
              <div className="mb-6">
                <div className="text-[14px] font-medium text-gray-700 mb-3">
                  Offer Banner Image
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-[2fr_2fr_1fr_1fr] gap-4 px-3 py-2 bg-[#F3EFE7] rounded-t-lg">
                  <div className="text-[14px] font-semibold text-gray-900">File Name</div>
                  <div className="text-[14px] font-semibold text-gray-900">Preview</div>
                  <div className="text-[14px] font-semibold text-gray-900">Ratio</div>
                  <div className="text-[14px] font-semibold text-gray-900">Action</div>
                </div>

                {/* Table Body */}
                <div className="bg-[#F7F8F9] px-3 py-3 rounded-b-lg">
                  {getUniqueImages().length > 0 ? (
                    getUniqueImages().map((img, index) => (
                      <div
                        key={img.data.document_url}
                        className="grid grid-cols-[2fr_2fr_1fr_1fr] gap-4 items-center py-2"
                        style={{
                          borderBottom: index !== getUniqueImages().length - 1 ? '1px solid #E5E5E5' : 'none'
                        }}
                      >
                        <div className="text-[14px] text-gray-900">
                          {img.data.document_file_name}
                        </div>
                        <div>
                          <img
                            src={img.data.document_url}
                            alt={img.data.document_file_name}
                            style={{
                              width: 80,
                              height: 80,
                              objectFit: 'cover',
                              borderRadius: 8,
                              border: '1px solid #E5E5E5'
                            }}
                          />
                        </div>
                        <div className="text-[14px] text-gray-900">
                          {img.label}
                        </div>
                        <div>
                          <span className="text-[14px] text-[#C72030] cursor-pointer">🗑️</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 py-4 text-[14px]">
                      No images uploaded
                    </div>
                  )}
                </div>
              </div>

              {/* File Upload Section (PDF) */}
              <div>
                <div className="text-[14px] font-medium text-gray-700 mb-3">
                  Offer Thumbnail Image
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-[2fr_2fr_1fr_1fr] gap-4 px-3 py-2 bg-[#F3EFE7] rounded-t-lg">
                  <div className="text-[14px] font-semibold text-gray-900">File Name</div>
                  <div className="text-[14px] font-semibold text-gray-900">Preview</div>
                  <div className="text-[14px] font-semibold text-gray-900">Ratio</div>
                  <div className="text-[14px] font-semibold text-gray-900">Action</div>
                </div>

                {/* Table Body */}
                <div className="bg-[#F7F8F9] px-3 py-3 rounded-b-lg">
                  {offer?.offer_pdf ? (
                    <div className="grid grid-cols-[2fr_2fr_1fr_1fr] gap-4 items-center py-2">
                      <div className="text-[14px] text-gray-900">
                        {offer.offer_pdf.document_file_name}
                      </div>
                      <div>
                        <a
                          href={offer.offer_pdf.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[14px] text-[#C72030] underline"
                        >
                          View
                        </a>
                      </div>
                      <div className="text-[14px] text-gray-900">
                        -
                      </div>
                      <div>
                        <span className="text-[14px] text-[#C72030] cursor-pointer">🗑️</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-4 text-[14px]">
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
          <div className="w-full bg-white rounded-lg shadow-sm border">
            <div className="flex items-center justify-between gap-3 bg-[#F6F4EE] py-3 px-4 border border-[#D9D9D9]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E5E0D3]">
                  <Settings sx={{ color: '#C72030', fontSize: '24px' }} />
                </div>
                <h3 className="text-lg font-semibold uppercase text-black">
                  Applicability
                </h3>
              </div>
            </div>

            <div className="bg-[#FBFBFA] border border-t-0 border-[#D9D9D9] px-5 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-8">
                <div className="flex items-start lg:col-span-4">
                  <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                    Applicable Site(s)
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {getProjectNames()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 3: // Validity & Status
        return (
          <div className="w-full bg-white rounded-lg shadow-sm border">
            <div className="flex items-center justify-between gap-3 bg-[#F6F4EE] py-3 px-4 border border-[#D9D9D9]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E5E0D3]">
                  <Settings sx={{ color: '#C72030', fontSize: '24px' }} />
                </div>
                <h3 className="text-lg font-semibold uppercase text-black">
                  Validity & Status
                </h3>
              </div>
            </div>

            <div className="bg-[#FBFBFA] border border-t-0 border-[#D9D9D9] px-5 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-8">
                <div className="flex items-start">
                  <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                    Start Date
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {formatDate(offer.start_date)}
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                    End Date
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {formatDate(offer.expiry)}
                  </div>
                </div>

                <div className="flex items-start lg:col-span-2">
                  <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                    Status
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {getOfferStatus()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 4: // Visibility
        return (
          <div className="w-full bg-white rounded-lg shadow-sm border">
            <div className="flex items-center justify-between gap-3 bg-[#F6F4EE] py-3 px-4 border border-[#D9D9D9]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E5E0D3]">
                  <Settings sx={{ color: '#C72030', fontSize: '24px' }} />
                </div>
                <h3 className="text-lg font-semibold uppercase text-black">
                  Visibility
                </h3>
              </div>
            </div>

            <div className="bg-[#FBFBFA] border border-t-0 border-[#D9D9D9] px-5 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-8">
                <div className="flex items-start">
                  <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                    Show on Home Page
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {getShowOnHome()}
                  </div>
                </div>

                {/* <div className="flex items-start">
                  <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                    Featured Offer
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
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

  return (
    <Box sx={{ p: { xs: 2, sm: 4, lg: 6 }, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Back Navigation */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors mr-2"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span>Back to Offers List</span>
        </div>
      </div>

      <Typography variant="body2" sx={{ mb: 3, color: '#666', fontFamily: 'Work Sans, sans-serif' }}>
        Offer &gt; Details
      </Typography>
      <Box sx={{ mb: 3 }}>
        <Stepper
          activeStep={activeTab}
          connector={<CustomStepConnector />}
          sx={{ '& .MuiStep-root': { padding: 0 } }}
        >
          {steps.map((label, index) => {
            const active = index === activeTab;
            const completed = false;
            return (
              <Step key={label} onClick={() => setActiveTab(index)}>
                <StepLabel StepIconComponent={() => null}>
                  <Box
                    style={{ padding: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', backgroundColor: '#FFFFFF' }}
                  >
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
      {loading ? (
        <Typography sx={{ textAlign: 'center', mt: 6 }}>Loading...</Typography>
      ) : (
        renderCardContent()
      )}
    </Box>
  );
}
