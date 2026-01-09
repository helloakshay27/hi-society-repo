import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getFullUrl } from '@/config/apiConfig';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Settings } from '@mui/icons-material';

// Styled components for card and tab UI
const IconWrapper = styled(Box)(() => ({
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#E5E0D3',
}));

const RedIcon = styled(Settings)(() => ({
  color: '#C72030',
  fontSize: '24px',
}));

const CardHeader = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  background: '#FAF8F2',
  borderBottom: '1px solid #E5E5E5',
  padding: '24px 32px',
}));

const CardBody = styled(Box)(() => ({
  background: '#FAFBFB',
  padding: '32px',
  borderRadius: '0 0 8px 8px',
}));

const InfoRow = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  padding: '24px 0',
  borderBottom: '1px solid #F2F2F2',
  '&:last-child': { borderBottom: 'none' },
}));

const InfoLabel = styled(Typography)(() => ({
  flex: 1,
  color: '#A3A3A3',
  fontWeight: 400,
  fontSize: 18,
}));

const InfoValue = styled(Typography)(() => ({
  flex: 2,
  color: '#222',
  fontWeight: 700,
  fontSize: 18,
}));

const steps = [
  'Basic Info',
  'Media & Display',
  'Applicability',
  'Validity & Status',
  'Visibility',
];

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
      const response = await axios.get(
        getFullUrl(`/crm/offers/${offerId}.json`),
        {
          params: {
            token: 'bfa5004e7b0175622be8f7e69b37d01290b737f82e078414'
          }
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

  const getTemplateTitle = () => {
    if (offer?.offer_template_name) return offer.offer_template_name;
    if (offer?.offer_template?.title) return offer.offer_template.title;
    return '-';
  };

  const getProjectNames = () => {
    // Check for offer_applicable_projects array
    if (offer?.offer_applicable_projects && Array.isArray(offer.offer_applicable_projects) && offer.offer_applicable_projects.length > 0) {
      return offer.offer_applicable_projects.map((p: any) => p.name || p).join(', ');
    }
    // Check for projects array
    if (offer?.projects && Array.isArray(offer.projects) && offer.projects.length > 0) {
      return offer.projects.map((p: any) => p.name || p).join(', ');
    }
    // Check for project_ids array
    if (offer?.project_ids && Array.isArray(offer.project_ids) && offer.project_ids.length > 0) {
      return offer.project_ids.join(', ');
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
          <Paper sx={{ borderRadius: 2, mb: 3, border: '1px solid #E5E5E5', overflow: 'hidden' }}>
            <CardHeader>
              <IconWrapper>
                <RedIcon />
              </IconWrapper>
              <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'Work Sans, sans-serif' }}>
                Basic Info
              </Typography>
            </CardHeader>
            <CardBody>
              <InfoRow>
                <InfoLabel>Offer Title</InfoLabel>
                <InfoValue>{offer.title || '-'}</InfoValue>
                <InfoLabel>Legal Policies</InfoLabel>
                <InfoValue>
                  {offer.offer_template_name || '-'}
                </InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Offer Description</InfoLabel>
                <InfoValue sx={{ flex: 3 }}>{offer.description || '-'}</InfoValue>
              </InfoRow>
            </CardBody>
          </Paper>
        );
      case 1: // Media & Display
        return (
          <Paper sx={{ borderRadius: 2, mb: 3, border: '1px solid #E5E5E5', overflow: 'hidden' }}>
            <CardHeader>
              <IconWrapper>
                <RedIcon />
              </IconWrapper>
              <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'Work Sans, sans-serif' }}>
                Media & Display
              </Typography>
            </CardHeader>
            <CardBody>
              <Typography sx={{ fontWeight: 600, mb: 3, fontSize: 18, color: '#222' }}>
                Offer Banner Image
              </Typography>
              
              {/* Table Header */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: '2fr 2fr 1fr 1fr',
                gap: 2,
                px: 3,
                py: 2,
                background: '#F3EFE7',
                borderRadius: '8px 8px 0 0',
                mb: 0
              }}>
                <Typography sx={{ fontWeight: 600, fontSize: 16, color: '#222' }}>File Name</Typography>
                <Typography sx={{ fontWeight: 600, fontSize: 16, color: '#222' }}>Preview</Typography>
                <Typography sx={{ fontWeight: 600, fontSize: 16, color: '#222' }}>Ratio</Typography>
                <Typography sx={{ fontWeight: 600, fontSize: 16, color: '#222' }}>Action</Typography>
              </Box>

              {/* Table Body */}
              <Box sx={{ background: '#F7F8F9', borderRadius: '0 0 8px 8px', p: 3 }}>
                {getImages().some(img => img.data && img.data.document_file_name) ? (
                  getImages().map((img, index) =>
                    img.data && img.data.document_file_name ? (
                      <Box 
                        key={img.label} 
                        sx={{ 
                          display: 'grid', 
                          gridTemplateColumns: '2fr 2fr 1fr 1fr',
                          gap: 2,
                          alignItems: 'center',
                          py: 2,
                          borderBottom: index !== getImages().filter(i => i.data && i.data.document_file_name).length - 1 ? '1px solid #E5E5E5' : 'none'
                        }}
                      >
                        <Typography sx={{ fontSize: 16, color: '#222' }}>
                          {img.data.document_file_name}
                        </Typography>
                        <Box>
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
                        </Box>
                        <Typography sx={{ fontSize: 16, color: '#222' }}>
                          NA
                        </Typography>
                        <Box>
                          <Typography sx={{ fontSize: 16, color: '#C72030', cursor: 'pointer' }}>🗑️</Typography>
                        </Box>
                      </Box>
                    ) : null
                  )
                ) : (
                  <Typography sx={{ textAlign: 'center', color: '#A3A3A3', py: 4 }}>
                    No images uploaded
                  </Typography>
                )}
              </Box>
            </CardBody>
          </Paper>
        );
      case 2: // Applicability
        return (
          <Paper sx={{ borderRadius: 2, mb: 3, border: '1px solid #E5E5E5', overflow: 'hidden' }}>
            <CardHeader>
              <IconWrapper>
                <RedIcon />
              </IconWrapper>
              <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'Work Sans, sans-serif' }}>
                Applicability
              </Typography>
            </CardHeader>
            <CardBody>
              <InfoRow>
                <InfoLabel>Applicable Project(s)</InfoLabel>
                <InfoValue sx={{ flex: 3 }}>{getProjectNames()}</InfoValue>
              </InfoRow>
            </CardBody>
          </Paper>
        );
      case 3: // Validity & Status
        return (
          <Paper sx={{ borderRadius: 2, mb: 3, border: '1px solid #E5E5E5', overflow: 'hidden' }}>
            <CardHeader>
              <IconWrapper>
                <RedIcon />
              </IconWrapper>
              <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'Work Sans, sans-serif' }}>
                Validity & Status
              </Typography>
            </CardHeader>
            <CardBody>
              <InfoRow>
                <InfoLabel>Start Date</InfoLabel>
                <InfoValue>{formatDate(offer.start_date)}</InfoValue>
                <InfoLabel>End Date</InfoLabel>
                <InfoValue>{formatDate(offer.expiry)}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Status</InfoLabel>
                <InfoValue sx={{ flex: 3 }}>{getOfferStatus()}</InfoValue>
              </InfoRow>
            </CardBody>
          </Paper>
        );
      case 4: // Visibility
        return (
          <Paper sx={{ borderRadius: 2, mb: 3, border: '1px solid #E5E5E5', overflow: 'hidden' }}>
            <CardHeader>
              <IconWrapper>
                <RedIcon />
              </IconWrapper>
              <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'Work Sans, sans-serif' }}>
                Visibility
              </Typography>
            </CardHeader>
            <CardBody>
              <InfoRow>
                <InfoLabel>Show on Home Page</InfoLabel>
                <InfoValue>{getShowOnHome()}</InfoValue>
                <InfoLabel>Featured Offer</InfoLabel>
                <InfoValue>{getFeatured()}</InfoValue>
              </InfoRow>
            </CardBody>
          </Paper>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 4, lg: 6 }, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Typography variant="body2" sx={{ mb: 3, color: '#666', fontFamily: 'Work Sans, sans-serif' }}>
        Offer &gt; Details
      </Typography>
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="fullWidth"
          sx={{
            background: '#fff',
            borderRadius: '8px 8px 0 0',
            border: '1px solid #E5E5E5',
            minHeight: 56,
            mb: 0,
            '& .MuiTabs-indicator': {
              backgroundColor: '#C72030',
              height: 3,
            },
          }}
        >
          {steps.map((label, idx) => (
            <Tab
              key={label}
              label={label}
              sx={{
                fontFamily: 'Work Sans, sans-serif',
                fontWeight: 600,
                fontSize: 18,
                color: activeTab === idx ? '#222' : '#222',
                textTransform: 'none',
                minHeight: 56,
                px: 0,
                background: activeTab === idx ? '#F6F4EE' : '#fff',
                borderRight: idx !== steps.length - 1 ? '1px solid #F6F4EE' : 'none',
                '&.Mui-selected': {
                  color: '#222',
                  background: '#F6F4EE',
                },
              }}
            />
          ))}
        </Tabs>
      </Box>
      {loading ? (
        <Typography sx={{ textAlign: 'center', mt: 6 }}>Loading...</Typography>
      ) : (
        renderCardContent()
      )}
    </Box>
  );
}
