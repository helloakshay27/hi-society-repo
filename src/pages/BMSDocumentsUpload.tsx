import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ChevronRight,
  Upload,
  File,
  X,
  FileText,
  FileSpreadsheet,
  FolderUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  TextField,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
} from "@mui/material";
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
  pageTitle = "",
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

  const fieldStyles = {
    backgroundColor: "#fff",
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

    if (shareAccess === "true" && shareOption === "Flats") {
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

      const useFlatSharing = shareAccess === "true" && shareOption === "Flats";
      const sharingTypeVal = useFlatSharing
        ? FLAT_SPECIFIC_SHARING_TYPE
        : COMMON_SHARING_TYPE;
      formData.append("sharing_type", sharingTypeVal);

      if (shareAccess === "true") {
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
        queryClient.invalidateQueries({ queryKey: ["flat-related-documents"] }),
      ]);

      resetForm();
      if (onUploadSuccess) {
        onUploadSuccess();
      }

      if (shareAccess === "true" && shareOption === "Flats") {
        navigate("/bms/documents/flat-related", {
          replace: true,
          state: { expandFlatIds: selectedFlats, fromUpload: true },
        });
      } else if (cameFromFlat) {
        navigate(finalReturnPath, {
          replace: true,
          state: { expandFlatIds: selectedFlats, fromUpload: true },
        });
      } else {
        navigate("/bms/documents/common-files", {
          replace: true,
          state: { fromUpload: true },
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

  const uploadHeading = pageTitle || (uploadType === "folder" ? "Upload Folder" : "Upload Files");

  return (
    <div className="p-6 min-h-screen docs-upload-page">
      <style>{`
        html body #root .docs-upload-page {
          background-color: #FDFDFB !important;
        }
        html body #root .docs-upload-page .ref-card {
          background: #FFFFFF;
          border: 1px solid rgba(26, 26, 24, 0.09);
          border-radius: 16px;
          overflow: hidden;
        }
        html body #root .docs-upload-page .ref-card + .ref-card {
          margin-top: 16px;
        }
        html body #root .docs-upload-page .ref-card-head {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 22px 24px 0;
        }
        html body #root .docs-upload-page .ref-card-head h2 {
          flex: 1;
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #1A1A18;
        }
        html body #root .docs-upload-page .ref-chip {
          width: 32px;
          height: 32px;
          flex: none;
          border-radius: 9999px;
          background: #F5F4F0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        html body #root .docs-upload-page .ref-chip svg {
          width: 14px;
          height: 14px;
          color: #1A1A18 !important;
          stroke: #1A1A18 !important;
        }
        html body #root .docs-upload-page .ref-card-body {
          padding: 20px 24px 22px;
        }
        html body #root .docs-upload-page .ref-label {
          display: block;
          margin-bottom: 8px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(26, 26, 24, 0.68);
        }
        html body #root .docs-upload-page .ref-label .req {
          color: #ef4444;
          margin-left: 2px;
        }
        html body #root .docs-upload-page .ref-subhead {
          font-size: 13px;
          font-weight: 600;
          color: #1A1A18;
          margin-bottom: 12px;
        }
        html body #root .docs-upload-page .ref-choice {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13.5px;
          font-weight: 500;
          color: #1A1A18;
          cursor: pointer;
        }
        html body #root .docs-upload-page .ref-choice input {
          width: 16px;
          height: 16px;
          accent-color: #1A1A18 !important;
          cursor: pointer;
        }
        html body #root .docs-upload-page .ref-upload {
          border: 1.5px dashed rgba(26, 26, 24, 0.18) !important;
          border-radius: 14px;
          background: #FAF9F7 !important;
          outline: none !important;
          box-shadow: none !important;
          cursor: pointer;
          transition: border-color 0.16s ease, background-color 0.16s ease;
        }
        html body #root .docs-upload-page .ref-upload:hover {
          border-color: rgba(26, 26, 24, 0.35) !important;
          background: #F5F4F0 !important;
        }
        html body #root .docs-upload-page .ref-upload:focus-visible {
          border-color: #1A1A18 !important;
          box-shadow: 0 0 0 4px rgba(26, 26, 24, 0.1) !important;
        }
        html body #root .docs-upload-page .ref-upload-chip {
          width: 40px;
          height: 40px;
          border-radius: 9999px;
          background: #FFFFFF;
          border: 1px solid rgba(26, 26, 24, 0.09);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        html body #root .docs-upload-page .ref-upload-chip svg {
          width: 18px;
          height: 18px;
          color: rgba(26, 26, 24, 0.55) !important;
          stroke: rgba(26, 26, 24, 0.55) !important;
        }
        html body #root .docs-upload-page .ref-file {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 130px;
          height: 130px;
          padding: 20px 8px 8px;
          border: 1px solid rgba(26, 26, 24, 0.09);
          border-radius: 12px;
          background: #FFFFFF;
        }
        html body #root .docs-upload-page .ref-flat {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border: 1px solid rgba(26, 26, 24, 0.09);
          border-radius: 10px;
          background: #FFFFFF;
          font-size: 13px;
          font-weight: 500;
          color: #1A1A18;
          cursor: pointer;
          transition: border-color 0.16s ease, background-color 0.16s ease;
        }
        html body #root .docs-upload-page .ref-flat:hover {
          border-color: rgba(26, 26, 24, 0.28);
        }
        html body #root .docs-upload-page .ref-flat.is-selected {
          border-color: #1A1A18;
          background: #FAF9F7;
        }
        html body #root .docs-upload-page .ref-flat input {
          width: 15px;
          height: 15px;
          accent-color: #1A1A18 !important;
        }
        html body #root .docs-upload-page .ref-ghost-btn {
          display: inline-flex;
          align-items: center;
          height: 32px;
          padding: 0 12px;
          border: 1px solid rgba(26, 26, 24, 0.12);
          border-radius: 8px;
          background: #FFFFFF;
          font-size: 12px;
          font-weight: 600;
          color: rgba(26, 26, 24, 0.68);
          transition: border-color 0.16s ease, color 0.16s ease;
        }
        html body #root .docs-upload-page .ref-ghost-btn:hover:not(:disabled) {
          border-color: rgba(26, 26, 24, 0.28);
          color: #1A1A18;
        }
        html body #root .docs-upload-page .ref-ghost-btn:disabled {
          opacity: 0.5;
        }
        html body #root .docs-upload-page .MuiOutlinedInput-root {
          min-height: 44px;
          border-radius: 12px !important;
          background-color: #FFFFFF !important;
          font-size: 13.5px !important;
          font-weight: 500;
          color: #1A1A18;
          transition: box-shadow 0.16s ease;
        }
        html body #root .docs-upload-page .MuiOutlinedInput-notchedOutline {
          border-color: rgba(26, 26, 24, 0.08) !important;
          border-radius: 12px !important;
        }
        html body #root .docs-upload-page .MuiOutlinedInput-root:not(.Mui-disabled):hover .MuiOutlinedInput-notchedOutline {
          border-color: rgba(26, 26, 24, 0.28) !important;
        }
        html body #root .docs-upload-page .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
          border-color: #1A1A18 !important;
          border-width: 1px !important;
        }
        html body #root .docs-upload-page .MuiOutlinedInput-root.Mui-focused {
          box-shadow: 0 0 0 4px rgba(26, 26, 24, 0.1) !important;
        }
        html body #root .docs-upload-page .MuiInputLabel-root {
          color: rgba(26, 26, 24, 0.68) !important;
          -webkit-text-fill-color: rgba(26, 26, 24, 0.68) !important;
          font-weight: 600 !important;
        }
        html body #root .docs-upload-page input::placeholder,
        html body #root .docs-upload-page textarea::placeholder {
          color: rgba(26, 26, 24, 0.3) !important;
          opacity: 1;
        }
      `}</style>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            onClick={handleCancel}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[#1A1A18] hover:bg-[#F5F4F0] transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-[13px] text-[rgba(26,26,24,0.55)]">
            {cameFromFlat ? "Flat Related" : "Common Files"}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-[rgba(26,26,24,0.4)]" />
          <span className="text-[13px] font-semibold text-[#1A1A18]">Upload</span>
        </div>
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em] text-[#1A1A18]">
          {uploadHeading}
        </h1>
      </div>

      <form onSubmit={handleSubmitUpload}>
        {/* Upload Information */}
        <div className="ref-card">
          <div className="ref-card-head">
            <span className="ref-chip">
              <FolderUp />
            </span>
            <h2>Upload Information</h2>
          </div>

          <div className="ref-card-body space-y-6">
            {/* Type Selection */}
            <div>
              <span className="ref-label">
                Select Type<span className="req">*</span>
              </span>
              <div className="flex gap-6">
                <label className="ref-choice">
                  <input
                    type="radio"
                    name="uploadType"
                    value="folder"
                    checked={uploadType === "folder"}
                    onChange={() => setUploadType("folder")}
                  />
                  Folder
                </label>
                <label className="ref-choice">
                  <input
                    type="radio"
                    name="uploadType"
                    value="files"
                    checked={uploadType === "files"}
                    onChange={() => setUploadType("files")}
                  />
                  Files
                </label>
              </div>
            </div>

            {uploadType === "folder" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label={<>Folder Name<span className="text-[#ef4444] ml-0.5">*</span></>}
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
                  label={<>Date<span className="text-[#ef4444] ml-0.5">*</span></>}
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

                <div className="md:col-span-2">
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
                    sx={fieldStyles}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {/* Share Access */}
              <div>
                <span className="ref-label">
                  Share<span className="req">*</span>
                </span>
                <label className="ref-choice">
                  <input
                    type="checkbox"
                    name="shareAccess"
                    checked={shareAccess === "true"}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setShareAccess("true");
                        if (cameFromFlat) {
                          setShareOption("Flats");
                        }
                      } else {
                        setShareAccess("false");
                        setShareOption("All");
                        setSelectedFlats([]);
                        setFlatSearchQuery("");
                      }
                    }}
                  />
                  Yes
                </label>
              </div>

              {/* Share Option - Only show if Share Access is Yes */}
              {shareAccess === "true" && (
                <FormControl fullWidth variant="outlined">
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
                    sx={fieldStyles}
                  >
                    {!cameFromFlat && <MenuItem value="All">All</MenuItem>}
                    <MenuItem value="Flats">Flats</MenuItem>
                  </MuiSelect>
                </FormControl>
              )}
            </div>

            {/* Select Files */}
            <div>
              <span className="ref-label">
                Select Files
                {uploadType === "files" && <span className="req">*</span>}
              </span>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="ref-upload w-full flex flex-col items-center justify-center gap-2 px-6 py-7 text-center"
              >
                <span className="ref-upload-chip">
                  <Upload />
                </span>
                <span className="text-[13px] text-[rgba(26,26,24,0.68)]">
                  <span className="font-semibold text-[#1A1A18] underline underline-offset-2">
                    Choose Files
                  </span>{" "}
                  to upload
                </span>
                <span className="text-[11.5px] text-[rgba(26,26,24,0.48)]">
                  {selectedFiles.length > 0
                    ? `${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"} selected`
                    : "You can select multiple files"}
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />

              {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-4 items-start mt-4">

                {selectedFiles.length > 0 &&
                  selectedFiles.map((file, index) => {
                    const isExcel =
                      file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
                    const isCsv = file.name.endsWith(".csv");
                    const isImage = file.type.startsWith("image/");

                    return (
                      <div key={`${file.name}-${index}`} className="ref-file shrink-0">
                        {isImage ? (
                          <div className="w-14 h-14 flex flex-shrink-0 items-center justify-center bg-white border border-[rgba(26,26,24,0.09)] rounded-lg mb-1.5 overflow-hidden">
                            <img
                              src={URL.createObjectURL(file)}
                              alt=""
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : isExcel ? (
                          <div className="w-14 h-14 flex flex-shrink-0 items-center justify-center rounded-lg text-[#56683F] bg-[rgba(121,140,94,0.15)] mb-1.5">
                            <FileSpreadsheet className="w-6 h-6" />
                          </div>
                        ) : isCsv ? (
                          <div className="w-14 h-14 flex flex-shrink-0 items-center justify-center rounded-lg text-[#56683F] bg-[rgba(121,140,94,0.15)] mb-1.5">
                            <FileText className="w-6 h-6" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 flex flex-shrink-0 items-center justify-center rounded-lg text-[rgba(26,26,24,0.55)] bg-[#F5F4F0] mb-1.5">
                            <File className="w-6 h-6" />
                          </div>
                        )}
                        <span
                          className="text-[11px] text-center font-medium text-[#1A1A18] truncate w-full px-1 mb-0.5"
                          title={file.name}
                        >
                          {file.name}
                        </span>
                        <span className="text-[10px] text-[rgba(26,26,24,0.48)]">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <button
                          type="button"
                          className="absolute top-1.5 right-1.5 h-5 w-5 p-0 text-[rgba(26,26,24,0.55)] bg-white rounded-full border border-[rgba(26,26,24,0.12)] flex items-center justify-center hover:bg-[rgba(231,132,142,0.18)] hover:text-[#A63D49]"
                          onClick={() => removeFile(index)}
                          disabled={loading}
                          aria-label="Remove file"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
              </div>
              )}
            </div>
          </div>
        </div>

        {/* Share Settings */}
        {shareAccess === "true" && shareOption === "Flats" && (
          <div className="ref-card">
            <div className="ref-card-head">
              <span className="ref-chip">
                <Users />
              </span>
              <h2>Share Settings</h2>
              {selectedFlats.length > 0 && (
                <span className="text-[12px] font-semibold text-[rgba(26,26,24,0.55)]">
                  {selectedFlats.length} flat{selectedFlats.length === 1 ? "" : "s"} selected
                </span>
              )}
            </div>

            <div className="ref-card-body grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-5">
                <div>
                  <p className="ref-subhead">Share with</p>
                  <div className="flex flex-wrap gap-6">
                    <label className="ref-choice">
                      <input
                        type="checkbox"
                        checked={isOwner}
                        onChange={(e) => setIsOwner(e.target.checked)}
                      />
                      Owner
                    </label>
                    <label className="ref-choice">
                      <input
                        type="checkbox"
                        checked={isTenant}
                        onChange={(e) => setIsTenant(e.target.checked)}
                      />
                      Tenant
                    </label>
                    <label className="ref-choice">
                      <input
                        type="checkbox"
                        checked={isBuilder}
                        onChange={(e) => setIsBuilder(e.target.checked)}
                      />
                      Builder
                    </label>
                  </div>
                </div>

                <div>
                  <span className="ref-label">Occupancy</span>
                  <div className="flex flex-wrap gap-6">
                    <label className="ref-choice">
                      <input
                        type="radio"
                        value="primary"
                        checked={occupancyType === "primary"}
                        onChange={(e) => setOccupancyType(e.target.value)}
                        name="occupancyType"
                      />
                      Primary
                    </label>
                    <label className="ref-choice">
                      <input
                        type="radio"
                        value="secondary"
                        checked={occupancyType === "secondary"}
                        onChange={(e) => setOccupancyType(e.target.value)}
                        name="occupancyType"
                      />
                      Secondary
                    </label>
                    <label className="ref-choice">
                      <input
                        type="radio"
                        value="all"
                        checked={occupancyType === "all"}
                        onChange={(e) => setOccupancyType(e.target.value)}
                        name="occupancyType"
                      />
                      All
                    </label>
                  </div>
                </div>

                <div>
                  <span className="ref-label">Living Status</span>
                  <div className="flex flex-wrap gap-6">
                    <label className="ref-choice">
                      <input
                        type="radio"
                        value="living_here"
                        checked={livingStatus === "living_here"}
                        onChange={(e) => setLivingStatus(e.target.value)}
                        name="livingStatus"
                      />
                      Living Here
                    </label>
                    <label className="ref-choice">
                      <input
                        type="radio"
                        value="not_living_here"
                        checked={livingStatus === "not_living_here"}
                        onChange={(e) => setLivingStatus(e.target.value)}
                        name="livingStatus"
                      />
                      Not Living Here
                    </label>
                    <label className="ref-choice">
                      <input
                        type="radio"
                        value="all"
                        checked={livingStatus === "all"}
                        onChange={(e) => setLivingStatus(e.target.value)}
                        name="livingStatus"
                      />
                      All
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="ref-subhead !mb-0">Select Flats</p>
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
                    className="ref-ghost-btn"
                  >
                    {allFlatsSelected ? "Deselect All" : "Select All"}
                  </button>
                </div>

                <TextField
                  placeholder="Search flats..."
                  value={flatSearchQuery}
                  onChange={(e) => setFlatSearchQuery(e.target.value)}
                  fullWidth
                  variant="outlined"
                  sx={{ mb: 2, ...fieldStyles }}
                />

                <div className="max-h-[300px] overflow-y-auto pr-1">
                  {isFlatListLoading ? (
                    <p className="text-xs text-[rgba(26,26,24,0.55)]">
                      Loading flats...
                    </p>
                  ) : isFlatListError ? (
                    <div className="text-xs text-[rgba(26,26,24,0.55)]">
                      <p className="mb-2 text-[#A63D49]">
                        Unable to load flats.
                      </p>
                      <button
                        type="button"
                        onClick={() => refetchFlatList()}
                        className="ref-ghost-btn"
                      >
                        Retry
                      </button>
                    </div>
                  ) : filteredFlats.length === 0 ? (
                    <p className="text-xs text-[rgba(26,26,24,0.55)]">
                      {flatSearchQuery
                        ? "No flats match your search"
                        : "No flats available"}
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {filteredFlats.map((flat) => {
                        const isSelected = selectedFlats.includes(flat.id);
                        return (
                          <label
                            key={flat.id}
                            className={`ref-flat ${isSelected ? "is-selected" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked)
                                  setSelectedFlats((p) => [...p, flat.id]);
                                else
                                  setSelectedFlats((p) =>
                                    p.filter((id) => id !== flat.id)
                                  );
                              }}
                            />
                            <span className="truncate" title={flat.name}>
                              {flat.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={handleCancel}
            className="btn-cancel h-9 px-4 text-sm font-medium bg-white border border-[#da7756] text-[#da7756] hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary h-9 px-4 text-sm font-medium"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BMSDocumentsUpload;
