import React, { useEffect, useMemo, useRef, useState } from "react";
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
import {
  ENDPOINTS,
  getCrmAdminRequestConfig,
  getFullUrl,
} from "@/config/apiConfig";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// ─── Component ────────────────────────────────────────────────────────────────

interface BMSDocumentsUploadProps {
  pageTitle?: string;
  onUploadSuccess?: () => void;
  returnPath?: string;
}

interface AttachmentTreeNode {
  id: string | number;
  parent: string | number;
  text: string;
  icon?: string;
  a_attr?: {
    href?: string;
  };
}

interface FlatOption {
  id: string;
  name: string;
  societyFlatId: string;
}

const COMMON_SHARING_TYPE = "common";
const FLAT_SPECIFIC_SHARING_TYPE = "flat_specific";

/**
 * Mirrors BMSDocumentsFlatRelated's isFile check:
 * a node is a file if its id starts with "documents_".
 */
const isAttachmentFileNode = (node: AttachmentTreeNode): boolean =>
  String(node.id).startsWith("documents_");

/**
 * Returns the top-level flat folders — exactly the nodes shown as
 * root folders in BMSDocumentsFlatRelated.
 * Rule: parent === "#" AND NOT a file node.
 */
/** Map jsTree flat node id (e.g. "j1_5") to society_flat_id for the upload API */
const extractSocietyFlatId = (flatTreeId: string): string => {
  const id = String(flatTreeId).trim();
  if (!id) return "";

  const suffix = lastUnderscoreSegment(id);
  if (suffix && /^\d+$/.test(suffix)) return suffix;
  if (/^\d+$/.test(id)) return id;

  return id.replace(/\D/g, "");
};

const lastUnderscoreSegment = (value: string): string => {
  const idx = value.lastIndexOf("_");
  return idx >= 0 ? value.slice(idx + 1) : "";
};

const getSocietyFlatIdFromNode = (node: AttachmentTreeNode): string => {
  const hrefMatch = node.a_attr?.href?.match(/society_flats\/(\d+)/);
  if (hrefMatch?.[1]) return hrefMatch[1];

  return extractSocietyFlatId(String(node.id));
};

const getFlatOptionsFromAttachmentTree = (
  nodes: AttachmentTreeNode[] = []
): FlatOption[] => {
  const seen = new Set<string>();
  return nodes.reduce<FlatOption[]>((options, node) => {
    if (String(node.parent) !== "#") return options;
    if (isAttachmentFileNode(node)) return options;

    const id = String(node.id);
    const name = String(node.text ?? "").trim();
    if (!id || !name || seen.has(id)) return options;

    seen.add(id);
    options.push({ id, name, societyFlatId: getSocietyFlatIdFromNode(node) });
    return options;
  }, []);
};

