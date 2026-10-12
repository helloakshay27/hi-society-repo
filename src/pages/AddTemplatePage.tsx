import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import {
    Box,
    Typography,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';
import axios from 'axios';
import { getFullUrl } from '@/config/apiConfig';
import { ArrowLeft, FileText } from 'lucide-react';

const fieldStyles = {
    backgroundColor: '#fff',
    borderRadius: '4px',
    '& .MuiOutlinedInput-root': {
        fontSize: '14px',
        '& fieldset': {
            borderColor: '#ddd',
        },
        '&:hover fieldset': {
            borderColor: '#1A1A18',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#1A1A18',
        },
    },
    '& .MuiInputLabel-root': {
        fontSize: '14px',
        '&.Mui-focused': {
            color: '#1A1A18',
        },
    },
    '& .MuiFormLabel-asterisk': {
        color: '#1A1A18',
    },
    '& .MuiInputBase-input': {
        fontSize: '14px',
        fontFamily: 'Work Sans, sans-serif',
    },
};

interface TemplateFormData {
    title: string;
    description: string;
    externalUrl: string;
    status: string;
}

export default function AddTemplatePage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const [formData, setFormData] = useState<TemplateFormData>({
        title: '',
        description: '',
        externalUrl: '',
        status: 'Active',
    });
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEditMode) {
            fetchTemplateDetails();
        }
    }, [id]);

    const fetchTemplateDetails = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                getFullUrl(`/offer_templates/${id}.json`),
                {
                    params: {
                        token: 'bfa5004e7b0175622be8f7e69b37d01290b737f82e078414'
                    }
                }
            );
            const template = response.data;
            setFormData({
                title: template.title || '',
                description: template.description || '',
                externalUrl: template.external_url || '',
                status: template.active === null || template.active ? 'Active' : 'Inactive',
            });
        } catch (error) {
            console.error('Error fetching template:', error);
            toast.error('Failed to load template details');
            navigate('/settings/template-list');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (name: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const validateForm = (): boolean => {
        if (!formData.title.trim()) {
            toast.error('Please enter template title');
            return false;
        }
        if (!formData.description.trim() && !formData.externalUrl.trim()) {
            toast.error('Please enter either description or external URL');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                offer_template: {
                    title: formData.title,
                    description: formData.description || null,
                    external_url: formData.externalUrl || null,
                }
            };

            if (isEditMode) {
                await axios.put(
                    getFullUrl(`/offer_templates/${id}.json`),
                    payload,
                    {
                        params: {
                            token: 'bfa5004e7b0175622be8f7e69b37d01290b737f82e078414'
                        }
                    }
                );
                toast.success('Template updated successfully!');
            } else {
                await axios.post(
                    getFullUrl('/offer_templates.json'),
                    payload,
                    {
                        params: {
                            token: 'bfa5004e7b0175622be8f7e69b37d01290b737f82e078414'
                        }
                    }
                );
                toast.success('Template created successfully!');
            }

            setTimeout(() => {
                navigate('/settings/template-list');
            }, 1000);
        } catch (error) {
            console.error('Error saving template:', error);
            toast.error(`Failed to ${isEditMode ? 'update' : 'create'} template. Please try again.`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/settings/template-list');
    };

    if (loading) {
        return (
            <Box sx={{ p: { xs: 2, sm: 4, lg: 6 }, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Typography>Loading template...</Typography>
            </Box>
        );
    }

    return (
        <div className="p-6 bg-[#FDFDFB] min-h-screen">
            <Toaster position="top-right" richColors closeButton />

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center text-sm text-gray-600 mb-2">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors mr-2"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <span>Template</span>
                    <span className="mx-2">{">"}</span>
                    <span className="text-gray-900 font-medium">{isEditMode ? 'Edit' : 'Create'}</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{isEditMode ? 'Edit Template' : 'Create Template'}</h1>
            </div>

            <div className="space-y-6">
                {/* Template Form */}
                <div className="bg-white rounded-2xl border border-[rgba(26,26,24,.09)] overflow-hidden">
                    <div className="px-6 pt-[22px]">
                        <h2 className="text-sm font-semibold leading-[1.4] text-[#1A1A18] flex items-center">
                            <span className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#F5F4F0' }}>
                                <FileText size={14} color="#1A1A18" />
                            </span>
                            Template Details
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                            <TextField
                                label="Title"
                                required
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                placeholder="Enter Title"
                                sx={fieldStyles}
                                fullWidth
                            />
                            <FormControl fullWidth sx={fieldStyles}>
                                <InputLabel id="status-label">Status</InputLabel>
                                <Select
                                    labelId="status-label"
                                    value={formData.status}
                                    label="Status"
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                >
                                    <MenuItem value="Active">Active</MenuItem>
                                    <MenuItem value="Inactive">Inactive</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        <div className="relative pt-2">
                            <label
                                htmlFor="template-description"
                                className="absolute top-0 left-3 bg-white px-1 text-xs text-[rgba(0,0,0,0.6)]"
                            >
                                Description{!formData.externalUrl && <span className="text-[#1A1A18]"> *</span>}
                            </label>
                            <textarea
                                id="template-description"
                                placeholder="Enter Description"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                rows={6}
                                className="block w-full px-[14px] py-4 text-sm border border-[#ddd] rounded hover:border-[#1A1A18] focus:outline-none focus:border-[#1A1A18] resize-y"
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="h-px flex-1 bg-[rgba(26,26,24,.09)]" />
                            <span className="text-sm text-gray-500">Or</span>
                            <div className="h-px flex-1 bg-[rgba(26,26,24,.09)]" />
                        </div>

                        <TextField
                            label="External URL"
                            value={formData.externalUrl}
                            onChange={(e) => handleInputChange('externalUrl', e.target.value)}
                            placeholder="Enter URL"
                            sx={fieldStyles}
                            fullWidth
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pb-8">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={submitting}
                        className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[rgba(26,26,24,.08)] bg-white px-[22px] text-[13px] font-semibold text-[rgba(26,26,24,.68)] transition-all hover:border-[rgba(26,26,24,.28)] hover:text-[#1A1A18] disabled:opacity-60"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[#1A1A18] bg-[#1A1A18] px-[22px] text-[13px] font-semibold text-white transition-colors hover:bg-[#12100E] disabled:opacity-60"
                    >
                        {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
            </div>
        </div>
    );
}