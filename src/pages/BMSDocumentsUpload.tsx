import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Upload,
  File,
  X,
  Plus,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import {
  TextField,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  Avatar,
  Box,
} from "@mui/material";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import axios from "axios";
import { getAuthHeader, getFullUrl } from "@/config/apiConfig";

// ─── Component ────────────────────────────────────────────────────────────────

interface BMSDocumentsUploadProps {
  pageTitle?: string;
  onUploadSuccess?: () => void;
  returnPath?: string;
}

const BMSDocumentsUpload: React.FC<BMSDocumentsUploadProps> = ({
  pageTitle = "Upload Folder & Files",
  onUploadSuccess,
  returnPath = "/bms/documents/common-files",
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const stateReturnPath = (location.state as { returnPath?: string } | null)
    ?.returnPath;
  const finalReturnPath = stateReturnPath || returnPath;

  const [uploadType, setUploadType] = useState<"folder" | "files">("folder");
  const [folderName, setFolderName] = useState("");
  const [uploadDate, setUploadDate] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [shareAccess, setShareAccess] = useState("false");
  const [shareOption, setShareOption] = useState("All");

  // Share with states
  const [isOwner, setIsOwner] = useState(true);
  const [isTenant, setIsTenant] = useState(false);
  const [isBuilder, setIsBuilder] = useState(false);
  
  const [occupancyType, setOccupancyType] = useState("primary");
  const [livingStatus, setLivingStatus] = useState("living_here");

  // Dummy mapping for demo flats to IDs, in real usage this comes from API
  const flatsList = [
    { name: "FM Office", id: "1" },
    { name: "A 101", id: "2" },
    { name: "A 102", id: "10103" },
    { name: "A 103", id: "10104" },
    { name: "A 104", id: "10105" },
    { name: "A 105", id: "10106" },
  ];
  const [selectedFlats, setSelectedFlats] = useState<string[]>([]);
  const [selectAllFlats, setSelectAllFlats] = useState(false);

  const [loading, setLoading] = useState(false);

  // Field styles for Material-UI components
  const fieldStyles = {
    height: "45px",
    backgroundColor: "#fff",
    borderRadius: "4px",
    "& .MuiOutlinedInput-root": {
      height: "45px",
      "& fieldset": {
        borderColor: "#ddd",
      },
      "&:hover fieldset": {
        borderColor: "#C72030",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#C72030",
      },
    },
    "& .MuiInputLabel-root": {
      "&.Mui-focused": {
        color: "#C72030",
      },
    },
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitUpload = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (uploadType === "folder" && !folderName.trim()) {
      toast.error("Folder name is required");
      return;
    }
    
    if (uploadType === "files" && (!selectedFiles || selectedFiles.length === 0)) {
      toast.error("Please select at least one file");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file_type", uploadType);
      
      const sharingTypeVal = shareOption === "Flats" ? "flats" : "common";
      formData.append("sharing_type", sharingTypeVal);
      
      if (shareAccess === "true") {
        formData.append("primary_radio", occupancyType);
        formData.append("lives_here_radio", livingStatus);
        
        formData.append("file_permissions[is_owner]", isOwner.toString());
        formData.append("file_permissions[is_tenant]", isTenant.toString());
        formData.append("file_permissions[is_builder]", isBuilder.toString());
        
        if (shareOption === "Flats") {
          selectedFlats.forEach(id => {
            formData.append("shared_file_document[society_flat_id][]", id);
          });
        }
      }

      if (uploadType === "folder") {
        formData.append("folder[name]", folderName);
        if (uploadDate) {
          const parts = uploadDate.split("-");
          if (parts.length === 3) {
            const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
            formData.append("folder[date_of_upload]", formattedDate);
          } else {
            formData.append("folder[date_of_upload]", uploadDate);
          }
        }
        if (description) formData.append("folder[description]", description);
      }

      selectedFiles.forEach((file) => {
        formData.append("flat_document[content][]", file);
      });

      const url = getFullUrl(`/crm/admin/share_multiple_documents.json`);

      await axios.post(url, formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: getAuthHeader()
        }
      });
      
      toast.success(
        uploadType === "folder" 
          ? `Folder "${folderName}" uploaded successfully!` 
          : `${selectedFiles.length} file(s) uploaded successfully!`
      );

      resetForm();
      if (onUploadSuccess) {
        onUploadSuccess();
      } else {
        navigate(finalReturnPath);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to upload.");
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFolderName("");
    setUploadDate("");
    setDescription("");
    setSelectedFiles([]);
    setShareAccess("false");
    setShareOption("All");
    setUploadType("folder");
  };

  const handleCancel = () => {
    navigate(finalReturnPath);
  };

  return (
    <div
      className="p-6 bg-gray-50 min-h-screen"
      style={{ backgroundColor: "#FAF9F7" }}
    >
      {/* Back Button */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">{pageTitle}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmitUpload} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div
            className="px-6 py-3 border-b border-gray-200"
            style={{ backgroundColor: "#F6F4EE" }}
          >
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: "#E5E0D3",
                  mr: 1.5,
                }}
              >
                <SettingsOutlinedIcon sx={{ fontSize: 18, color: "#C72030" }} />
              </Avatar>
              Upload Information
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Type <span style={{ color: "#C72030" }}>*</span>
              </label>
              <div className="flex gap-6 mb-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="uploadType"
                    value="folder"
                    checked={uploadType === "folder"}
                    onChange={() => setUploadType("folder")}
                    className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                    style={{ accentColor: "#C72030" }}
                  />
                  <span className="ml-2 text-sm text-gray-700">Folder</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="uploadType"
                    value="files"
                    checked={uploadType === "files"}
                    onChange={() => setUploadType("files")}
                    className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                    style={{ accentColor: "#C72030" }}
                  />
                  <span className="ml-2 text-sm text-gray-700">Files</span>
                </label>
              </div>
            </div>

            {uploadType === "folder" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <TextField
                  label={
                    <span>
                      Folder Name <span style={{ color: "#C72030" }}>*</span>
                    </span>
                  }
                  placeholder="Enter folder name"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  name="folderName"
                  fullWidth
                  variant="outlined"
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  InputProps={{
                    sx: fieldStyles,
                  }}
                />

                <TextField
                  label={
                    <span>
                      Date <span style={{ color: "#C72030" }}>*</span>
                    </span>
                  }
                  type="date"
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                  name="uploadDate"
                  fullWidth
                  variant="outlined"
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  InputProps={{
                    sx: fieldStyles,
                  }}
                />

                <div className="md:col-span-3">
                  <TextField
                    label="Description"
                    placeholder="Enter description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    name="description"
                    fullWidth
                    multiline
                    rows={4}
                    variant="outlined"
                    slotProps={{
                      inputLabel: {
                        shrink: true,
                      },
                    }}
                    sx={{
                      backgroundColor: "#fff",
                      borderRadius: "4px",
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                          borderColor: "#ddd",
                        },
                        "&:hover fieldset": {
                          borderColor: "#C72030",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#C72030",
                        },
                      },
                      "& .MuiInputLabel-root": {
                        "&.Mui-focused": {
                          color: "#C72030",
                        },
                      },
                    }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Share Access */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share<span style={{ color: "#C72030" }}>*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="shareAccess"
                      checked={shareAccess === "true"}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setShareAccess("true");
                        } else {
                          setShareAccess("false");
                          setShareOption("All");
                        }
                      }}
                      className="w-4 h-4 text-[#C72030] focus:ring-[#C72030] rounded border-gray-300"
                      style={{ accentColor: "#C72030" }}
                    />
                    <span className="ml-2 text-sm text-gray-700">Yes</span>
                  </label>
                </div>
              </div>

              {/* Share Option - Only show if Share Access is Yes */}
              {shareAccess === "true" && (
                <div>
                  <FormControl
                    fullWidth
                    variant="outlined"
                    sx={{ "& .MuiInputBase-root": fieldStyles }}
                  >
                    <InputLabel shrink>Share With</InputLabel>
                    <MuiSelect
                      value={shareOption}
                      onChange={(e) => setShareOption(e.target.value)}
                      label="Share With"
                      notched
                      displayEmpty
                    >
                      <MenuItem value="All">All</MenuItem>
                      <MenuItem value="Flats">Flats</MenuItem>
                    </MuiSelect>
                  </FormControl>
                </div>
              )}
            </div>

            {/* Select Files */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Files{" "}
                {uploadType === "files" && (
                  <span style={{ color: "#C72030" }}>*</span>
                )}
              </label>

              <div className="flex flex-wrap gap-4 items-start">
                {/* Always-visible small upload button box */}
                <label className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-[#D9D9D9] rounded-lg w-[130px] h-[40px] bg-gray-50/50 hover:bg-gray-100 transition-colors shrink-0">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Upload className="w-6 h-6 text-[#C72030] mb-2" />
                  <span className="text-xs font-semibold text-[#C72030]">
                    Choose File
                  </span>
                </label>

                {/* Display uploaded files */}
                {selectedFiles.length > 0 &&
                  selectedFiles.map((file, index) => {
                    const isExcel =
                      file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
                    const isCsv = file.name.endsWith(".csv");
                    const isImage = file.type.startsWith("image/");

                    return (
                      <div
                        key={`${file.name}-${index}`}
                        className="relative flex flex-col items-center border rounded-md pt-5 px-2 pb-2 w-[130px] h-[130px] bg-[#F6F4EE] shadow-sm shrink-0"
                      >
                        {isImage ? (
                          <div className="w-14 h-14 flex flex-shrink-0 items-center justify-center bg-white border rounded mb-1.5 overflow-hidden">
                            <img
                              src={URL.createObjectURL(file)}
                              alt=""
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : isExcel ? (
                          <div className="w-14 h-14 flex flex-shrink-0 items-center justify-center border rounded text-green-600 bg-white mb-1.5">
                            <FileSpreadsheet className="w-6 h-6" />
                          </div>
                        ) : isCsv ? (
                          <div className="w-14 h-14 flex flex-shrink-0 items-center justify-center border rounded text-blue-600 bg-white mb-1.5">
                            <FileText className="w-6 h-6" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 flex flex-shrink-0 items-center justify-center bg-white border rounded text-gray-500 mb-1.5">
                            <File className="w-6 h-6" />
                          </div>
                        )}
                        <span
                          className="text-[10px] text-center font-medium truncate w-full px-1 mb-0.5"
                          title={file.name}
                        >
                          {file.name}
                        </span>
                        <span className="text-[9px] text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <button
                          type="button"
                          className="absolute top-1 right-1 h-5 w-5 p-0 text-gray-600 bg-white rounded-full border border-gray-300 flex items-center justify-center hover:bg-red-100 hover:text-red-600"
                          onClick={() => removeFile(index)}
                          disabled={loading}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Share Settings */}
            {shareAccess === "true" && (
              <div className={`grid grid-cols-1 ${shareOption === "Flats" ? "md:grid-cols-2" : "md:grid-cols-1"} gap-8 border-t border-gray-100 mt-2 pt-6`}>
                {/* Left Column */}
                <div>
                  <h3 className="text-lg font-normal text-gray-700 border-b border-gray-200 pb-2 mb-4">Share with</h3>
                  
                  {/* Share Group Checkboxes */}
                  <div className="flex gap-6 mb-6">
                    <label className="flex items-center cursor-pointer">
                      <input type="checkbox" checked={isOwner} onChange={(e) => setIsOwner(e.target.checked)} className="w-4 h-4 text-[#C72030] focus:ring-[#C72030] rounded border-gray-300" style={{ accentColor: '#C72030' }} />
                      <span className="ml-2 text-sm text-gray-700 font-medium">Owner</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input type="checkbox" checked={isTenant} onChange={(e) => setIsTenant(e.target.checked)} className="w-4 h-4 text-[#C72030] focus:ring-[#C72030] rounded border-gray-300" style={{ accentColor: '#C72030' }} />
                      <span className="ml-2 text-sm text-gray-700 font-medium">Tenant</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input type="checkbox" checked={isBuilder} onChange={(e) => setIsBuilder(e.target.checked)} className="w-4 h-4 text-[#C72030] focus:ring-[#C72030] rounded border-gray-300" style={{ accentColor: '#C72030' }} />
                      <span className="ml-2 text-sm text-gray-700 font-medium">Builder</span>
                    </label>
                  </div>

                  {/* Primary / Secondary / All */}
                  <div className="flex gap-6 mb-6">
                    <label className="flex items-center cursor-pointer">
                      <input type="radio" value="primary" checked={occupancyType === "primary"} onChange={(e) => setOccupancyType(e.target.value)} name="occupancyType" className="w-4 h-4 text-[#C72030] focus:ring-[#C72030] border-gray-300" style={{ accentColor: '#C72030' }} />
                      <span className="ml-2 text-sm text-gray-700">Primary</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input type="radio" value="secondary" checked={occupancyType === "secondary"} onChange={(e) => setOccupancyType(e.target.value)} name="occupancyType" className="w-4 h-4 text-[#C72030] focus:ring-[#C72030] border-gray-300" style={{ accentColor: '#C72030' }} />
                      <span className="ml-2 text-sm text-gray-700">Secondary</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input type="radio" value="all" checked={occupancyType === "all"} onChange={(e) => setOccupancyType(e.target.value)} name="occupancyType" className="w-4 h-4 text-[#C72030] focus:ring-[#C72030] border-gray-300" style={{ accentColor: '#C72030' }} />
                      <span className="ml-2 text-sm text-gray-700">All</span>
                    </label>
                  </div>

                  {/* Living Status */}
                  <div className="flex gap-6">
                    <label className="flex items-center cursor-pointer">
                      <input type="radio" value="living_here" checked={livingStatus === "living_here"} onChange={(e) => setLivingStatus(e.target.value)} name="livingStatus" className="w-4 h-4 text-[#C72030] focus:ring-[#C72030] border-gray-300" style={{ accentColor: '#C72030' }} />
                      <span className="ml-2 text-sm text-gray-700">Living Here</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input type="radio" value="not_living_here" checked={livingStatus === "not_living_here"} onChange={(e) => setLivingStatus(e.target.value)} name="livingStatus" className="w-4 h-4 text-[#C72030] focus:ring-[#C72030] border-gray-300" style={{ accentColor: '#C72030' }} />
                      <span className="ml-2 text-sm text-gray-700">Not Living Here</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input type="radio" value="all" checked={livingStatus === "all"} onChange={(e) => setLivingStatus(e.target.value)} name="livingStatus" className="w-4 h-4 text-[#C72030] focus:ring-[#C72030] border-gray-300" style={{ accentColor: '#C72030' }} />
                      <span className="ml-2 text-sm text-gray-700">All</span>
                    </label>
                  </div>
                </div>

                {/* Right Column */}
                {shareOption === "Flats" && (
                  <div>
                    <h3 className="text-lg font-normal text-gray-700 border-b border-gray-200 pb-2 mb-4">Select Flats</h3>
                    
                    <TextField
                      placeholder="Search"
                      fullWidth
                      variant="outlined"
                      size="small"
                      sx={{
                        mb: 2,
                        backgroundColor: '#fff',
                        '& .MuiOutlinedInput-root': {
                          height: '35px', 
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
                        }
                      }}
                    />
                    
                    <button 
                      type="button" 
                      onClick={() => {
                        if (selectAllFlats) {
                          setSelectedFlats([]);
                          setSelectAllFlats(false);
                        } else {
                          setSelectedFlats(flatsList.map(f => f.id));
                          setSelectAllFlats(true);
                        }
                      }}
                      className="text-xs px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 bg-white shadow-sm mb-4"
                    >
                      {selectAllFlats ? "Deselect All Flats" : "Select All Flats"}
                    </button>
  
                    <div className="max-h-[300px] overflow-y-auto pr-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-2">
                         {flatsList.map((flat) => (
                            <label key={flat.id} className="flex items-center cursor-pointer border-b border-gray-100 border-dashed pb-2">
                               <input 
                                 type="checkbox" 
                                 checked={selectedFlats.includes(flat.id)}
                                 onChange={(e) => {
                                   if (e.target.checked) setSelectedFlats(p => [...p, flat.id]);
                                   else setSelectedFlats(p => p.filter(id => id !== flat.id));
                                 }}
                                 className="w-4 h-4 text-[#C72030] focus:ring-[#C72030] rounded border-gray-300" 
                                 style={{ accentColor: '#C72030' }} 
                               />
                               <span className="ml-2 text-xs text-gray-600">{flat.name}</span>
                            </label>
                         ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-6">
          <button
            type="button"
            onClick={handleCancel}
            className="bg-[#C4B89D59] text-[#C72030] hover:bg-[#C4B89D59]/90 h-9 px-6 text-sm font-medium rounded-md min-w-[120px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-[#C72030] text-white hover:bg-[#B8252F] h-9 px-6 text-sm font-medium rounded-md min-w-[120px]"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default BMSDocumentsUpload;
