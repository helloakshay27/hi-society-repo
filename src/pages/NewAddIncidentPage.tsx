import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem, Checkbox, FormControlLabel } from '@mui/material';
import { Heading } from '@/components/ui/heading';

const fieldStyles = {
    height: {
        xs: 28,
        sm: 36,
        md: 45
    },
    '& .MuiInputBase-input, & .MuiSelect-select': {
        padding: {
            xs: '8px',
            sm: '10px',
            md: '12px'
        }
    },
    '& .MuiOutlinedInput-root': {
        borderRadius: '8px',
        backgroundColor: 'white',
        '& fieldset': {
            borderColor: '#e5e7eb',
        },
        '&:hover fieldset': {
            borderColor: '#9ca3af',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#C72030',
        },
    },
    '& .MuiInputLabel-root': {
        color: '#6b7280',
        '&.Mui-focused': {
            color: '#C72030',
        },
    },
};

const menuProps = {
    PaperProps: {
        style: {
            maxHeight: 300,
            zIndex: 9999,
            backgroundColor: 'white',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
    },
    MenuListProps: {
        style: {
            padding: 0,
        },
    },
    anchorOrigin: {
        vertical: 'bottom' as const,
        horizontal: 'left' as const,
    },
    transformOrigin: {
        vertical: 'top' as const,
        horizontal: 'left' as const,
    },
};

// ---------------------------------------------------------------------------
// STATIC OPTION LISTS
// Per confirmation: Property damage category, Whether damaged was recovered,
// Insured by, and Primary Root Cause Category are static (hardcoded) for now,
// not fetched from the incidence_tags API. Update these arrays whenever the
// business finalizes the real option list.
// ---------------------------------------------------------------------------
const PROPERTY_DAMAGE_CATEGORY_OPTIONS = [
    'Carpark/carpark systems',
    'Electrical fittings',
    'Furniture & fixtures',
    'Structural damage',
    'Plumbing/Water systems',
    'Landscaping',
    'Other',
];

const DAMAGE_RECOVERED_OPTIONS = [
    'Recovered',
    'Partially Recovered',
    'Not Recovered',
];

const INSURED_BY_OPTIONS = [
    'Building insurance',
    'Personal insurance',
    'Not insured',
    'Other',
];

const ROOT_CAUSE_CATEGORY_OPTIONS = [
    'Material Quality',
    'Human Error',
    'Equipment Failure',
    'Process Failure',
    'External Factor',
    'Other',
];

// Helper function to get current date/time values as strings
const getCurrentDateTime = () => {
    const now = new Date();
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return {
        year: now.getFullYear().toString(),
        month: monthNames[now.getMonth()],
        day: now.getDate().toString(),
        hour: now.getHours().toString(),
        minute: now.getMinutes().toString()
    };
};

export const NewAddIncidentPage = () => {
    const navigate = useNavigate();
    const currentDateTime = getCurrentDateTime();

    const [incidentData, setIncidentData] = useState({
        year: currentDateTime.year,
        month: currentDateTime.month,
        day: currentDateTime.day,
        hour: currentDateTime.hour,
        minute: currentDateTime.minute,
        tower: '',
        // Category hierarchy (single sub level + single secondary level, per new design)
        primaryCategory: '',
        subCategory: '',
        secondaryCategory: '',
        // Incident level (fetched + selected directly)
        incidentLevel: '',
        // Description
        description: '',
        // Property damage (conditional block)
        propertyDamage: '', // 'Yes' | 'No'
        propertyDamageCategory: '',
        damageEvaluation: '',
        damageCoveredInsurance: '', // 'Yes' | 'No'
        damageRecoveredStatus: '',
        insuredBy: '',
        // Root cause & actions
        rca: '',
        rootCauseCategory: '',
        correctiveAction: '',
        preventiveAction: '',
        // Support & disclaimer
        supportRequired: false,
        factsCorrect: false,
        attachments: [] as File[]
    });

    // State for towers / categories / incident levels (still API-driven)
    const [towers, setTowers] = useState<{ id: number; name: string }[]>([]);
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [subCategories, setSubCategories] = useState<any[]>([]);
    const [secondaryCategories, setSecondaryCategories] = useState<{ id: number; name: string }[]>([]);
    const [incidentLevels, setIncidentLevels] = useState<{ id: number; name: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Get baseUrl and token from localStorage
    const getBaseUrl = () => {
        let baseUrl = localStorage.getItem('baseUrl') || '';
        const token = localStorage.getItem('token') || '';
        if (baseUrl && !baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
            baseUrl = 'https://' + baseUrl.replace(/^\/\/+/, '');
        }
        return { baseUrl, token };
    };

    // Helper function to fetch data by tag type with optional parent_id filter
    const fetchByTagType = async (tagType: string, parentId?: string | number) => {
        const { baseUrl, token } = getBaseUrl();
        try {
            let url = `${baseUrl}/incidence_tags.json?q[tag_type_eq]=${tagType}`;
            if (parentId) {
                url += `&q[parent_id_eq]=${parentId}`;
            }
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`Failed to fetch ${tagType}`);
            const result = await response.json();
            return result.data || [];
        } catch (e) {
            console.error(`Error fetching ${tagType}:`, e);
            return [];
        }
    };

    const fetchCategories = async () => {
        try {
            const data = await fetchByTagType('IncidenceCategory', null);
            const filtered = data.filter((item: any) => item.parent_id === null);
            setCategories(filtered.map((item: any) => ({ id: item.id, name: item.name })));
        } catch (e) { console.error(e); }
    };

    const fetchSubCategories = async (parentId: string | number) => {
        try {
            const data = await fetchByTagType('IncidenceSubCategory', parentId);
            setSubCategories(data.map((item: any) => ({ id: item.id, name: item.name, parent_id: item.parent_id })));
        } catch (e) { console.error(e); }
    };

    const fetchSecondaryCategories = async () => {
        try {
            const data = await fetchByTagType('IncidenceSecondaryCategory', null);
            const filtered = data.filter((item: any) => item.parent_id === null);
            setSecondaryCategories(filtered.map((item: any) => ({ id: item.id, name: item.name })));
        } catch (e) { console.error(e); }
    };

    const fetchIncidentLevels = async () => {
        try {
            const data = await fetchByTagType('IncidenceLevel');
            setIncidentLevels(data.map((item: any) => ({ id: item.id, name: item.name })));
        } catch (e) { console.error(e); }
    };

    const fetchTowers = async () => {
        const { token } = getBaseUrl();
        const societyId = localStorage.getItem('selectedSocietyId') || '';

        try {
            const response = await fetch(
                `https://hi-society.lockated.com/get_society_blocks.json?society_id=${societyId}`,
                {
                    headers: {
                        'Accept': 'application/json, text/plain, */*',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) throw new Error('Failed to fetch towers');
            const result = await response.json();

            const list =
                (Array.isArray(result) && result) ||
                result.blocks ||
                result.society_blocks ||
                result.data ||
                [];

            const normalized = list.map((item: any) => ({
                id: item.id ?? item.block_id ?? item.tower_id,
                name: item.name ?? item.block_name ?? item.tower_name ?? ''
            }));

            setTowers(normalized);
        } catch (e) {
            console.error('Error fetching towers:', e);
            setTowers([]);
        }
    };

    // Fetch initial data on mount
    useEffect(() => {
        fetchTowers();
        fetchCategories();
        fetchSecondaryCategories();
        fetchIncidentLevels();
    }, []);

    // Fetch sub categories when primary category is selected
    useEffect(() => {
        if (incidentData.primaryCategory) {
            fetchSubCategories(incidentData.primaryCategory);
        } else {
            setSubCategories([]);
        }
    }, [incidentData.primaryCategory]);

    // Reset property-damage sub-fields whenever the user flips "Has any property damage" back to No
    useEffect(() => {
        if (incidentData.propertyDamage !== 'Yes') {
            setIncidentData(prev => ({
                ...prev,
                propertyDamageCategory: '',
                damageEvaluation: '',
                damageCoveredInsurance: '',
                damageRecoveredStatus: '',
                insuredBy: '',
            }));
        }
    }, [incidentData.propertyDamage]);

    // Clear damageRecoveredStatus when damageEvaluation is emptied
    useEffect(() => {
        if (!incidentData.damageEvaluation) {
            setIncidentData(prev => ({ ...prev, damageRecoveredStatus: '' }));
        }
    }, [incidentData.damageEvaluation]);

    // Clear insuredBy whenever damageCoveredInsurance is not 'Yes'
    useEffect(() => {
        if (incidentData.damageCoveredInsurance !== 'Yes') {
            setIncidentData(prev => ({ ...prev, insuredBy: '' }));
        }
    }, [incidentData.damageCoveredInsurance]);

    const handleInputChange = (field: string, value: string) => {
        if (field === 'description' && value.length > 240) {
            return; // Don't update state if exceeds 240 characters
        }
        setIncidentData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            const newFiles = Array.from(files);
            setIncidentData(prev => ({
                ...prev,
                attachments: [...prev.attachments, ...newFiles]
            }));
            toast.success(`${newFiles.length} file(s) uploaded successfully`);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const removeFile = (index: number) => {
        setIncidentData(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index)
        }));
        toast.success('File removed');
    };

    const handleCheckboxChange = (field: string, checked: boolean) => {
        setIncidentData(prev => ({
            ...prev,
            [field]: checked
        }));
    };

    const monthNameToNumber = (name: string) => {
        const months = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ];
        const idx = months.indexOf((name || '').toLowerCase());
        return idx === -1 ? '' : String(idx + 1);
    };

    // Dynamic label for the sub-category dropdown, e.g.
    // "Select The Category For The Utility failure Incident"
    const primaryCategoryName = categories.find(
        c => String(c.id) === incidentData.primaryCategory
    )?.name || '';

    const handleSubmit = async () => {
        // Time validation
        if (!incidentData.year || !incidentData.month || !incidentData.day) {
            toast.error('Please select complete date (day, month, year)');
            return;
        }
        if (!incidentData.hour || !incidentData.minute) {
            toast.error('Please select both hour and minute');
            return;
        }

        // Tower validation
        if (!incidentData.tower) {
            toast.error('Please select a tower');
            return;
        }

        // Primary category validation
        if (!incidentData.primaryCategory) {
            toast.error('Please select the incident primary category');
            return;
        }

        // Incident level validation
        if (!incidentData.incidentLevel) {
            toast.error('Please select incident level');
            return;
        }

        // Description validation
        if (!incidentData.description || incidentData.description.trim() === '') {
            toast.error('Please enter a description');
            return;
        }

        // Property damage conditional validation
        if (incidentData.propertyDamage === 'Yes') {
            if (!incidentData.propertyDamageCategory) {
                toast.error('Please select property damage category');
                return;
            }
            if (!incidentData.damageEvaluation || Number(incidentData.damageEvaluation) <= 0) {
                toast.error('Please enter damage evaluation (INR)');
                return;
            }
            if (!incidentData.damageCoveredInsurance) {
                toast.error('Please select whether damage is covered under insurance');
                return;
            }
            // Only require recovered status if an amount was entered
            if (incidentData.damageEvaluation && Number(incidentData.damageEvaluation) > 0) {
                if (!incidentData.damageRecoveredStatus) {
                    toast.error('Please select whether damage was recovered');
                    return;
                }
            }
            // Only require insuredBy when damage is covered under insurance
            if (incidentData.damageCoveredInsurance === 'Yes') {
                if (!incidentData.insuredBy) {
                    toast.error('Please select insured by');
                    return;
                }
            }
        }

        // Disclaimer validation
        if (!incidentData.factsCorrect) {
            toast.error('Please confirm the disclaimer');
            return;
        }

        try {
            let baseUrl = localStorage.getItem('baseUrl') || '';
            const token = localStorage.getItem('token') || '';
            if (baseUrl && !baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
                baseUrl = 'https://' + baseUrl.replace(/^\/\/+/, '');
            }

            const form = new FormData();

            // Time fields
            form.append('incident[inc_time(1i)]', incidentData.year);
            form.append('incident[inc_time(2i)]', monthNameToNumber(incidentData.month));
            form.append('incident[inc_time(3i)]', incidentData.day);
            form.append('incident[inc_time(4i)]', incidentData.hour);
            form.append('incident[inc_time(5i)]', incidentData.minute);

            // Tower
            form.append('incident[tower_id]', incidentData.tower);

            // Category hierarchy
            form.append('incident[inc_category_id]', incidentData.primaryCategory);
            if (incidentData.subCategory) {
                form.append('incident[inc_sub_category_id]', incidentData.subCategory);
            }
            if (incidentData.secondaryCategory) {
                form.append('incident[inc_sec_category_id]', incidentData.secondaryCategory);
            }

            // Incident level
            form.append('incident[inc_level_id]', incidentData.incidentLevel);

            // Description
            form.append('incident[description]', incidentData.description);

            // Property damage block
            // NOTE: key names below (property_damage, property_damage_category,
            // damage_evaluation, damage_covered_under_insurance, damage_recovered_status,
            // insured_by) are best-guess snake_case params — confirm exact keys with
            // the backend team and adjust here if they differ.
            form.append('incident[property_damage]', incidentData.propertyDamage === 'Yes' ? 'true' : 'false');
            if (incidentData.propertyDamage === 'Yes') {
                form.append('incident[property_damage_category]', incidentData.propertyDamageCategory);
                form.append('incident[damage_evaluation]', incidentData.damageEvaluation);
                form.append('incident[damage_covered_under_insurance]', incidentData.damageCoveredInsurance === 'Yes' ? 'true' : 'false');
                if (incidentData.damageEvaluation && Number(incidentData.damageEvaluation) > 0) {
                    form.append('incident[damage_recovered_status]', incidentData.damageRecoveredStatus);
                }
                if (incidentData.damageCoveredInsurance === 'Yes') {
                    form.append('incident[insured_by]', incidentData.insuredBy);
                }
            }

            // Root cause & actions (optional fields)
            if (incidentData.rca) form.append('incident[rca]', incidentData.rca);
            if (incidentData.rootCauseCategory) form.append('incident[root_cause_category]', incidentData.rootCauseCategory);
            if (incidentData.correctiveAction) form.append('incident[corrective_action]', incidentData.correctiveAction);
            if (incidentData.preventiveAction) form.append('incident[preventive_action]', incidentData.preventiveAction);

            // Disclaimer and support required
            form.append('incident[support_required]', incidentData.supportRequired ? 'true' : 'false');
            form.append('incident[disclaimer]', incidentData.factsCorrect ? 'true' : 'false');

            // Attachments
            if (incidentData.attachments && incidentData.attachments.length > 0) {
                incidentData.attachments.forEach(file => {
                    form.append('noticeboard[files_attached][]', file);
                });
            }

            const resp = await fetch(`${baseUrl}/incidents.json`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: form
            });

            if (!resp.ok) {
                const errText = await resp.text();
                throw new Error(errText || 'Failed to create incident');
            }

            toast.success('Incident reported successfully!');
            navigate('/safety/incident');
        } catch (err: any) {
            console.error('Incident POST failed:', err);
            toast.error('Failed to create incident');
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <nav className="flex items-center text-sm text-gray-600 mb-4">
                    <span>Home</span>
                    <span className="mx-2">{'>'}</span>
                    <span>Safety</span>
                    <span className="mx-2">{'>'}</span>
                    <span>Incident</span>
                </nav>
                <Heading level="h1" variant="primary" spacing="none" className="text-[#C72030] font-semibold">
                    NEW INCIDENT
                </Heading>
            </div>

            {/* Incident Details */}
            <Card className="mb-6 border-[#D9D9D9] bg-[#F6F7F7]">
                <CardHeader className='bg-[#F6F4EE] mb-4'>
                    <CardTitle className="text-lg text-black flex items-center">
                        <span className="w-6 h-6 bg-[#C72030] text-white rounded-full flex items-center justify-center text-sm mr-2">1</span>
                        INCIDENT DETAILS
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 bg-white">
                    {/* Time & Date */}
                    <div className="mb-6">
                        <h3 className="text-sm font-medium mb-3">Time & Date <span style={{ color: '#C72030' }}>*</span></h3>
                        <div className="grid grid-cols-5 gap-2">
                            <FormControl fullWidth variant="outlined">
                                <InputLabel shrink>Year <span style={{ color: '#C72030' }}>*</span></InputLabel>
                                <MuiSelect
                                    label="Year *"
                                    value={incidentData.year}
                                    onChange={e => handleInputChange('year', e.target.value)}
                                    displayEmpty
                                    sx={fieldStyles}
                                    MenuProps={menuProps}
                                >
                                    <MenuItem value=""><em>Select Year</em></MenuItem>
                                    {Array.from({ length: new Date().getFullYear() + 50 - 2010 + 1 }, (_, i) => {
                                        const year = new Date().getFullYear() + 50 - i;
                                        return (
                                            <MenuItem key={year} value={String(year)}>{year}</MenuItem>
                                        );
                                    })}
                                </MuiSelect>
                            </FormControl>

                            <FormControl fullWidth variant="outlined">
                                <InputLabel shrink>Month <span style={{ color: '#C72030' }}>*</span></InputLabel>
                                <MuiSelect
                                    label="Month *"
                                    value={incidentData.month}
                                    onChange={e => handleInputChange('month', e.target.value)}
                                    displayEmpty
                                    sx={fieldStyles}
                                    MenuProps={menuProps}
                                >
                                    <MenuItem value=""><em>Select Month</em></MenuItem>
                                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                                        <MenuItem key={m} value={m}>{m}</MenuItem>
                                    ))}
                                </MuiSelect>
                            </FormControl>

                            <FormControl fullWidth variant="outlined">
                                <InputLabel shrink>Day <span style={{ color: '#C72030' }}>*</span></InputLabel>
                                <MuiSelect
                                    label="Day *"
                                    value={incidentData.day}
                                    onChange={e => handleInputChange('day', e.target.value)}
                                    displayEmpty
                                    sx={fieldStyles}
                                    MenuProps={menuProps}
                                >
                                    <MenuItem value=""><em>Select Day</em></MenuItem>
                                    {Array.from({ length: 31 }, (_, i) => (
                                        <MenuItem key={i + 1} value={String(i + 1)}>{i + 1}</MenuItem>
                                    ))}
                                </MuiSelect>
                            </FormControl>

                            <FormControl fullWidth variant="outlined">
                                <InputLabel shrink>Hour <span style={{ color: '#C72030' }}>*</span></InputLabel>
                                <MuiSelect
                                    label="Hour *"
                                    value={incidentData.hour}
                                    onChange={e => handleInputChange('hour', e.target.value)}
                                    displayEmpty
                                    sx={fieldStyles}
                                    MenuProps={menuProps}
                                >
                                    <MenuItem value=""><em>Select Hour</em></MenuItem>
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <MenuItem key={i} value={String(i)}>{i}</MenuItem>
                                    ))}
                                </MuiSelect>
                            </FormControl>

                            <FormControl fullWidth variant="outlined">
                                <InputLabel shrink>Minute <span style={{ color: '#C72030' }}>*</span></InputLabel>
                                <MuiSelect
                                    label="Minute *"
                                    value={incidentData.minute}
                                    onChange={e => handleInputChange('minute', e.target.value)}
                                    displayEmpty
                                    sx={fieldStyles}
                                    MenuProps={menuProps}
                                >
                                    <MenuItem value=""><em>Select Minute</em></MenuItem>
                                    {Array.from({ length: 60 }, (_, i) => (
                                        <MenuItem key={i} value={String(i)}>{i}</MenuItem>
                                    ))}
                                </MuiSelect>
                            </FormControl>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Tower */}
                        <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                            <InputLabel shrink>Tower <span style={{ color: '#C72030' }}>*</span></InputLabel>
                            <MuiSelect
                                label="Tower *"
                                value={incidentData.tower}
                                onChange={e => handleInputChange('tower', e.target.value)}
                                displayEmpty
                                sx={fieldStyles}
                                MenuProps={menuProps}
                            >
                                <MenuItem value=""><em>Select Tower</em></MenuItem>
                                {towers.map(t => (
                                    <MenuItem key={t.id} value={String(t.id)}>{t.name}</MenuItem>
                                ))}
                            </MuiSelect>
                        </FormControl>

                        {/* Primary Category */}
                        <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                            <InputLabel shrink>Select The Incident Primary Category <span style={{ color: '#C72030' }}>*</span></InputLabel>
                            <MuiSelect
                                label="Select The Incident Primary Category *"
                                value={incidentData.primaryCategory}
                                onChange={e => handleInputChange('primaryCategory', e.target.value)}
                                displayEmpty
                                sx={fieldStyles}
                                MenuProps={menuProps}
                            >
                                <MenuItem value=""><em>Select Primary Category</em></MenuItem>
                                {categories.map(cat => (
                                    <MenuItem key={cat.id} value={String(cat.id)}>{cat.name}</MenuItem>
                                ))}
                            </MuiSelect>
                        </FormControl>

                        {/* Sub Category — label changes based on selected primary category */}
                        <FormControl fullWidth variant="outlined" sx={{ mt: 1 }} disabled={!incidentData.primaryCategory}>
                            <InputLabel shrink>
                                {primaryCategoryName
                                    ? `Select The Category For The ${primaryCategoryName} Incident`
                                    : 'Select The Category For The Incident'}
                            </InputLabel>
                            <MuiSelect
                                label={primaryCategoryName ? `Select The Category For The ${primaryCategoryName} Incident` : 'Select The Category For The Incident'}
                                value={incidentData.subCategory}
                                onChange={e => handleInputChange('subCategory', e.target.value)}
                                displayEmpty
                                sx={fieldStyles}
                                MenuProps={menuProps}
                            >
                                <MenuItem value=""><em>Select Category</em></MenuItem>
                                {subCategories.filter(sub => String(sub.parent_id) === incidentData.primaryCategory).map(sub => (
                                    <MenuItem key={sub.id} value={String(sub.id)}>{sub.name}</MenuItem>
                                ))}
                            </MuiSelect>
                        </FormControl>

                        {/* Secondary Category */}
                        <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                            <InputLabel shrink>Select The Incident Secondry Category</InputLabel>
                            <MuiSelect
                                label="Select The Incident Secondry Category"
                                value={incidentData.secondaryCategory}
                                onChange={e => handleInputChange('secondaryCategory', e.target.value)}
                                displayEmpty
                                sx={fieldStyles}
                                MenuProps={menuProps}
                            >
                                <MenuItem value=""><em>Select Secondary Category</em></MenuItem>
                                {secondaryCategories.map(cat => (
                                    <MenuItem key={cat.id} value={String(cat.id)}>{cat.name}</MenuItem>
                                ))}
                            </MuiSelect>
                        </FormControl>

                        {/* Incident Level */}
                        <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                            <InputLabel shrink>Incident Level <span style={{ color: '#C72030' }}>*</span></InputLabel>
                            <MuiSelect
                                label="Incident Level *"
                                value={incidentData.incidentLevel}
                                onChange={e => handleInputChange('incidentLevel', e.target.value)}
                                displayEmpty
                                sx={fieldStyles}
                                MenuProps={menuProps}
                            >
                                <MenuItem value=""><em>Select Level</em></MenuItem>
                                {incidentLevels.map(level => (
                                    <MenuItem key={level.id} value={String(level.id)}>{level.name}</MenuItem>
                                ))}
                            </MuiSelect>
                        </FormControl>
                    </div>

                    {/* Description */}
                    <div className="mt-6">
                        <TextField
                            label={<>Description<span style={{ color: '#C72030' }}>*</span></>}
                            value={incidentData.description}
                            onChange={e => handleInputChange('description', e.target.value)}
                            fullWidth
                            variant="outlined"
                            multiline
                            rows={4}
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    height: "auto !important",
                                    padding: "2px !important",
                                    display: "flex",
                                },
                                "& .MuiInputBase-input[aria-hidden='true']": {
                                    flex: 0, width: 0, height: 0, padding: "0 !important", margin: 0, display: "none",
                                },
                                "& .MuiInputBase-input": { resize: "none !important" },
                            }}
                        />
                        <div className="mt-2 text-sm text-gray-600">
                            {incidentData.description.length} / 240
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Property Damage (conditional block) */}
            <Card className="mb-6 border-[#D9D9D9] bg-[#F6F7F7]">
                <CardHeader className='bg-[#F6F4EE] mb-4'>
                    <CardTitle className="text-lg text-black flex items-center">
                        <span className="w-6 h-6 bg-[#C72030] text-white rounded-full flex items-center justify-center text-sm mr-2">2</span>
                        PROPERTY DAMAGE
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormControl fullWidth variant="outlined">
                            <InputLabel shrink>Has Any Property Damage Happened In The Incident?</InputLabel>
                            <MuiSelect
                                label="Has Any Property Damage Happened In The Incident?"
                                value={incidentData.propertyDamage}
                                onChange={e => handleInputChange('propertyDamage', e.target.value)}
                                displayEmpty
                                sx={fieldStyles}
                                MenuProps={menuProps}
                            >
                                <MenuItem value=""><em>Select</em></MenuItem>
                                <MenuItem value="Yes">Yes</MenuItem>
                                <MenuItem value="No">No</MenuItem>
                            </MuiSelect>
                        </FormControl>
                    </div>

                    {/* Sub-fields only shown when propertyDamage === 'Yes' */}
                    {incidentData.propertyDamage === 'Yes' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <FormControl fullWidth variant="outlined">
                                <InputLabel shrink>Property Damage Category <span style={{ color: '#C72030' }}>*</span></InputLabel>
                                <MuiSelect
                                    label="Property Damage Category *"
                                    value={incidentData.propertyDamageCategory}
                                    onChange={e => handleInputChange('propertyDamageCategory', e.target.value)}
                                    displayEmpty
                                    sx={fieldStyles}
                                    MenuProps={menuProps}
                                >
                                    <MenuItem value=""><em>Select Category</em></MenuItem>
                                    {PROPERTY_DAMAGE_CATEGORY_OPTIONS.map(opt => (
                                        <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                    ))}
                                </MuiSelect>
                            </FormControl>

                            <TextField
                                label={<>Damage Evaluation (INR)<span style={{ color: '#C72030' }}>*</span></>}
                                value={incidentData.damageEvaluation}
                                onChange={e => {
                                    const val = e.target.value;
                                    if (/^\d*$/.test(val)) handleInputChange('damageEvaluation', val);
                                }}
                                fullWidth
                                variant="outlined"
                                InputLabelProps={{ shrink: true }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: 'white' } }}
                            />

                            <FormControl fullWidth variant="outlined">
                                <InputLabel shrink>Damage Covered Under Insurance <span style={{ color: '#C72030' }}>*</span></InputLabel>
                                <MuiSelect
                                    label="Damage Covered Under Insurance *"
                                    value={incidentData.damageCoveredInsurance}
                                    onChange={e => handleInputChange('damageCoveredInsurance', e.target.value)}
                                    displayEmpty
                                    sx={fieldStyles}
                                    MenuProps={menuProps}
                                >
                                    <MenuItem value=""><em>Select</em></MenuItem>
                                    <MenuItem value="Yes">Yes</MenuItem>
                                    <MenuItem value="No">No</MenuItem>
                                </MuiSelect>
                            </FormControl>

                            {/** Only show "Whether Damaged Was Recovered" when a damage amount is entered */}
                            {incidentData.damageEvaluation && Number(incidentData.damageEvaluation) > 0 && (
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel shrink>Whether Damaged Was Recovered <span style={{ color: '#C72030' }}>*</span></InputLabel>
                                    <MuiSelect
                                        label="Whether Damaged Was Recovered *"
                                        value={incidentData.damageRecoveredStatus}
                                        onChange={e => handleInputChange('damageRecoveredStatus', e.target.value)}
                                        displayEmpty
                                        sx={fieldStyles}
                                        MenuProps={menuProps}
                                    >
                                        <MenuItem value=""><em>Select</em></MenuItem>
                                        {DAMAGE_RECOVERED_OPTIONS.map(opt => (
                                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                        ))}
                                    </MuiSelect>
                                </FormControl>
                            )}

                            {/** Only show "Insured By" when damage is covered under insurance (Yes) */}
                            {incidentData.damageCoveredInsurance === 'Yes' && (
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel shrink>Insured By <span style={{ color: '#C72030' }}>*</span></InputLabel>
                                    <MuiSelect
                                        label="Insured By *"
                                        value={incidentData.insuredBy}
                                        onChange={e => handleInputChange('insuredBy', e.target.value)}
                                        displayEmpty
                                        sx={fieldStyles}
                                        MenuProps={menuProps}
                                    >
                                        <MenuItem value=""><em>Select</em></MenuItem>
                                        {INSURED_BY_OPTIONS.map(opt => (
                                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                        ))}
                                    </MuiSelect>
                                </FormControl>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Root Cause & Actions */}
            <Card className="mb-6 border-[#D9D9D9] bg-[#F6F7F7]">
                <CardHeader className='bg-[#F6F4EE] mb-4'>
                    <CardTitle className="text-lg text-black flex items-center">
                        <span className="w-6 h-6 bg-[#C72030] text-white rounded-full flex items-center justify-center text-sm mr-2">3</span>
                        ROOT CAUSE & ACTIONS
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextField
                            label="RCA"
                            value={incidentData.rca}
                            onChange={e => handleInputChange('rca', e.target.value)}
                            fullWidth
                            variant="outlined"
                            InputLabelProps={{ shrink: true }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: 'white' } }}
                        />

                        <FormControl fullWidth variant="outlined">
                            <InputLabel shrink>Primary Root Cause Category</InputLabel>
                            <MuiSelect
                                label="Primary Root Cause Category"
                                value={incidentData.rootCauseCategory}
                                onChange={e => handleInputChange('rootCauseCategory', e.target.value)}
                                displayEmpty
                                sx={fieldStyles}
                                MenuProps={menuProps}
                            >
                                <MenuItem value=""><em>Select Category</em></MenuItem>
                                {ROOT_CAUSE_CATEGORY_OPTIONS.map(opt => (
                                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                ))}
                            </MuiSelect>
                        </FormControl>

                        <TextField
                            label="Corrective Action"
                            value={incidentData.correctiveAction}
                            onChange={e => handleInputChange('correctiveAction', e.target.value)}
                            fullWidth
                            variant="outlined"
                            InputLabelProps={{ shrink: true }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: 'white' } }}
                        />

                        <TextField
                            label="Preventive Action"
                            value={incidentData.preventiveAction}
                            onChange={e => handleInputChange('preventiveAction', e.target.value)}
                            fullWidth
                            variant="outlined"
                            InputLabelProps={{ shrink: true }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: 'white' } }}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Support and Disclaimer */}
            <Card className="mb-6 border-[#D9D9D9] bg-[#F6F7F7]">
                <CardHeader className='bg-[#F6F4EE] mb-4'>
                    <CardTitle className="text-lg text-black flex items-center">
                        <span className="w-6 h-6 bg-[#C72030] text-white rounded-full flex items-center justify-center text-sm mr-2">4</span>
                        SUPPORT & DISCLAIMER
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 bg-white">
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-medium mb-3">Support</h3>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={incidentData.supportRequired}
                                        onChange={(e) => handleCheckboxChange('supportRequired', e.target.checked)}
                                        sx={{ color: '#C72030', '&.Mui-checked': { color: '#C72030' } }}
                                    />
                                }
                                label="Support required"
                            />
                        </div>

                        <div>
                            <h3 className="text-lg font-medium mb-3">Disclaimer <span style={{ color: '#C72030' }}>*</span></h3>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={incidentData.factsCorrect}
                                        onChange={(e) => handleCheckboxChange('factsCorrect', e.target.checked)}
                                        sx={{ color: '#C72030', '&.Mui-checked': { color: '#C72030' } }}
                                    />
                                }
                                label={<>I have correctly stated all the facts related to the incident. </>}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Attachments */}
            <Card className="mb-6 border-[#D9D9D9] bg-[#F6F7F7]">
                <CardHeader className='bg-[#F6F4EE] mb-4'>
                    <CardTitle className="text-lg text-black flex items-center">
                        <span className="w-6 h-6 bg-[#C72030] text-white rounded-full flex items-center justify-center text-sm mr-2">5</span>
                        UPLOAD FILES
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 bg-white">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                multiple
                            />
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex items-center gap-2 !bg-white !text-[#C72030] !border !border-[#C72030] hover:!bg-[#F6F4EE] hover:!text-[#C72030]"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    Choose a file...
                                </Button>
                            </label>
                            <span className="text-sm text-gray-500">
                                {incidentData.attachments.length > 0
                                    ? `${incidentData.attachments.length} file(s) selected`
                                    : 'No files chosen'}
                            </span>
                        </div>

                        {incidentData.attachments.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700">Selected Files:</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {incidentData.attachments.map((file, index) => {
                                        const isImage = file.type.startsWith('image/');
                                        const fileUrl = URL.createObjectURL(file);
                                        return (
                                            <div key={index} className="relative group border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                                                <div className="aspect-square bg-gray-100 flex items-center justify-center p-2">
                                                    {isImage ? (
                                                        <img
                                                            src={fileUrl}
                                                            alt={file.name}
                                                            className="w-full h-full object-contain"
                                                            onLoad={() => URL.revokeObjectURL(fileUrl)}
                                                        />
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                                            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                            </svg>
                                                            <span className="text-xs font-medium uppercase">
                                                                {file.name.split('.').pop()}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-2 bg-white border-t border-gray-100">
                                                    <p className="text-xs text-gray-600 truncate" title={file.name}>{file.name}</p>
                                                    <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                                <button
                                                    onClick={() => removeFile(index)}
                                                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Remove file"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
                <Button
                    onClick={handleSubmit}
                    className="!bg-[#C72030] hover:!bg-[#C72030]/90 !text-white px-8 py-3 text-[18px]"
                >
                    Create Incident
                </Button>
            </div>
        </div>
    );
}

export default NewAddIncidentPage;