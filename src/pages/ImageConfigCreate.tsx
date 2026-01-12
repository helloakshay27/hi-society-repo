import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { API_CONFIG, getAuthHeader } from "@/config/apiConfig";
import { ArrowLeft, Image } from "lucide-react";
import { FormControl, InputLabel, Select as MuiSelect, MenuItem } from '@mui/material';
import { Button } from "@/components/ui/button";

const fieldStyles = {
  height: '45px',
  backgroundColor: '#fff',
  borderRadius: '4px',
  '& .MuiOutlinedInput-root': {
    height: '45px',
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
    '&.Mui-focused': {
      color: '#C72030',
    },
  },
};


const CreateImageConfiguration = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [selectedValue, setSelectedValue] = useState("");

  // Define the name options (static)
  const nameOptions = [
    { value: "ProjectImage", label: "ProjectImage" },
    { value: "VideoPreviewImage", label: "VideoPreviewImage" },
    { value: "ProjectCoverImage", label: "ProjectCoverImage" },
    { value: "ProjectCarouselImage", label: "ProjectCarouselImage" },
    { value: "Project2DImage", label: "Project2DImage" },
    { value: "ProjectGallery", label: "ProjectGallery" },
    { value: "TestimonialPreviewImage", label: "TestimonialPreviewImage" },
    { value: "BannerAttachment", label: "BannerAttachment" },
    { value: "EventImage", label: "EventImage" },
    { value: "EventCoverImage", label: "EventCoverImage" }
  ];

  // Define value options for each name
  const valueOptionsMap = {
    ProjectImage: [
      { value: "image_1_by_1", label: "image_1_by_1" },
      { value: "image_3_by_2", label: "image_3_by_2" },
      { value: "image_9_by_16", label: "image_9_by_16" },
      { value: "image_16_by_9", label: "image_16_by_9" }
    ],
    VideoPreviewImage: [
      { value: "preview_image_1_by_1", label: "preview_image_1_by_1" },
      { value: "preview_image_3_by_2", label: "preview_image_3_by_2" },
      { value: "preview_image_9_by_16", label: "preview_image_9_by_16" },
      { value: "preview_image_16_by_9", label: "preview_image_16_by_9" }
    ],
    ProjectCoverImage: [
      { value: "cover_images_1_by_1", label: "cover_images_1_by_1" },
      { value: "cover_images_3_by_2", label: "cover_images_3_by_2" },
      { value: "cover_images_9_by_16", label: "cover_images_9_by_16" },
      { value: "cover_images_16_by_9", label: "cover_images_16_by_9" }
    ],
    ProjectCarouselImage: [
      { value: "carousel_images_1_by_1", label: "carousel_images_1_by_1" },
      { value: "carousel_images_3_by_2", label: "carousel_images_3_by_2" },
      { value: "carousel_images_9_by_16", label: "carousel_images_9_by_16" },
      { value: "carousel_images_16_by_9", label: "carousel_images_16_by_9" }
    ],
    Project2DImage: [
      { value: "project_2d_image_1_by_1", label: "project_2d_image_1_by_1" },
      { value: "project_2d_image_3_by_2", label: "project_2d_image_3_by_2" },
      { value: "project_2d_image_9_by_16", label: "project_2d_image_9_by_16" },
      { value: "project_2d_image_16_by_9", label: "project_2d_image_16_by_9" }
    ],
    ProjectGallery: [
      { value: "gallery_image_1_by_1", label: "gallery_image_1_by_1" },
      { value: "gallery_image_3_by_2", label: "gallery_image_3_by_2" },
      { value: "gallery_image_9_by_16", label: "gallery_image_9_by_16" },
      { value: "gallery_image_16_by_9", label: "gallery_image_16_by_9" }
    ],
    TestimonialPreviewImage: [
      { value: "preview_image_1_by_1", label: "preview_image_1_by_1" },
      { value: "preview_image_3_by_2", label: "preview_image_3_by_2" },
      { value: "preview_image_9_by_16", label: "preview_image_9_by_16" },
      { value: "preview_image_16_by_9", label: "preview_image_16_by_9" }
    ],
    BannerAttachment: [
      { value: "banner_video_1_by_1", label: "banner_video_1_by_1" },
      { value: "banner_video_3_by_2", label: "banner_video_3_by_2" },
      { value: "banner_video_9_by_16", label: "banner_video_9_by_16" },
      { value: "banner_video_16_by_9", label: "banner_video_16_by_9" }
    ],
    EventImage: [
      { value: "event_images_1_by_1", label: "event_images_1_by_1" },
      { value: "event_images_3_by_2", label: "event_images_3_by_2" },
      { value: "event_images_9_by_16", label: "event_images_9_by_16" },
      { value: "event_images_16_by_9", label: "event_images_16_by_9" }
    ],
    EventCoverImage: [
      { value: "cover_image_1_by_1", label: "cover_image_1_by_1" },
      { value: "cover_image_3_by_2", label: "cover_image_3_by_2" },
      { value: "cover_image_9_by_16", label: "cover_image_9_by_16" },
      { value: "cover_image_16_by_9", label: "cover_image_16_by_9" }
    ]
  };

  // Handle name change
  const handleNameChange = (value) => {
    setSelectedName(value);
    setSelectedValue(""); // Reset value when name changes
  };

  // Handle value change
  const handleValueChange = (value) => {
    setSelectedValue(value);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedName) {
      toast.error("Please select a name");
      return;
    }

    if (!selectedValue) {
      toast.error("Please select a value");
      return;
    }

    setLoading(true);

    try {
      const createData = {
        system_constant: {
          name: selectedName,
          value: selectedValue,
          description: "ImagesConfiguration"
        }
      };

      await axios.post(
        `${baseURL}/system_constants.json`,
        createData,
        {
          headers: {
                   'Authorization': getAuthHeader(),
                   'Content-Type': 'application/json',
                 },
        }
      );

      toast.success("Image configuration created successfully!");
      navigate("/settings/image-config-list");
    } catch (error) {
      console.error("API Error:", error.response?.data || error.message);
      toast.error(
        `Failed to create image configuration: ${
          error.response?.data?.error || "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/settings/image-config-list");
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
          <button 
            onClick={handleGoBack}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors mr-2"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span>Setup Member</span>
          <span>{">"}</span>
          <span>Image Configuration</span>
          <span>{">"}</span>
          <span className="text-gray-900 font-medium">Create</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">CREATE IMAGE CONFIGURATION</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: "#F6F4EE" }}>
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                <Image size={16} color="#C72030" />
              </span>
              Image Configuration Details
            </h2>
          </div>
         
          <div className="p-6 space-y-6">
            <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
              {/* Name Field */}
              <div>
                <FormControl
                  variant="outlined"
                  sx={{
                    width: "350px",
                    "& .MuiInputBase-root": fieldStyles,
                  }}
                  required
                >
                  <InputLabel shrink>Name</InputLabel>
                  <MuiSelect
                    value={selectedName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    label="Name"
                    notched
                    displayEmpty
                    disabled={loading}
                  >
                    <MenuItem value="">Select Name</MenuItem>
                    {nameOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </MuiSelect>
                </FormControl>
              </div>

              {/* Value Field */}
              <div>
                <FormControl
                  variant="outlined"
                  sx={{
                    width: "350px",
                    "& .MuiInputBase-root": fieldStyles,
                  }}
                  required
                  disabled={!selectedName}
                >
                  <InputLabel shrink>Value</InputLabel>
                  <MuiSelect
                    value={selectedValue}
                    onChange={(e) => handleValueChange(e.target.value)}
                    label="Value"
                    notched
                    displayEmpty
                    disabled={loading || !selectedName}
                  >
                    <MenuItem value="">Select Value</MenuItem>
                    {selectedName && valueOptionsMap[selectedName]?.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </MuiSelect>
                </FormControl>
                {!selectedName && (
                  <small className="text-gray-500 mt-1 block">
                    Please select a name first
                  </small>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-6">
          <Button
            type="submit"
            className="bg-[#C72030] hover:bg-[#C72030] text-white px-8 py-2"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </Button>
          <Button
            type="button"
            onClick={handleGoBack}
            className="border-[#C4B89D59] text-gray-700 hover:bg-gray-50 px-8 py-2"
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateImageConfiguration;