const BMSDocumentsUpload: React.FC<BMSDocumentsUploadProps> = ({
  pageTitle = "Upload Folder & Files",
  onUploadSuccess,
  returnPath = "/bms/documents/common-files",
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const locationState = location.state as
    | { returnPath?: string; fromFlatRelated?: boolean }
    | null;
  const stateReturnPath = locationState?.returnPath;
  const finalReturnPath = stateReturnPath || returnPath;

  // If we arrived from the Flat Related page, pre-select "Files" + Share=Flats
  const cameFromFlat =
    location.pathname === "/bms/documents/upload-flat" ||
    locationState?.fromFlatRelated === true ||
    stateReturnPath === "/bms/documents/flat-related";

  const [uploadType, setUploadType] = useState<"folder" | "files">(
    cameFromFlat ? "files" : "folder"
  );
  const [folderName, setFolderName] = useState("");
  const [uploadDate, setUploadDate] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [shareAccess, setShareAccess] = useState(
    cameFromFlat ? "true" : "false"
  );
  const [shareOption, setShareOption] = useState(
    cameFromFlat ? "Flats" : "All"
  );

  // Share with states
  const [isOwner, setIsOwner] = useState(true);
  const [isTenant, setIsTenant] = useState(false);
  const [isBuilder, setIsBuilder] = useState(false);

  const [occupancyType, setOccupancyType] = useState("primary");
  const [livingStatus, setLivingStatus] = useState("living_here");

  const [selectedFlats, setSelectedFlats] = useState<string[]>([]);
  const [flatSearchQuery, setFlatSearchQuery] = useState("");

  const [loading, setLoading] = useState(false);

  const {
    data: flatAttachmentNodes,
    isLoading: isFlatListLoading,
    isError: isFlatListError,
    refetch: refetchFlatList,
  } = useQuery<AttachmentTreeNode[]>({
    queryKey: ["flat-related-documents"],
    queryFn: async () => {
      const { data } = await axios.get(
        getFullUrl(ENDPOINTS.ATTACHMENTS),
        getCrmAdminRequestConfig()
      );

      return Array.isArray(data) ? data : [];
    },
    retry: 1,
    staleTime: 30000,
  });

  const flatsList = useMemo(
    () => getFlatOptionsFromAttachmentTree(flatAttachmentNodes),
    [flatAttachmentNodes]
  );

  const filteredFlats = useMemo(() => {
    const query = flatSearchQuery.trim().toLowerCase();
    if (!query) return flatsList;

    return flatsList.filter((flat) => flat.name.toLowerCase().includes(query));
  }, [flatSearchQuery, flatsList]);

  const allFlatIds = useMemo(
    () => flatsList.map((flat) => flat.id),
    [flatsList]
  );

  const allFlatsSelected =
    allFlatIds.length > 0 &&
    allFlatIds.every((id) => selectedFlats.includes(id));

  useEffect(() => {
    const validFlatIds = new Set(allFlatIds);
    setSelectedFlats((current) =>
      current.filter((flatId) => validFlatIds.has(flatId))
    );
  }, [allFlatIds]);

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

    if (
      uploadType === "files" &&
      (!selectedFiles || selectedFiles.length === 0)
    ) {
      toast.error("Please select at least one file");
      return;
    }

    if (cameFromFlat || (shareAccess === "true" && shareOption === "Flats")) {
      if (isFlatListLoading) {
        toast.error("Flat list is still loading. Please wait.");
        return;
      }

      if (selectedFlats.length === 0) {
        toast.error("Please select at least one flat");
        return;
      }
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file_type", uploadType);

      const useFlatSharing =
        cameFromFlat || (shareAccess === "true" && shareOption === "Flats");
      const sharingTypeVal = useFlatSharing
        ? FLAT_SPECIFIC_SHARING_TYPE
        : COMMON_SHARING_TYPE;
      formData.append("sharing_type", sharingTypeVal);

      if (shareAccess === "true" || cameFromFlat) {
        formData.append("primary_radio", occupancyType);
        formData.append("lives_here_radio", livingStatus);

        formData.append("file_permission[is_owner]", isOwner.toString());
        formData.append("file_permission[is_tenant]", isTenant.toString());
        formData.append("file_permission[is_builder]", isBuilder.toString());

        if (useFlatSharing) {
          selectedFlats.forEach((id) => {
            const societyFlatId =
              flatsList.find((flat) => flat.id === id)?.societyFlatId ||
              extractSocietyFlatId(id);
            if (societyFlatId) {
              formData.append(
                "shared_file_document[society_flat_id][]",
                societyFlatId
              );
            }
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

      const url = getFullUrl(ENDPOINTS.SHARE_MULTIPLE_DOCUMENTS);
      const { params, headers } = getCrmAdminRequestConfig();

      await axios.post(url, formData, {
        params,
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(
        uploadType === "folder"
          ? `Folder "${folderName}" uploaded successfully!`
          : `${selectedFiles.length} file(s) uploaded successfully!`
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["attachment-common"] }),
        queryClient.invalidateQueries({ queryKey: ["common-files"] }),
        queryClient.refetchQueries({ queryKey: ["flat-related-documents"] }),
      ]);

      resetForm();
      if (onUploadSuccess) {
        onUploadSuccess();
      }

      if (cameFromFlat) {
        navigate(finalReturnPath, {
          replace: true,
          state: { expandFlatIds: selectedFlats, fromUpload: true },
        });
      }
    } catch (err: unknown) {
      const errorMessage = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string } | undefined)?.message ||
          err.message
        : err instanceof Error
          ? err.message
          : "Failed to upload.";

      toast.error(errorMessage || "Failed to upload.");
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setShareAccess(cameFromFlat ? "true" : "false");
    setShareOption(cameFromFlat ? "Flats" : "All");
    setUploadType(cameFromFlat ? "files" : "folder");
    setSelectedFlats([]);
    setFlatSearchQuery("");
    setIsOwner(true);
    setIsTenant(false);
    setIsBuilder(false);
    setOccupancyType("primary");
    setLivingStatus("living_here");
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
                      disabled={cameFromFlat}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setShareAccess("true");
                        } else {
                          setShareAccess("false");
                          setShareOption("All");
                          setSelectedFlats([]);
                          setFlatSearchQuery("");
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
                      onChange={(e) => {
                        const nextShareOption = e.target.value;
                        setShareOption(nextShareOption);

                        if (nextShareOption === "All") {
                          setSelectedFlats([]);
                        }
                      }}
                      label="Share With"
                      notched
                      displayEmpty
                    >
                      {!cameFromFlat && <MenuItem value="All">All</MenuItem>}
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
                    ref={fileInputRef}
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
            {shareAccess === "true" && shareOption === "Flats" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-100 mt-2 pt-6">
                {/* Left Column */}
                <div>
                  <h3 className="text-lg font-normal text-gray-700 border-b border-gray-200 pb-2 mb-4">
                    Share with
                  </h3>

                  {/* Share Group Checkboxes */}
                  <div className="flex gap-6 mb-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isOwner}
                        onChange={(e) => setIsOwner(e.target.checked)}
                        className="w-4 h-4 text-[#C72030] focus:ring-[#C72030] rounded border-gray-300"
                        style={{ accentColor: "#C72030" }}
                      />
                      <span className="ml-2 text-sm text-gray-700 font-medium">
                        Owner
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isTenant}
                        onChange={(e) => setIsTenant(e.target.checked)}
                        className="w-4 h-4 text-[#C72030] focus:ring-[#C72030] rounded border-gray-300"
                        style={{ accentColor: "#C72030" }}
                      />
                      <span className="ml-2 text-sm text-gray-700 font-medium">
                        Tenant
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isBuilder}
                        onChange={(e) => setIsBuilder(e.target.checked)}
                        className="w-4 h-4 text-[#C72030] focus:ring-[#C72030] rounded border-gray-300"
                        style={{ accentColor: "#C72030" }}
                      />
                      <span className="ml-2 text-sm text-gray-700 font-medium">
                        Builder
                      </span>
                    </label>
                  </div>

                  {/* Primary / Secondary / All */}
                  <div className="flex gap-6 mb-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="primary"
                        checked={occupancyType === "primary"}
                        onChange={(e) => setOccupancyType(e.target.value)}
                        name="occupancyType"
                        className="w-4 h-4 text-[#C72030] focus:ring-[#C72030] border-gray-300"
                        style={{ accentColor: "#C72030" }}
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Primary
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="secondary"
                        checked={occupancyType === "secondary"}
                        onChange={(e) => setOccupancyType(e.target.value)}
                        name="occupancyType"
                        className="w-4 h-4 text-[#C72030] focus:ring-[#C72030] border-gray-300"
                        style={{ accentColor: "#C72030" }}
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Secondary
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="all"
                        checked={occupancyType === "all"}
                        onChange={(e) => setOccupancyType(e.target.value)}
                        name="occupancyType"
                        className="w-4 h-4 text-[#C72030] focus:ring-[#C72030] border-gray-300"
                        style={{ accentColor: "#C72030" }}
                      />
                      <span className="ml-2 text-sm text-gray-700">All</span>
                    </label>
                  </div>

                  {/* Living Status */}
                  <div className="flex gap-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="living_here"
                        checked={livingStatus === "living_here"}
                        onChange={(e) => setLivingStatus(e.target.value)}
                        name="livingStatus"
                        className="w-4 h-4 text-[#C72030] focus:ring-[#C72030] border-gray-300"
                        style={{ accentColor: "#C72030" }}
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Living Here
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="not_living_here"
                        checked={livingStatus === "not_living_here"}
                        onChange={(e) => setLivingStatus(e.target.value)}
                        name="livingStatus"
                        className="w-4 h-4 text-[#C72030] focus:ring-[#C72030] border-gray-300"
                        style={{ accentColor: "#C72030" }}
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Not Living Here
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="all"
                        checked={livingStatus === "all"}
                        onChange={(e) => setLivingStatus(e.target.value)}
                        name="livingStatus"
                        className="w-4 h-4 text-[#C72030] focus:ring-[#C72030] border-gray-300"
                        style={{ accentColor: "#C72030" }}
                      />
                      <span className="ml-2 text-sm text-gray-700">All</span>
                    </label>
                  </div>
                </div>

                {/* Right Column */}
                {shareOption === "Flats" && (
                  <div>
                    <h3 className="text-lg font-normal text-gray-700 border-b border-gray-200 pb-2 mb-4">
                      Select Flats
                    </h3>

                    <TextField
                      placeholder="Search"
                      value={flatSearchQuery}
                      onChange={(e) => setFlatSearchQuery(e.target.value)}
                      fullWidth
                      variant="outlined"
                      size="small"
                      sx={{
                        mb: 2,
                        backgroundColor: "#fff",
                        "& .MuiOutlinedInput-root": {
                          height: "35px",
                          fontSize: "14px",
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
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        if (allFlatsSelected) {
                          setSelectedFlats([]);
                        } else {
                          setSelectedFlats(allFlatIds);
                        }
                      }}
                      disabled={isFlatListLoading || flatsList.length === 0}
                      className="text-xs px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 bg-white shadow-sm mb-4"
                    >
                      {allFlatsSelected
                        ? "Deselect All Flats"
                        : "Select All Flats"}
                    </button>

                    <div className="max-h-[300px] overflow-y-auto pr-2">
                      {isFlatListLoading ? (
                        <p className="text-xs text-gray-500">
                          Loading flats...
                        </p>
                      ) : isFlatListError ? (
                        <div className="text-xs text-gray-500">
                          <p className="mb-2 text-red-600">
                            Unable to load flats.
                          </p>
                          <button
                            type="button"
                            onClick={() => refetchFlatList()}
                            className="border border-gray-300 bg-white px-3 py-1.5 text-xs hover:bg-gray-50"
                          >
                            Retry
                          </button>
                        </div>
                      ) : filteredFlats.length === 0 ? (
                        <p className="text-xs text-gray-500">
                          {flatSearchQuery
                            ? "No flats match your search"
                            : "No flats available"}
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-2">
                          {filteredFlats.map((flat) => (
                            <label
                              key={flat.id}
                              className="flex items-center cursor-pointer border-b border-gray-100 border-dashed pb-2"
                            >
                              <input
                                type="checkbox"
                                checked={selectedFlats.includes(flat.id)}
                                onChange={(e) => {
                                  if (e.target.checked)
                                    setSelectedFlats((p) => [...p, flat.id]);
                                  else
                                    setSelectedFlats((p) =>
                                      p.filter((id) => id !== flat.id)
                                    );
                                }}
                                className="w-4 h-4 text-[#C72030] focus:ring-[#C72030] rounded border-gray-300"
                                style={{ accentColor: "#C72030" }}
                              />
                              <span className="ml-2 text-xs text-gray-600">
                                {flat.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
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
