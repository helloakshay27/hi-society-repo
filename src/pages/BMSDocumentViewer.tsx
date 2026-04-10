import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  FileText,
  FileVideo,
  Image as ImageIcon,
  FileSpreadsheet,
  File,
  Loader2,
  FolderPlus,
  Folder,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DocumentDetail {
  id: string;
  name: string;
  fileType: string;
  url?: string;
  size?: number;
  createdAt?: string;
}

interface ApiNode {
  id: string | number;
  parent: string | number;
  text: string;
  icon?: string;
  a_attr?: { href: string };
}

interface DocumentNode {
  id: string;
  name: string;
  type: "folder" | "file";
  parent?: string;
  children?: DocumentNode[];
  fileType?: string;
}

const isFile = (node: ApiNode): boolean =>
  String(node.id).startsWith("documents_");

const buildTree = (nodes: ApiNode[]): DocumentNode[] => {
  const map = new Map<string, DocumentNode>();

  for (const n of nodes) {
    const id = String(n.id);
    const file = isFile(n);
    map.set(id, {
      id,
      name: n.text,
      type: file ? "file" : "folder",
      parent: String(n.parent),
      fileType: file ? inferFileType(n.text) : undefined,
      children: file ? undefined : [],
    });
  }

  const roots: DocumentNode[] = [];

  for (const n of nodes) {
    const id = String(n.id);
    const parentId = String(n.parent);
    const node = map.get(id)!;

    if (parentId === "#") {
      roots.push(node);
    } else {
      const parent = map.get(parentId);
      if (parent && parent.children) {
        parent.children.push(node);
      }
    }
  }

  return roots;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getExtension = (name: string): string =>
  name.split(".").pop()?.toLowerCase() ?? "";

const inferFileType = (name: string): string => {
  const ext = getExtension(name);
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "video";
  if (["pdf"].includes(ext)) return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext))
    return "image";
  if (["xls", "xlsx", "csv"].includes(ext)) return "spreadsheet";
  if (["doc", "docx"].includes(ext)) return "doc";
  return "file";
};

const getFileIcon = (fileType?: string, className = "w-5 h-5") => {
  switch (fileType) {
    case "video":
      return <FileVideo className={`${className} text-purple-500`} />;
    case "pdf":
      return <FileText className={`${className} text-red-500`} />;
    case "image":
      return <ImageIcon className={`${className} text-blue-500`} />;
    case "spreadsheet":
      return <FileSpreadsheet className={`${className} text-green-600`} />;
    case "doc":
      return <FileText className={`${className} text-blue-700`} />;
    default:
      return <File className={`${className} text-gray-400`} />;
  }
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes === 0) return "Unknown size";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i)) + " " + sizes[i];
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return "Unknown date";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const isPreviewable = (fileType?: string): boolean => {
  return ["pdf", "image", "video"].includes(fileType || "");
};

// ─── Component ────────────────────────────────────────────────────────────────

