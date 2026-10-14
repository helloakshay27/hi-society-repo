
import React from 'react';
import {
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  TextareaAutosize,
  TextField
} from '@mui/material';
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Box, Typography, IconButton } from '@mui/material';
import { Settings, Upload, X } from 'lucide-react';

interface BasicDetailsSectionProps {
  category: string;
  setCategory: (value: string) => void;
  subCategory: string;
  setSubCategory: (value: string) => void;
  site: string;
  setSite: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  categorization: string;
  setCategorization: (value: string) => void;
  observation: string;
  setObservation: (value: string) => void;
  recommendation: string;
  setRecommendation: (value: string) => void;
  tag: string;
  setTag: (value: string) => void;
  mustHave: boolean;
  handleMustHaveChange: (checked: boolean | "indeterminate") => void;
  siteList: { id: number; name: string }[];
  categories: { id: number; name: string }[];
  subCategories: { id: number; name: string; parent_id: number | null }[];
  attachments: File[];
  onAttachmentsChange: (files: File[]) => void;
}

export const BasicDetailsSection: React.FC<BasicDetailsSectionProps> = ({
  category,
  setCategory,
  subCategory,
  setSubCategory,
  site,
  setSite,
  location,
  setLocation,
  categorization,
  setCategorization,
  observation,
  setObservation,
  recommendation,
  setRecommendation,
  tag,
  setTag,
  mustHave,
  handleMustHaveChange,
  attachments,
  onAttachmentsChange,
  siteList = [],
  categories = [],
  subCategories = [],
}) => {
  const fieldStyles = {
    height: { xs: 28, sm: 36, md: 45 },
    '& .MuiInputBase-input, & .MuiSelect-select': {
      padding: { xs: '8px', sm: '10px', md: '12px' },
    },
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '88px',
    fontSize: '13.5px',
    fontWeight: 500,
    lineHeight: 1.6,
    color: '#1A1A18',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid rgba(26, 26, 24, 0.08)',
    backgroundColor: '#FFFFFF',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    transition: 'border-color 0.16s ease, box-shadow 0.16s ease',
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      onAttachmentsChange([...attachments, ...newFiles]);
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    const updatedAttachments = attachments.filter((_, index) => index !== indexToRemove);
    onAttachmentsChange(updatedAttachments);
  };

  return (
    <Card className="mb-6 overflow-hidden rounded-2xl border border-[rgba(26,26,24,0.09)] shadow-none bg-white">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 px-6 pt-[22px] pb-0 bg-white">
        <span className="w-8 h-8 rounded-full flex items-center justify-center flex-none" style={{ backgroundColor: "#F5F4F0" }}>
          <Settings size={14} color="#1A1A18" />
        </span>
        <CardTitle className="text-[14px] leading-[1.4] font-semibold" style={{ color: "#1A1A18" }}>
          Basic Details
        </CardTitle>
      </CardHeader>

      <CardContent className="px-6 pt-4 pb-[22px]">
        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <FormControl fullWidth variant="outlined">
            <InputLabel id="category-label" shrink>Category*</InputLabel>
            <MuiSelect
              labelId="category-label"
              label="Category*"
              displayEmpty
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              sx={fieldStyles}
            >
              <MenuItem value=""><em>Select Category</em></MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
              ))}
            </MuiSelect>
          </FormControl>

          <FormControl fullWidth variant="outlined">
            <InputLabel id="sub-category-label" shrink>Sub-category</InputLabel>
            <MuiSelect
              labelId="sub-category-label"
              label="Sub-category"
              displayEmpty
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              sx={fieldStyles}
              disabled={!category}
            >
              <MenuItem value=""><em>Select Sub Category</em></MenuItem>
              {subCategories
                .filter((sc) => String(sc.parent_id) === String(category))
                .map((sc) => (
                  <MenuItem key={sc.id} value={sc.id}>{sc.name}</MenuItem>
                ))}
            </MuiSelect>
          </FormControl>

          <FormControl fullWidth variant="outlined">
            <InputLabel id="site-label" shrink>Site*</InputLabel>
            <MuiSelect
              labelId="site-label"
              label="Site*"
              displayEmpty
              value={site}
              onChange={(e) => setSite(e.target.value)}
              sx={fieldStyles}
            >
              <MenuItem value=""><em>Select Site</em></MenuItem>
              {siteList.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </MuiSelect>
          </FormControl>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <TextField
            label="Location"
            placeholder="Enter Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            sx={fieldStyles}
          />

          <FormControl fullWidth variant="outlined">
            <InputLabel id="categorization-label" shrink>Categorization*</InputLabel>
            <MuiSelect
              labelId="categorization-label"
              label="Categorization*"
              displayEmpty
              value={categorization}
              onChange={(e) => setCategorization(e.target.value)}
              sx={fieldStyles}
            >
              <MenuItem value=""><em>Select Categorization</em></MenuItem>
              <MenuItem value="safety">Safety</MenuItem>
              <MenuItem value="Security">Security</MenuItem>
              <MenuItem value="Customer Experience">Customer Experience</MenuItem>
              <MenuItem value="CAM">CAM</MenuItem>
            </MuiSelect>
          </FormControl>

          <FormControl fullWidth variant="outlined">
            <InputLabel id="tag-label" shrink>Tag</InputLabel>
            <MuiSelect
              labelId="tag-label"
              label="Tag"
              displayEmpty
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              sx={fieldStyles}
            >
              <MenuItem value=""><em>Select Tag</em></MenuItem>
              <MenuItem value="workaround">Workaround</MenuItem>
              <MenuItem value="Learning for the future project">Learning for the future project</MenuItem>

            </MuiSelect>
          </FormControl>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block mb-1.5 text-[12px] font-semibold" style={{ color: "rgba(26, 26, 24, 0.68)" }}>Observation</label>
            <TextareaAutosize
              minRows={4}
              placeholder="Enter Observation"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              style={textareaStyle}
            />
          </div>

          <div>
            <label className="block mb-1.5 text-[12px] font-semibold" style={{ color: "rgba(26, 26, 24, 0.68)" }}>Recommendation</label>
            <TextareaAutosize
              minRows={4}
              placeholder="Enter Recommendation"
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              style={textareaStyle}
            />
          </div>
        </div>

        {/* Checkbox */}
        <div className="mb-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="mustHave"
              checked={mustHave}
              onCheckedChange={handleMustHaveChange}
              className="h-[18px] w-[18px] rounded-[5px] border-[1.5px]"
              style={{
                borderColor: mustHave ? '#1A1A18' : 'rgba(26, 26, 24, 0.22)',
                backgroundColor: mustHave ? '#1A1A18' : 'transparent'
              }}
            />
            <label htmlFor="mustHave" className="text-[13px] cursor-pointer" style={{ color: "rgba(26, 26, 24, 0.68)" }}>
              Must Have
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-[12px] font-semibold" style={{ color: "rgba(26, 26, 24, 0.68)" }}>
            Attachments
          </label>
          <Box
            sx={{
              border: '2px dashed #EBE9E2',
              borderRadius: '12px',
              backgroundColor: 'transparent',
              gap: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '18px',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease, border-color 0.15s ease',
              '&:hover': {
                backgroundColor: '#FDFDFB',
                borderColor: 'rgba(26, 26, 24, 0.28)',
              },
            }}
            onClick={() => document.getElementById('file-upload-attachments')?.click()}
          >
            <Upload size={18} strokeWidth={1.8} color="#1A1A18" />
            <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: '#1A1A18', textAlign: 'center' }}>
              Choose files to upload
            </Typography>
            <Typography sx={{ fontSize: '11px', color: 'rgba(26, 26, 24, 0.48)', textAlign: 'center' }}>
              PNG, JPG, PDF up to 10MB
            </Typography>
            <input
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.pdf"
              id="file-upload-attachments"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </Box>

          {/* Preview Section */}
          {attachments && attachments?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Selected Files ({attachments.length})
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: 2,
                }}
              >
                {attachments.map((file, index) => (
                  <Box key={index} sx={{ position: 'relative' }}>
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        style={{
                          width: '100%',
                          height: '100px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          border: '1px solid #e5e7eb',
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: '100px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '4px',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        <Typography variant="caption">{file.name}</Typography>
                      </Box>
                    )}
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        backgroundColor: '#1a1a18',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: '#12100e',
                        },
                      }}
                      onClick={() => handleRemoveFile(index)}
                    >
                      <X size={16} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
