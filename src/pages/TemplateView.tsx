import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Paper, Box, Typography, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Settings } from '@mui/icons-material';
import axios from 'axios';
import { toast, Toaster } from 'sonner';

// Styled Components
const SectionCard = styled(Paper)(({ theme }) => ({
  backgroundColor: 'white',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  borderRadius: '8px',
  overflow: 'hidden',
  marginBottom: '24px',
  border: '1px solid #E5E5E5',
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  backgroundColor: '#F6F4EE',
  padding: '16px 24px',
  borderBottom: '1px solid #D9D9D9',
}));

const SectionBody = styled(Box)(({ theme }) => ({
  backgroundColor: '#FAFAF8',
  padding: '32px 24px',
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#E5E0D3',
}));

const RedIcon = styled(Settings)(({ theme }) => ({
  color: '#C72030',
  fontSize: '24px',
}));

const DetailGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '24px',
  marginBottom: '24px',
}));

const DetailItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}));

const Label = styled(Typography)(({ theme }) => ({
  fontSize: '13px',
  fontWeight: 500,
  color: '#999',
  fontFamily: 'Work Sans, sans-serif',
  textTransform: 'capitalize',
}));

const Value = styled(Typography)(({ theme }) => ({
  fontSize: '14px',
  fontWeight: 500,
  color: '#1A1A1A',
  fontFamily: 'Work Sans, sans-serif',
  wordBreak: 'break-word',
  lineHeight: '1.6',
}));

interface Template {
  id: number;
  title: string;
  description: string;
  active: boolean | null;
  external_url: string | null;
  created_at: string;
  updated_at: string;
  url: string;
}

export default function TemplateView() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTemplateDetails(id);
    }
  }, [id]);

  const fetchTemplateDetails = async (templateId: string) => {
    setLoading(true);
    try {
      const response = await axios.get<Template[]>(
        'https://uat-hi-society.lockated.com/offer_templates.json',
        {
          params: {
            token: 'bfa5004e7b0175622be8f7e69b37d01290b737f82e078414'
          }
        }
      );
      
      // Find the specific template by ID
      const foundTemplate = response.data.find(t => t.id === parseInt(templateId));
      
      if (foundTemplate) {
        setTemplate(foundTemplate);
      } else {
        toast.error('Template not found');
        navigate('/settings/template/list');
      }
    } catch (error) {
      console.error('Error fetching template details:', error);
      toast.error('Failed to load template details');
      navigate('/settings/template/list');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const handleEdit = () => {
    navigate(`/settings/template/edit/${id}`);
  };

  const handleBack = () => {
    navigate('/settings/template/list');
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh' 
      }}>
        <CircularProgress sx={{ color: '#C72030' }} />
      </Box>
    );
  }

  if (!template) {
    return (
      <Box sx={{ p: { xs: 2, sm: 4, lg: 6 } }}>
        <Typography variant="h6" sx={{ fontFamily: 'Work Sans, sans-serif' }}>
          Template not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 4, lg: 6 }, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Toaster position="top-right" richColors closeButton />

      {/* Breadcrumb */}
      <Typography 
        variant="body2" 
        sx={{ mb: 3, color: '#999', fontFamily: 'Work Sans, sans-serif', fontSize: '14px' }}
      >
        Template &gt; Details
      </Typography>

      {/* Template Details Card */}
      <div className="w-full bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 bg-[#F6F4EE] py-3 px-4 border border-[#D9D9D9]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E5E0D3]">
              <Settings sx={{ color: '#C72030', fontSize: '24px' }} />
            </div>
            <h3 className="text-lg font-semibold uppercase text-black">
              Details
            </h3>
          </div>
        </div>

        {/* Body */}
        <div className="bg-[#FAFAF8] border border-t-0 border-[#D9D9D9] px-5 py-4">
          <div className="grid grid-cols-3  gap-y-4 gap-x-8">
            <div className="flex items-start">
              <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                Policy Title
              </div>
              <div className="text-[14px] font-semibold text-gray-900 flex-1">
                {template.title || '-'}
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                Status
              </div>
              <div className={`text-[14px] font-semibold flex-1 ${template.active ? 'text-green-600' : 'text-red-600'}`}>
                {template.active ? 'Active' : 'Inactive'}
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                Policy Description
              </div>
              <div className="text-[14px] font-semibold text-gray-900 flex-1 whitespace-pre-wrap">
                {template.description || '-'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
        <Button
          variant="outline"
          onClick={handleBack}
          className="h-10 px-6 border-gray-300 bg-white hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
        <Button
          onClick={handleEdit}
          className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-10 px-6"
        >
          <Pencil className="w-4 h-4 mr-2" />
          Edit Template
        </Button>
      </Box>
    </Box>
  );
}