const BMSDocumentViewer: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [documentDetail, setDocumentDetail] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [folderFiles, setFolderFiles] = useState<DocumentNode[]>([]);
  const [currentFolder, setCurrentFolder] = useState<DocumentNode | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch all documents from the common files API
        const url = getFullUrl("/crm/admin/attachment_common.json");
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: getAuthHeader(),
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch document");
        }

        const data: ApiNode[] = await response.json();
        
        // Find the current document node
        const currentDocNode = data.find((node: ApiNode) => String(node.id) === id);

        if (currentDocNode && currentDocNode.a_attr?.href) {
          const fileType = inferFileType(currentDocNode.text);
          setDocumentDetail({
            id: String(currentDocNode.id),
            name: currentDocNode.text,
            fileType,
            url: currentDocNode.a_attr.href,
          });

          // For previewable files, fetch the file for preview
          if (isPreviewable(fileType)) {
            setPreviewUrl(currentDocNode.a_attr.href);
          }

          // Build tree to find folder contents
          const tree = buildTree(data);
          const nodeMap = new Map<string, DocumentNode>();
          
          const collectNodes = (nodes: DocumentNode[]) => {
            for (const node of nodes) {
              nodeMap.set(node.id, node);
              if (node.children) {
                collectNodes(node.children);
              }
            }
          };
          collectNodes(tree);

          // Find the current document's parent folder
          const parentId = String(currentDocNode.parent);
          const parentFolder = nodeMap.get(parentId);
          
          if (parentFolder && parentFolder.children) {
            // Get all files from this folder (files only, not subfolders)
            const filesInFolder = parentFolder.children
              .filter((child) => child.type === "file")
              .sort((a, b) => a.name.localeCompare(b.name));
            
            setFolderFiles(filesInFolder);
            setCurrentFolder(parentFolder);
          }
        } else {
          toast.error("Document not found");
        }
      } catch (error) {
        console.error("Error fetching document:", error);
        toast.error("Failed to load document");
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  const handleDownload = () => {
    if (!documentDetail?.url) {
      toast.error("Download URL not available");
      return;
    }

    const link = document.createElement("a");
    link.href = documentDetail.url;
    link.download = documentDetail.name;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Downloading ${documentDetail.name}...`);
  };

  const handleOpenFile = (fileId: string) => {
    navigate(`/bms/documents/view/${fileId}`);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Folder name is required");
      return;
    }

    try {
      // API call to create folder would go here
      toast.success(`Folder "${newFolderName}" created successfully!`);
      setNewFolderName("");
      setIsCreateFolderOpen(false);
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error("Failed to create folder");
    }
  };

  const handleBack = () => {
    navigate("/bms/documents/common-files");
  };

  const handleOpenPreview = () => {
    if (previewUrl) {
      setShowPreview(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="text-gray-500">Loading document...</span>
        </div>
      </div>
    );
  }

  if (!documentDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <File className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Document not found</p>
          <Button onClick={handleBack} variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Documents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <div className="text-sm text-gray-500 mb-1">
                Common Files &gt; Document
              </div>
              <h1 className="text-xl font-semibold text-[#1a1a1a]">
                {documentDetail.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsCreateFolderOpen(true)}
              variant="outline"
              className="h-9"
            >
              + add
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Folder Files */}
          {folderFiles.length > 0 && (
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {currentFolder?.name || "Files"}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {folderFiles.length} file{folderFiles.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  <div className="divide-y divide-gray-100">
                    {folderFiles.map((file) => (
                      <button
                        key={file.id}
                        onClick={() => handleOpenFile(file.id)}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-blue-50 ${
                          file.id === documentDetail?.id ? "bg-blue-50 border-l-2 border-[#1A3765]" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 mt-0.5">
                            {getFileIcon(file.fileType, "w-4 h-4")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium truncate ${
                              file.id === documentDetail?.id ? "text-[#1A3765]" : "text-gray-900"
                            }`}>
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {getExtension(file.name).toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right Side - Document Details */}
          <div className={folderFiles.length > 0 ? "lg:col-span-3" : "lg:col-span-4"}>
            <div className="max-w-4xl">
              {/* Document Info Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    {getFileIcon(documentDetail.fileType, "w-12 h-12")}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-[#1a1a1a] mb-2">
                      {documentDetail.name}
                    </h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">File Type:</span>
                        <span className="ml-2 font-medium text-[#1a1a1a] capitalize">
                          {documentDetail.fileType || "Unknown"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Extension:</span>
                        <span className="ml-2 font-medium text-[#1a1a1a] uppercase">
                          {getExtension(documentDetail.name)}
                        </span>
                      </div>
                      {documentDetail.size && (
                        <div>
                          <span className="text-gray-500">Size:</span>
                          <span className="ml-2 font-medium text-[#1a1a1a]">
                            {formatFileSize(documentDetail.size)}
                          </span>
                        </div>
                      )}
                      {documentDetail.createdAt && (
                        <div>
                          <span className="text-gray-500">Created:</span>
                          <span className="ml-2 font-medium text-[#1a1a1a]">
                            {formatDate(documentDetail.createdAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              {showPreview && previewUrl && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[#1a1a1a]">Preview</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreview(false)}
                    >
                      Close Preview
                    </Button>
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {documentDetail.fileType === "image" ? (
                      <img
                        src={previewUrl}
                        alt={documentDetail.name}
                        className="w-full max-h-[600px] object-contain bg-gray-50"
                      />
                    ) : documentDetail.fileType === "pdf" ? (
                      <iframe
                        src={previewUrl}
                        className="w-full h-[600px]"
                        title={documentDetail.name}
                      />
                    ) : documentDetail.fileType === "video" ? (
                      <video
                        src={previewUrl}
                        controls
                        className="w-full max-h-[600px] bg-gray-900"
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Instructions for non-previewable files */}
              {!showPreview && !isPreviewable(documentDetail.fileType) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                  <File className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-blue-900 mb-2">
                    Preview Not Available
                  </h3>
                  <p className="text-sm text-blue-700 mb-4">
                    This file type cannot be previewed in the browser. Please
                    download the file to view it.
                  </p>
                  <Button
                    onClick={handleDownload}
                    className="bg-[#1A3765] hover:bg-[#1A3765]/90"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download File
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Folder Modal */}
      {isCreateFolderOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-[#1a1a1a]">Create New Folder</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3765]"
                  autoFocus
                />
              </div>
              {currentFolder && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Folder className="w-4 h-4" />
                  <span>Parent: {currentFolder.name}</span>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateFolderOpen(false);
                  setNewFolderName("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateFolder}
                className="bg-[#1A3765] text-white hover:bg-[#1A3765]/90"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BMSDocumentViewer;
