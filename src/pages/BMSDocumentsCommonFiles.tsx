import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Folder, File, FileText, Upload, RefreshCw, Loader2, Download, Search, FileVideo, Image as ImageIcon, FileSpreadsheet } from "lucide-react";
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
  const [expandedFolders, setExpandedFolders] = useState<Set<string | number>>(
    new Set(["All"])
  );
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

  // Toggle folder expansion
  const toggleFolder = (folderId: string | number) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  // Get children of a specific node
  const getChildren = (parentId: string | number): TreeNode[] => {
    if (!treeData) return [];
    return treeData.filter(node => node.parent === parentId);
  };

  // Check if node is a folder
  const isFolder = (nodeId: string | number): boolean => {
    return getChildren(nodeId).length > 0;
  };

  // Check if node matches search
  const matchesSearch = (node: TreeNode): boolean => {
    if (!searchQuery) return true;
    return node.text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  // Recursively check if any descendants match search
  const hasMatchingDescendant = (nodeId: string | number): boolean => {
    const children = getChildren(nodeId);
    return children.some(child => 
      matchesSearch(child) || hasMatchingDescendant(child.id)
    );
  };

  const handleUpload = () => {
    navigate("/bms/documents/upload");
  };

  const handleDownload = (fileName: string, nodeId: string | number) => {
    try {
      const authHeader = getAuthHeader();
      const token = authHeader.replace("Bearer ", "").replace("Token ", "");
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

  // Render tree node recursively
  const renderTreeNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
    const isNodeFolder = isFolder(node.id);
    const isFolderExpanded = expandedFolders.has(node.id);
    const children = getChildren(node.id);
    const visibleChildren = children.filter(
      child => matchesSearch(child) || hasMatchingDescendant(child.id)
    );
    const childrenVisible = visibleChildren.length > 0;

    if (isNodeFolder) {
      return (
        <div key={node.id} className="select-none">
          {/* Folder item */}
          <div
            className="flex items-center gap-2 py-2 px-3 hover:bg-blue-50 cursor-pointer rounded transition-colors"
            style={{ paddingLeft: `${12 + depth * 20}px` }}
            onClick={() => toggleFolder(node.id)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(node.id);
              }}
              className="flex-shrink-0 p-0 h-5 w-5 flex items-center justify-center hover:bg-blue-100 rounded"
            >
              {childrenVisible && (
                isFolderExpanded ? (
                  <ChevronDown className="w-4 h-4 text-blue-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )
              )}
            </button>
            <Folder className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700 truncate">
              {node.text}
            </span>
            <span className="ml-auto text-xs text-gray-400">
              ({visibleChildren.length})
            </span>
          </div>

          {/* Render children if expanded */}
          {isFolderExpanded && childrenVisible && (
            <div className="border-l border-gray-200">
              {visibleChildren.map(child => renderTreeNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    // It's a file
    const fileType = inferFileType(node.text);
    return (
      <div
        key={node.id}
        className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 cursor-pointer rounded group transition-colors"
        style={{ paddingLeft: `${12 + (depth + 1) * 20}px` }}
      >
        <div className="flex-shrink-0 w-4">{/* Spacer for alignment */}</div>
        <div className="flex-shrink-0">{getFileIcon(fileType)}</div>
        <span
          className="text-sm text-gray-600 flex-1 truncate hover:text-blue-600"
          title={node.text}
          onClick={() => handleDownload(node.text, node.id)}
        >
          {node.text}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 flex-shrink-0"
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

  // Get root folders (children of "All")
  const rootFolders = useMemo(() => {
    if (!treeData) return [];
    const roots = getChildren("All");
    return roots.filter(
      child => matchesSearch(child) || hasMatchingDescendant(child.id)
    );
  }, [treeData, searchQuery]);

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

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search in all folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tree Contents */}
        <div className="p-2 min-h-[400px] max-h-[600px] overflow-y-auto">
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
          ) : rootFolders.length === 0 ? (
            <div className="text-center py-24">
              <Folder className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                {searchQuery ? "No items match your search" : "No folders available"}
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {rootFolders.map((folder) => renderTreeNode(folder))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BMSDocumentsCommonFiles;
