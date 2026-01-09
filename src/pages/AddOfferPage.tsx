import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Edit } from '@mui/icons-material';
import { toast, Toaster } from 'sonner';
import axios from 'axios';
import { getFullUrl } from '@/config/apiConfig';
import {
    Box,
    Typography,
    TextField,
    Paper,
    Stepper,
    Step,
    StepLabel,
    StepConnector,
    Button as MuiButton,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { boxShadow } from 'html2canvas/dist/types/css/property-descriptors/box-shadow';

// Styled Components
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
    color: $active ? '#FFFFFF' : ($completed ? '#fff' : '#333'),
    border: $active || $completed
        ? '2px solid #C72030'
        : '2px solid #E6E6E6',
}));


const CustomStepLabel = styled(StepLabel)(({ theme }) => ({
    '& .MuiStepLabel-label': {
        fontSize: 14,
        fontWeight: 500,
        fontFamily: 'Work Sans, sans-serif',
        padding: '8px 16px',
        borderRadius: 4,
        border: '1px solid #E0E0E0',
        color: '#555',
    },

    '&.Mui-active .MuiStepLabel-label': {
        backgroundColor: '#C72030',
        color: '#fff',
        borderColor: '#C72030',
    },

    '&.Mui-completed .MuiStepLabel-label': {
        backgroundColor: '#fff',
        color: '#C72030',
        borderColor: '#C72030',
    },
}));

const CustomStep = styled(Step)(() => ({
    '& .MuiStepIcon-root': {
        display: 'none', // hides circle numbers (important)
    },
}));


const RedButton = styled(MuiButton)(({ theme }) => ({
    backgroundColor: '#C72030',
    color: 'white',
    borderRadius: 0,
    textTransform: 'none',
    padding: '8px 16px',
    fontFamily: 'Work Sans, sans-serif',
    fontWeight: 500,
    boxShadow: '0 2px 4px rgba(199, 32, 48, 0.2)',
    '&:hover': {
        backgroundColor: '#B8252F',
        boxShadow: '0 4px 8px rgba(199, 32, 48, 0.3)',
    },
}));

const DraftButton = styled(MuiButton)(({ theme }) => ({
    backgroundColor: '#e7e3d9',
    color: '#C72030',
    borderRadius: 0,
    textTransform: 'none',
    padding: '8px 16px',
    fontFamily: 'Work Sans, sans-serif',
    fontWeight: 500,
    '&:hover': {
        backgroundColor: '#d9d5c9',
    },
}));

const SectionCard = styled(Paper)(({ theme }) => ({
    backgroundColor: 'white',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '24px',
    border: '1px solid #E5E5E5',
}));

const SectionBody = styled(Box)(({ theme }) => ({
    backgroundColor: '#FAFAF8',
    padding: '24px',
}));

const SectionHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    backgroundColor: '#F6F4EE',
    padding: '12px 16px',
    border: '1px solid #D9D9D9',
}));

