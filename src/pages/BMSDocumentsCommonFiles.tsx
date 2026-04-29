import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, Folder, File, FileText, Upload, RefreshCw, Loader2, Download, Search, FileVideo, Image as ImageIcon, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getFullUrl, getAuthHeader, ENDPOINTS } from "@/config/apiConfig";

// ─── API Types ────────────────────────────────────────────────────────────────

interface TreeNode {
  id: string | number;
  parent: string | number;
  text: string;
  icon?: string;
  a_attr?: {
    href: string;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getExtension = (name: string): string =>
  name.split(".").pop()?.toLowerCase() ?? "";

const inferFileType = (name: string): string => {
  const ext = getExtension(name);
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "video";
  if (["pdf"].includes(ext)) return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) return "image";
  if (["xls", "xlsx", "csv"].includes(ext)) return "spreadsheet";
  if (["doc", "docx"].includes(ext)) return "doc";
  return "file";
};

// ─── File icon helper ─────────────────────────────────────────────────────────

const getFileIcon = (fileType?: string) => {
  switch (fileType) {
    case "video":      return <FileVideo className="w-5 h-5 text-purple-500" />;
    case "pdf":        return <FileText className="w-5 h-5 text-red-500" />;
    case "image":      return <ImageIcon className="w-5 h-5 text-blue-500" />;
    case "spreadsheet":return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    case "doc":        return <FileText className="w-5 h-5 text-blue-700" />;
    default:           return <File className="w-5 h-5 text-gray-400" />;
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

const BMSDocumentsCommonFiles: React.FC = () => {
  const navigate = useNavigate();
  const [currentFolderId, setCurrentFolderId] = useState<string | number>("All");
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | number; name: string }[]>([
    { id: "All", name: "Common Files" }
  ]);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: treeData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<TreeNode[]>({
    queryKey: ["attachment-common"],
    queryFn: async () => {
      const endpoint = ENDPOINTS.ATTACHMENT_COMMON;
      const url = getFullUrl(endpoint);
      const authHeader = getAuthHeader();

      console.debug("[BMSDocuments] Fetching common files tree:", { url });

      try {
        const { data } = await axios.get(url, {
          headers: { Authorization: authHeader },
        });
        return Array.isArray(data) ? data : [];
      } catch (err) {
        console.error("[BMSDocuments] Error fetching common files:", err);
        if (axios.isAxiosError(err) && err.response) {
          console.error("[BMSDocuments] Response status:", err.response.status);
          console.error("[BMSDocuments] Response data:", err.response.data);
        }
        throw err;
      }
    },
    retry: 1,
    staleTime: 30000,
  });

  // Transform tree data to get children of current folder
  const visibleItems = useMemo(() => {
    if (!treeData) return [];

    // Get all items that are direct children of currentFolderId
    let items = treeData.filter(node => node.parent === currentFolderId);

    // Apply search filter
    if (searchQuery) {
      items = items.filter(item =>
        item.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return items;
  }, [treeData, currentFolderId, searchQuery]);

  const handleFolderClick = (id: string | number, name: string) => {
    setCurrentFolderId(id);
    setBreadcrumbs(prev => [...prev, { id, name }]);
  };

  const handleBreadcrumbClick = (id: string | number, index: number) => {
    setCurrentFolderId(id);
    setBreadcrumbs(prev => prev.slice(0, index + 1));
  };

  const handleUpload = () => {
    navigate("/bms/documents/upload");
  };

  const handleDownload = (fileName: string, nodeId: string | number) => {
    try {
      // Get the token from auth header
      const authHeader = getAuthHeader();
      const token = authHeader.replace("Bearer ", "").replace("Token ", "");

      // Construct download URL with token
      const baseUrl = getFullUrl("/crm/admin/attachments_common");
      const downloadUrl = `${baseUrl}?id=${nodeId}&token=${token}`;
      
      window.open(downloadUrl, '_blank');
      toast.success(`Opening ${fileName}…`);
    } catch (error) {
      console.error("Error opening file:", error);
      toast.error("Unable to open file. Please try again.");
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Folder refreshed");
  };

  const renderNode = (node: TreeNode): React.ReactNode => {
    const isFolder = treeData?.some(item => item.parent === node.id) ?? false;

    if (isFolder) {
      return (
        <div 
          key={node.id}
          className="flex items-center gap-2 py-2.5 px-3 hover:bg-gray-50 cursor-pointer rounded border-b border-gray-50 last:border-0"
          onClick={() => handleFolderClick(node.id, node.text)}
        >
          <Folder className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-700 truncate">{node.text}</span>
          <ChevronRight className="ml-auto w-4 h-4 text-gray-400" />
        </div>
      );
    }

    // It's a file
    const fileType = inferFileType(node.text);
    return (
      <div
        key={node.id}
        className="flex items-center gap-2 py-2.5 px-3 hover:bg-gray-50 rounded group cursor-pointer border-b border-gray-50 last:border-0"
        onClick={() => handleDownload(node.text, node.id)}
      >
        <div className="flex-shrink-0">{getFileIcon(fileType)}</div>
        <span className="text-sm text-gray-600 flex-1 truncate" title={node.text}>
          {node.text}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="opacity-0 group-hover:opacity-100 h-7 px-2 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            handleDownload(node.text, node.id);
          }}
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">Common Files</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-9"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={handleUpload}
            className="bg-[#1A3765] text-white hover:bg-[#1A3765]/90 h-9 px-4 text-sm font-medium"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Breadcrumbs */}
        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {breadcrumbs.map((bc, idx) => (
            <React.Fragment key={idx}>
              <button
                onClick={() => handleBreadcrumbClick(bc.id, idx)}
                className={`text-xs font-medium whitespace-nowrap hover:text-blue-600 transition-colors ${
                  idx === breadcrumbs.length - 1 ? "text-gray-900 cursor-default" : "text-gray-500"
                }`}
              >
                {bc.name}
              </button>
              {idx < breadcrumbs.length - 1 && (
                <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search in this folder..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Contents */}
        <div className="p-2 min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Retrieving content…</span>
            </div>
          ) : isError ? (
            <div className="text-center py-24">
              <p className="text-red-600 font-medium">Error loading folder contents</p>
              <p className="text-sm text-gray-500 mt-1">
                {error instanceof Error ? error.message : "Please try again"}
              </p>
              <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-4">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="text-center py-24">
              <Folder className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                {searchQuery ? "No items match your search" : "This folder is empty"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {visibleItems.map((node) => renderNode(node))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BMSDocumentsCommonFiles;
