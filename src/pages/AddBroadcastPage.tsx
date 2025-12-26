import { useEffect, useState, useRef } from "react";
import {
  TextField,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox as MuiCheckbox,
} from "@mui/material";
import { ArrowLeft, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/store/hooks";
import { fetchFMUsers } from "@/store/slices/fmUserSlice";
import { toast } from "sonner";
import { fetchUserGroups } from "@/store/slices/userGroupSlice";
import { createBroadcast } from "@/store/slices/broadcastSlice";

export const AddBroadcastPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = localStorage.getItem("token");
  const baseUrl = localStorage.getItem("baseUrl");

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    markAsImportant: false,
    endDate: "",
    endTime: "",
    shareWith: "all",
    selectedIndividuals: [],
    selectedGroups: [],
  });
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await dispatch(fetchFMUsers()).unwrap();
        setUsers(response.users);
      } catch (error) {
        console.log(error);
        toast.error("Failed to fetch users");
      }
    };

    const fetchGroups = async () => {
      try {
        const response = await dispatch(fetchUserGroups({ baseUrl, token })).unwrap();
        setGroups(response);
      } catch (error) {
        console.error("Failed to fetch groups:", error);
        toast.error("Failed to fetch groups");
      }
    };

    fetchUsers();
    fetchGroups();
  }, [dispatch, baseUrl, token]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.title) {
      toast.error("Title is required");
      return false;
    } else if (!formData.endDate) {
      toast.error("End date is required");
      return false;
    } else if (!formData.endTime) {
      toast.error("End Time is required");
      return false;
    } else if (!formData.description) {
      toast.error("Description is required");
      return false;
    } else if (formData.description.length > 255) {
      toast.error("Description cannot exceed 255 characters");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true)
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("noticeboard[notice_heading]", formData.title);
      formDataToSend.append(
        "noticeboard[expire_time]",
        `${formData.endDate}T${formData.endTime}`
      );
      formDataToSend.append("noticeboard[notice_text]", formData.description);
      formDataToSend.append("noticeboard[shared]", formData.shareWith === "all" ? "2" : "1");
      formDataToSend.append("noticeboard[of_phase]", "pms");
      formDataToSend.append("noticeboard[of_atype]", "Pms::Site");
      formDataToSend.append("noticeboard[of_atype_id]", localStorage.getItem("selectedSiteId") || "");
      formDataToSend.append("noticeboard[publish]", "1");

      if (formData.shareWith === 'individuals') {
        formDataToSend.append("noticeboard[swusers]", formData.selectedIndividuals);
      }

      if (formData.shareWith === 'groups') {
        formDataToSend.append("noticeboard[group_id]", formData.selectedGroups);
      }

      attachments.forEach((file) => {
        formDataToSend.append("noticeboard[files_attached][]", file);
      });

      await dispatch(createBroadcast({ data: formDataToSend, baseUrl, token })).unwrap();
      toast.success("Broadcast created successfully");
      navigate(-1);
    } catch (error) {
      console.log(error);
      toast.error(error);
    } finally {
      setIsSubmitting(false)
    }
  };

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      );
      setAttachments((prev) => [...prev, ...newFiles]);
      event.target.value = ""; // Reset file input
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors mr-2"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span>Broadcast List</span>
          <span>{">"}</span>
          <span className="text-gray-900 font-medium">Create Broadcast</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">CREATE BROADCAST</h1>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
        {/* Communication Information Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: '#E5E0D3' }}>
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#C72030' }}>
                <FileText size={16} color="#fff" />
              </span>
              Communication Information
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TextField
                label={<span>Title<span className="text-red-500">*</span></span>}
                placeholder="Title"
                fullWidth
                variant="outlined"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={fieldStyles}
              />
              <TextField
                label={<span>End Date<span className="text-red-500">*</span></span>}
                type="date"
                fullWidth
                variant="outlined"
                value={formData.endDate}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={fieldStyles}
                inputProps={{
                  min: new Date().toISOString().split("T")[0],
                }}
              />
              <TextField
                label={<span>End Time<span className="text-red-500">*</span></span>}
                type="time"
                fullWidth
                variant="outlined"
                value={formData.endTime}
                onChange={(e) => handleInputChange("endTime", e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={fieldStyles}
              />
            </div>
            <div className="mt-6 relative">
              <TextField
                label={<span>Description<span className="text-red-500">*</span></span>}
                placeholder="Enter Description"
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: 'auto !important',
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
                }}
              />
              <span className="absolute bottom-2 right-3 text-xs" style={{ color: formData.description.length > 255 ? 'red' : 'gray' }}>
                {formData.description.length}/255
              </span>
            </div>
          </div>
        </div>

        {/* Broadcast Settings Section */}
        {/* Broadcast Settings Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: '#E5E0D3' }}>
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#C72030' }}>
                <FileText size={16} color="#fff" />
              </span>
              Broadcast Settings
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-6">
              <label className="text-sm font-medium text-gray-700 min-w-[100px]">
                Share with
              </label>
              <RadioGroup
                row
                value={formData.shareWith}
                onChange={(e) => handleInputChange("shareWith", e.target.value)}
              >
                <FormControlLabel 
                  value="all" 
                  control={<Radio sx={{ '&.Mui-checked': { color: '#C72030' } }} />} 
                  label="All" 
                />
                <FormControlLabel
                  value="individuals"
                  control={<Radio sx={{ '&.Mui-checked': { color: '#C72030' } }} />}
                  label="Individuals"
                />
                <FormControlLabel
                  value="groups"
                  control={<Radio sx={{ '&.Mui-checked': { color: '#C72030' } }} />}
                  label="Groups"
                />
              </RadioGroup>
            </div>

            {formData.shareWith === "individuals" && (
              <div className="max-w-md">
                <FormControl fullWidth variant="outlined" sx={{ '& .MuiInputBase-root': fieldStyles }}>
                  <InputLabel shrink>Select Individuals</InputLabel>
                  <MuiSelect
                    multiple
                    value={formData.selectedIndividuals}
                    onChange={(e) =>
                      handleInputChange("selectedIndividuals", e.target.value)
                    }
                    label="Select Individuals"
                    notched
                  >
                    <MenuItem value="Select" disabled>
                      Select Users
                    </MenuItem>
                    {users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.full_name}
                      </MenuItem>
                    ))}
                  </MuiSelect>
                </FormControl>
              </div>
            )}

            {formData.shareWith === "groups" && (
              <div className="max-w-md">
                <FormControl fullWidth variant="outlined" sx={{ '& .MuiInputBase-root': fieldStyles }}>
                  <InputLabel shrink>Select Groups</InputLabel>
                  <MuiSelect
                    multiple
                    value={formData.selectedGroups}
                    onChange={(e) => handleInputChange("selectedGroups", e.target.value)}
                    label="Select Groups"
                    notched
                  >
                    <MenuItem value="Select" disabled>
                      Select Groups
                    </MenuItem>
                    {groups.map((group) => (
                      <MenuItem key={group.id} value={group.id}>
                        {group.name}
                      </MenuItem>
                    ))}
                  </MuiSelect>
                </FormControl>
              </div>
            )}

            <div>
              <FormControlLabel
                control={
                  <MuiCheckbox
                    checked={formData.markAsImportant}
                    onChange={(e) =>
                      handleInputChange("markAsImportant", e.target.checked)
                    }
                    sx={{ '&.Mui-checked': { color: '#C72030' } }}
                  />
                }
                label="Mark as Important"
              />
            </div>
          </div>
        </div>

        {/* Upload Files Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: '#E5E0D3' }}>
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#C72030' }}>
                <FileText size={16} color="#fff" />
              </span>
              Attachments
            </h2>
          </div>
          <div className="p-6">
            <div
              onClick={handleFileUpload}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
            >
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                Choose files | {attachments.length > 0 ? `${attachments.length} file(s) chosen` : "No file chosen"}
              </p>
            </div>

            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              ref={fileInputRef}
              onChange={handleFileChange}
            />

            {attachments.length > 0 && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {attachments.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-red-50 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                    <p className="mt-1 text-xs text-gray-600 truncate">{file.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 justify-center pt-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-2 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#C72030] hover:bg-[#B8252F] text-white px-8 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
};