const IconWrapper = styled(Box)(({ theme }) => ({
    width: '40px',
    height: '40px',
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

const fieldStyles = {
    backgroundColor: '#fff',
    borderRadius: '4px',
    '& .MuiOutlinedInput-root': {
        fontSize: '14px',
        '& fieldset': {
            borderColor: '#ddd',
        },
        '&:hover fieldset': {
            borderColor: '#C72030',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#C72030',
        },
    },
    '& .MuiInputLabel-root': {
        fontSize: '14px',
        '&.Mui-focused': {
            color: '#C72030',
        },
    },
    '& .MuiInputBase-input': {
        fontSize: '14px',
        fontFamily: 'Work Sans, sans-serif',
    },
};

interface OfferTemplate {
    id: number;
    title: string;
    description: string;
    active: boolean | null;
    external_url: string | null;
    created_at: string;
    updated_at: string;
    url: string;
}

interface Project {
    id: number;
    name: string;
    published: boolean;
    sfdc_id: string | null;
}

interface OfferFormData {
    offerTitle: string;
    offerDescription: string;
    legalPoliciesTemplate: string;
    bannerImage: File | null;
    applicableProjects: string[];
    startDate: string;
    endDate: string;
    status: string;
    showOnHomePage: boolean;
    featuredOffer: boolean;
}

interface AddOfferPageProps {
    offerId?: string;
}

export default function AddOfferPage({ offerId }: AddOfferPageProps) {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [editingStep, setEditingStep] = useState<number | null>(null);
    const steps = ['Basic Info', 'Media & Display', 'Applicability', 'Validity & Status', 'Visibility'];

    const [formData, setFormData] = useState<OfferFormData>({
        offerTitle: '',
        offerDescription: '',
        legalPoliciesTemplate: '',
        bannerImage: null,
        applicableProjects: [],
        startDate: '',
        endDate: '',
        status: 'Active',
        showOnHomePage: false,
        featuredOffer: false,
    });

    const [uploadedImages, setUploadedImages] = useState<Array<{ id: string; name: string; file: File; preview: string }>>([]);
    const [offerTemplates, setOfferTemplates] = useState<OfferTemplate[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [isEditMode, setIsEditMode] = useState(!!offerId);

    // Fetch offer templates and projects on component mount
    useEffect(() => {
        fetchOfferTemplates();
        fetchProjects();
    }, []);

    // Fetch offer details if editing
    useEffect(() => {
        if (offerId) {
            setIsEditMode(true);
            fetchOfferDetails(offerId);
        }
    }, [offerId]);

    const fetchOfferTemplates = async () => {
        setLoadingTemplates(true);
        try {
            const response = await axios.get<OfferTemplate[]>(
                'https://uat-hi-society.lockated.com/offer_templates.json',
                {
                    params: {
                        token: 'bfa5004e7b0175622be8f7e69b37d01290b737f82e078414'
                    }
                }
            );
            setOfferTemplates(response.data);
        } catch (error) {
            console.error('Error fetching offer templates:', error);
            toast.error('Failed to load offer templates');
        } finally {
            setLoadingTemplates(false);
        }
    };

    const fetchProjects = async () => {
        setLoadingProjects(true);
        try {
            const response = await axios.get(
                'https://uat-hi-society.lockated.com/projects_for_dropdown.json',
                {
                    params: {
                        token: 'bfa5004e7b0175622be8f7e69b37d01290b737f82e078414',
                        'q[society_id_eq]': '3876'
                    }
                }
            );
            setProjects(response.data.projects);
        } catch (error) {
            console.error('Error fetching projects:', error);
            toast.error('Failed to load projects');
        } finally {
            setLoadingProjects(false);
        }
    };

    const fetchOfferDetails = async (id: string) => {
        try {
            const response = await axios.get(
                getFullUrl(`/crm/offers/${id}.json`),
                {
                    params: {
                        token: 'bfa5004e7b0175622be8f7e69b37d01290b737f82e078414'
                    }
                }
            );
            const offer = response.data.offer;
            setFormData({
                offerTitle: offer.title || '',
                offerDescription: offer.description || '',
                legalPoliciesTemplate: offer.offer_template_id?.toString() || '',
                bannerImage: null, // You may want to handle existing images
                applicableProjects: offer.project_ids?.map((id: number) => id.toString()) || [],
                startDate: offer.start_date || '',
                endDate: offer.expiry || '',
                status: offer.active === 1 ? 'Active' : 'Inactive',
                showOnHomePage: !!offer.show_on_home,
                featuredOffer: !!offer.status,
            });
            // Optionally, handle images if needed
        } catch (error) {
            toast.error('Failed to fetch offer details');
        }
    };

    const handleInputChange = (name: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const validateStep = (step: number): boolean => {
        switch (step) {
            case 0: // Basic Info
                if (!formData.offerTitle.trim()) {
                    toast.error('Please enter offer title');
                    return false;
                }
                if (!formData.offerDescription.trim()) {
                    toast.error('Please enter offer description');
                    return false;
                }
                return true;

            case 1: // Media & Display
                // Optional validation
                return true;

            case 2: // Applicability
                if (formData.applicableProjects.length === 0) {
                    toast.error('Please select at least one project');
                    return false;
                }
                return true;

            case 3: // Validity & Status
                if (!formData.startDate) {
                    toast.error('Please select start date');
                    return false;
                }
                if (!formData.endDate) {
                    toast.error('Please select end date');
                    return false;
                }
                if (new Date(formData.endDate) < new Date(formData.startDate)) {
                    toast.error('End date must be after start date');
                    return false;
                }
                return true;

            case 4: // Visibility
                return true;

            default:
                return true;
        }
    };

    const handleNext = () => {
        // Validate current step
        if (!validateStep(activeStep)) {
            return;
        }

        // Mark step as completed and move to next
        if (!completedSteps.includes(activeStep)) {
            setCompletedSteps([...completedSteps, activeStep]);
        }

        if (activeStep < steps.length - 1) {
            setActiveStep(activeStep + 1);
        }
        setEditingStep(null);
    };

    const handleEdit = (step: number) => {
        setEditingStep(step);
        setActiveStep(step);
    };

    const handleSaveDraft = async () => {
        try {
            // TODO: Replace with actual API call
            toast.success('Draft saved successfully!');
        } catch (error) {
            toast.error('Failed to save draft');
        }
    };

    const handleSubmit = async () => {
        // Validate all steps before submission
        for (let i = 0; i < steps.length; i++) {
            if (!validateStep(i)) {
                toast.error(`Please complete step ${i + 1}: ${steps[i]}`);
                setActiveStep(i);
                return;
            }
        }

        // Mark final step as completed
        if (!completedSteps.includes(activeStep)) {
            setCompletedSteps([...completedSteps, activeStep]);
        }

        try {
            const formDataPayload = new FormData();

            // Add project IDs (multiple values)
            formData.applicableProjects.forEach(projectId => {
                formDataPayload.append('project_ids[]', projectId);
            });

            // Add offer details
            formDataPayload.append('offer[title]', formData.offerTitle);
            formDataPayload.append('offer[description]', formData.offerDescription);
            formDataPayload.append('offer[otype]', 'Project');
            formDataPayload.append('offer[otype_id]', '1');
            formDataPayload.append('offer[start_date]', formData.startDate);
            formDataPayload.append('offer[expiry]', formData.endDate);
            formDataPayload.append('offer[active]', formData.status === 'Active' ? '1' : '0');
            formDataPayload.append('offer[status]', formData.featuredOffer ? '1' : '0');

            // Add template ID if selected
            if (formData.legalPoliciesTemplate) {
                formDataPayload.append('offer[offer_template_id]', formData.legalPoliciesTemplate);
            }

            // Add images if uploaded
            if (uploadedImages.length > 0) {
                // For now, use the first image for all ratios
                // You can enhance this to support different ratios
                const firstImage = uploadedImages[0];
                formDataPayload.append('offer[image_1_by_1]', firstImage.file);
                formDataPayload.append('offer[image_16_by_9]', firstImage.file);
                formDataPayload.append('offer[image_3_by_2]', firstImage.file);
                formDataPayload.append('offer[image_9_by_16]', firstImage.file);
            }

            let apiUrl = getFullUrl('/crm/offers.json');
            let method: 'post' | 'put' = 'post';

            if (isEditMode && offerId) {
                apiUrl = getFullUrl(`/crm/offers/${offerId}.json`);
                method = 'put';
            }

            // Make API call
            const response = await axios({
                url: apiUrl,
                method,
                data: formDataPayload,
                params: {
                    token: 'bfa5004e7b0175622be8f7e69b37d01290b737f82e078414'
                },
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success(isEditMode ? 'Offer updated successfully!' : 'Offer created successfully!');

            // Navigate after a short delay to show success message
            setTimeout(() => {
                navigate('/maintenance/offers-list');
            }, 1000);
        } catch (error: any) {
            console.error('Error creating offer:', error);
            const errorMessage = error.response?.data?.message || 'Failed to create offer. Please try again.';
            toast.error(errorMessage);
        }
    };

    const handleCancel = () => {
        navigate('/maintenance/offers-list');
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const preview = URL.createObjectURL(file);
            const newImage = {
                id: Date.now().toString(),
                name: file.name,
                file: file,
                preview: preview,
            };
            setUploadedImages(prev => [...prev, newImage]);
        }
    };

    const handleRemoveImage = (id: string) => {
        setUploadedImages(prev => prev.filter(img => img.id !== id));
    };

    // Render step content
    const renderStepContent = (step: number) => {
        switch (step) {
            case 0: // Basic Info
                return (
                    <SectionCard>
                        <SectionHeader>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <IconWrapper>
                                    <RedIcon />
                                </IconWrapper>
                                <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Work Sans, sans-serif', textTransform: 'uppercase', fontSize: '18px' }}>
                                    Basic Info
                                </Typography>
                            </Box>
                        </SectionHeader>
                        <SectionBody>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                                <TextField
                                    label="Offer Title"
                                    required
                                    value={formData.offerTitle}
                                    onChange={(e) => handleInputChange('offerTitle', e.target.value)}
                                    placeholder="Enter Title"
                                    sx={fieldStyles}
                                    fullWidth
                                />
                                <TextField
                                    label="Offer Description"
                                    required
                                    value={formData.offerDescription}
                                    onChange={(e) => handleInputChange('offerDescription', e.target.value)}
                                    placeholder="Enter Description"
                                    sx={fieldStyles}
                                    fullWidth
                                />
                            </Box>
                            <Box sx={{ mt: 3 }}>
                                <FormControl fullWidth sx={fieldStyles}>
                                    <InputLabel>Legal Policies Template</InputLabel>
                                    <Select
                                        value={formData.legalPoliciesTemplate}
                                        onChange={(e) => handleInputChange('legalPoliciesTemplate', e.target.value)}
                                        label="Legal Policies Template"
                                        disabled={loadingTemplates}
                                    >
                                        <MenuItem value="">Select Policies</MenuItem>
                                        {loadingTemplates ? (
                                            <MenuItem disabled>Loading templates...</MenuItem>
                                        ) : (
                                            offerTemplates.map((template) => (
                                                <MenuItem key={template.id} value={template.id.toString()}>
                                                    {template.title}
                                                </MenuItem>
                                            ))
                                        )}
                                    </Select>
                                </FormControl>
                            </Box>
                        </SectionBody>
                    </SectionCard>
                );

            case 1: // Media & Display
                return (
                    <SectionCard>
                        <SectionHeader>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <IconWrapper>
                                    <RedIcon />
                                </IconWrapper>
                                <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Work Sans, sans-serif', textTransform: 'uppercase', fontSize: '18px' }}>
                                    Media & Display
                                </Typography>
                            </Box>
                        </SectionHeader>
                        <SectionBody>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="body2" sx={{ fontFamily: 'Work Sans, sans-serif', fontWeight: 500 }}>
                                    Offer Banner Image
                                </Typography>
                                <MuiButton
                                    variant="outlined"
                                    component="label"
                                    sx={{
                                        color: '#C72030',
                                        borderColor: '#C72030',
                                        textTransform: 'none',
                                        borderRadius: 0,
                                        fontSize: '14px',
                                        fontFamily: 'Work Sans, sans-serif',
                                        '&:hover': { borderColor: '#B8252F', backgroundColor: '#FFF5F5' }
                                    }}
                                >
                                    Add
                                    <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                                </MuiButton>
                            </Box>

                            {/* Image Table */}
                            <TableContainer sx={{ border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                                <Table>
                                    <TableHead sx={{ backgroundColor: '#e7e3d9' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontSize: '14px', fontWeight: 600, fontFamily: 'Work Sans, sans-serif', color: '#333' }}>
                                                File Name
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '14px', fontWeight: 600, fontFamily: 'Work Sans, sans-serif', color: '#333' }}>
                                                Preview
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '14px', fontWeight: 600, fontFamily: 'Work Sans, sans-serif', color: '#333' }}>
                                                Ratio
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '14px', fontWeight: 600, fontFamily: 'Work Sans, sans-serif', color: '#333' }}>
                                                Action
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {uploadedImages.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#999', fontSize: '14px' }}>
                                                    No images uploaded yet
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            uploadedImages.map((image) => (
                                                <TableRow key={image.id}>
                                                    <TableCell sx={{ fontSize: '14px', color: '#666', fontFamily: 'Work Sans, sans-serif' }}>
                                                        {image.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        <img
                                                            src={image.preview}
                                                            alt={image.name}
                                                            style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: '14px', color: '#666', fontFamily: 'Work Sans, sans-serif' }}>
                                                        16:9
                                                    </TableCell>
                                                    <TableCell>
                                                        <MuiButton
                                                            onClick={() => handleRemoveImage(image.id)}
                                                            sx={{
                                                                color: '#C72030',
                                                                textTransform: 'none',
                                                                fontSize: '13px',
                                                                fontFamily: 'Work Sans, sans-serif',
                                                                p: 0,
                                                                minWidth: 'auto',
                                                                '&:hover': { backgroundColor: '#FFF5F5' }
                                                            }}
                                                        >
                                                            Delete
                                                        </MuiButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </SectionBody>
                    </SectionCard>
                )


            case 2: // Applicability
                return (
                    <SectionCard>
                        <SectionHeader>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', width: '50%' }}>
                                <IconWrapper>
                                    <RedIcon />
                                </IconWrapper>
                                <Typography variant="h6" sx={{ fontWeight: 500, fontFamily: 'Work Sans, sans-serif', textTransform: 'uppercase', fontSize: '13px' }}>
                                    Applicability
                                </Typography>
                            </Box>
                        </SectionHeader>
                        <SectionBody>
                            <FormControl fullWidth sx={fieldStyles}>
                                <InputLabel>Applicable Project(s)</InputLabel>
                                <Select
                                    multiple
                                    value={formData.applicableProjects}
                                    onChange={(e) => handleInputChange('applicableProjects', e.target.value)}
                                    label="Applicable Project(s)"
                                    disabled={loadingProjects}
                                >
                                    {loadingProjects ? (
                                        <MenuItem disabled>Loading projects...</MenuItem>
                                    ) : projects.length === 0 ? (
                                        <MenuItem disabled>No projects available</MenuItem>
                                    ) : (
                                        projects.map((project) => (
                                            <MenuItem key={project.id} value={project.id.toString()}>
                                                {project.name}
                                            </MenuItem>
                                        ))
                                    )}
                                </Select>
                            </FormControl>
                        </SectionBody>
                    </SectionCard>
                );

            case 3: // Validity & Status
                return (
                    <SectionCard>
                        <SectionHeader>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <IconWrapper>
                                    <RedIcon />
                                </IconWrapper>
                                <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Work Sans, sans-serif', textTransform: 'uppercase', fontSize: '18px' }}>
                                    Validity & Status
                                </Typography>
                            </Box>
                        </SectionHeader>
                        <SectionBody>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
                                <TextField
                                    label="Start Date"
                                    type="date"
                                    required
                                    value={formData.startDate}
                                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    placeholder="DD/MM/YYYY"
                                    sx={{ ...fieldStyles, width: '50%' }}
                                    fullWidth
                                />
                                <TextField
                                    label="End Date"
                                    type="date"
                                    required
                                    value={formData.endDate}
                                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    placeholder="DD/MM/YYYY"
                                    sx={{ ...fieldStyles, width: '50%' }}
                                    fullWidth
                                />
                                <FormControl fullWidth sx={fieldStyles}>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={formData.status}
                                        onChange={(e) => handleInputChange('status', e.target.value)}
                                        label="Status"
                                    >
                                        <MenuItem value="Active">Active</MenuItem>
                                        <MenuItem value="Inactive">Inactive</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </SectionBody>
                    </SectionCard>
                );

            case 4: // Visibility
                return (
                    <SectionCard>
                        <SectionHeader>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <IconWrapper>
                                    <RedIcon />
                                </IconWrapper>
                                <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Work Sans, sans-serif', textTransform: 'uppercase', fontSize: '18px' }}>
                                    Visibility
                                </Typography>
                            </Box>
                        </SectionHeader>
                        <SectionBody>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="body1" sx={{ fontWeight: 500, fontFamily: 'Work Sans, sans-serif' }}>
                                            Show on Home Page
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#666', fontSize: '13px' }}>
                                            Display this offer on the home page
                                        </Typography>
                                    </Box>
                                    <Switch
                                        checked={formData.showOnHomePage}
                                        onChange={(e) => handleInputChange('showOnHomePage', e.target.checked)}
                                        sx={{
                                            '& .MuiSwitch-switchBase.Mui-checked': {
                                                color: '#C72030',
                                            },
                                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                backgroundColor: '#C72030',
                                            },
                                        }}
                                    />
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="body1" sx={{ fontWeight: 500, fontFamily: 'Work Sans, sans-serif' }}>
                                            Featured Offer
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#666', fontSize: '13px' }}>
                                            Offer will be display as a pop-up on home screen
                                        </Typography>
                                    </Box>
                                    <Switch
                                        checked={formData.featuredOffer}
                                        onChange={(e) => handleInputChange('featuredOffer', e.target.checked)}
                                        sx={{
                                            '& .MuiSwitch-switchBase.Mui-checked': {
                                                color: '#C72030',
                                            },
                                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                backgroundColor: '#C72030',
                                            },
                                        }}
                                    />
                                </Box>
                            </Box>
                        </SectionBody>
                    </SectionCard>
                );

            default:
                return null;
        }

    };

    return (
        <Box sx={{ p: { xs: 2, sm: 4, lg: 6 }, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <Toaster position="top-right" richColors closeButton />

            {/* Breadcrumb */}
            <Typography variant="body2" sx={{ mb: 3, color: '#666', fontFamily: 'Work Sans, sans-serif' }}>
                Offers &gt; Create
            </Typography>

            {/* Stepper */}
            <Box sx={{ mb: 3 }}>
                <Stepper
                    activeStep={activeStep}
                    connector={<CustomStepConnector />}
                    sx={{
                        '& .MuiStep-root': {
                            padding: 0,
                        },
                    }}
                >
                    {steps.map((label, index) => {
                        const active = index === activeStep;
                        const completed = completedSteps.includes(index);

                        return (
                            <Step key={label}>
                                <StepLabel StepIconComponent={() => null}>
                                    <Box style={{ padding: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)', backgroundColor: '#FFFFFF' }}>
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

            {/* Current Step Content */}
            {renderStepContent(activeStep)}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
                <DraftButton
                    onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
                >
                    {activeStep === steps.length - 1 ? 'Submit' : 'Proceed to save'}
                </DraftButton>
                <DraftButton onClick={handleSaveDraft}>
                    Save to draft
                </DraftButton>
            </Box>

            {/* Progress Indicator */}
            {completedSteps.length > 0 && (
                <Typography
                    variant="body2"
                    sx={{
                        textAlign: 'center',
                        color: '#666',
                        mb: 4,
                        fontFamily: 'Work Sans, sans-serif'
                    }}
                >
                    You've completed {completedSteps.length} out of {steps.length} steps.
                </Typography>
            )}

            {/* Completed Steps Summary */}
            {completedSteps.map((stepIndex) => {
                if (stepIndex === activeStep || editingStep === stepIndex) return null;

                return (
                    <SectionCard key={stepIndex}>
                        <SectionHeader>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <IconWrapper>
                                    <RedIcon />
                                </IconWrapper>
                                <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Work Sans, sans-serif', textTransform: 'uppercase', fontSize: '18px' }}>
                                    {steps[stepIndex]}
                                </Typography>
                            </Box>
                            <MuiButton
                                variant="outlined"
                                startIcon={<Edit />}
                                onClick={() => handleEdit(stepIndex)}
                                sx={{
                                    color: '#C72030',
                                    borderColor: '#C72030',
                                    textTransform: 'none',
                                    borderRadius: 0,
                                    fontSize: '14px',
                                    fontFamily: 'Work Sans, sans-serif',
                                    '&:hover': { borderColor: '#B8252F', backgroundColor: '#FFF5F5' }
                                }}
                            >
                                Edit
                            </MuiButton>
                        </SectionHeader>
                        {/* Show summary of completed step */}
                        <SectionBody>
                            {stepIndex === 0 && (
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                                    <Box>
                                        <Typography variant="body2" sx={{ color: '#999', fontSize: '12px', fontFamily: 'Work Sans, sans-serif' }}>
                                            Offer Title *
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#333', fontSize: '14px', fontFamily: 'Work Sans, sans-serif', mt: 0.5 }}>
                                            {formData.offerTitle}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" sx={{ color: '#999', fontSize: '12px', fontFamily: 'Work Sans, sans-serif' }}>
                                            Offer Description *
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#333', fontSize: '14px', fontFamily: 'Work Sans, sans-serif', mt: 0.5 }}>
                                            {formData.offerDescription}
                                        </Typography>
                                    </Box>
                                    {formData.legalPoliciesTemplate && (
                                        <Box>
                                            <Typography variant="body2" sx={{ color: '#999', fontSize: '12px', fontFamily: 'Work Sans, sans-serif' }}>
                                                Legal Policies Template
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#333', fontSize: '14px', fontFamily: 'Work Sans, sans-serif', mt: 0.5 }}>
                                                {offerTemplates.find(t => t.id.toString() === formData.legalPoliciesTemplate)?.title || formData.legalPoliciesTemplate}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            )}
                            {stepIndex === 1 && uploadedImages.length > 0 && (
                                <Box>
                                    <Typography variant="body2" sx={{ color: '#999', fontSize: '12px', fontFamily: 'Work Sans, sans-serif', mb: 1 }}>
                                        Uploaded Images
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                        {uploadedImages.map((image) => (
                                            <Box key={image.id} sx={{ position: 'relative' }}>
                                                <img
                                                    src={image.preview}
                                                    alt={image.name}
                                                    style={{ width: '100px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }}
                                                />
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            )}
                            {stepIndex === 2 && formData.applicableProjects.length > 0 && (
                                <Box>
                                    <Typography variant="body2" sx={{ color: '#999', fontSize: '12px', fontFamily: 'Work Sans, sans-serif' }}>
                                        Applicable Project(s)
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#333', fontSize: '14px', fontFamily: 'Work Sans, sans-serif', mt: 0.5 }}>
                                        {formData.applicableProjects.join(', ')}
                                    </Typography>
                                </Box>
                            )}
                            {stepIndex === 3 && (
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                                    <Box>
                                        <Typography variant="body2" sx={{ color: '#999', fontSize: '12px', fontFamily: 'Work Sans, sans-serif' }}>
                                            Start Date
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#333', fontSize: '14px', fontFamily: 'Work Sans, sans-serif', mt: 0.5 }}>
                                            {formData.startDate}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" sx={{ color: '#999', fontSize: '12px', fontFamily: 'Work Sans, sans-serif' }}>
                                            End Date
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#333', fontSize: '14px', fontFamily: 'Work Sans, sans-serif', mt: 0.5 }}>
                                            {formData.endDate}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" sx={{ color: '#999', fontSize: '12px', fontFamily: 'Work Sans, sans-serif' }}>
                                            Status
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#333', fontSize: '14px', fontFamily: 'Work Sans, sans-serif', mt: 0.5 }}>
                                            {formData.status}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                            {stepIndex === 4 && (
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                                    <Box>
                                        <Typography variant="body2" sx={{ color: '#999', fontSize: '12px', fontFamily: 'Work Sans, sans-serif' }}>
                                            Show on Home Page
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#333', fontSize: '14px', fontFamily: 'Work Sans, sans-serif', mt: 0.5 }}>
                                            {formData.showOnHomePage ? 'Yes' : 'No'}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" sx={{ color: '#999', fontSize: '12px', fontFamily: 'Work Sans, sans-serif' }}>
                                            Featured Offer
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#333', fontSize: '14px', fontFamily: 'Work Sans, sans-serif', mt: 0.5 }}>
                                            {formData.featuredOffer ? 'Yes' : 'No'}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                        </SectionBody>
                    </SectionCard>
                );
            })}
        </Box>
    );
}
