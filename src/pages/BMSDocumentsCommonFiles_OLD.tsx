import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, Folder, FolderOpen, File, FileText, Upload, RefreshCw, Loader2, Download, Search, FileVideo, Image as ImageIcon, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";

// ─── API Types ────────────────────────────────────────────────────────────────

interface ApiNode {
  id: string | number;
  parent: string | number;
  text: string;
  icon?: string;
  a_attr?: { href: string };
}

// ─── Internal Tree Types ──────────────────────────────────────────────────────

interface DocumentNode {
  id: string;
  name: string;
  type: "folder" | "file";
  children?: DocumentNode[];
  fileType?: string;
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
  // Specific check for warranty cards if they are special, otherwise pdf check above handles it
  if (name.toLowerCase().includes("warranty_card")) return "pdf"; 
  return "file";
};

const isFile = (node: ApiNode): boolean =>
  String(node.id).startsWith("documents_");

/** Transform flat jstree array into a nested tree */
const buildTree = (nodes: ApiNode[]): DocumentNode[] => {
  const map = new Map<string, DocumentNode>();

  // First pass: create all nodes
  for (const n of nodes) {
    const id = String(n.id);
    const file = isFile(n);
    map.set(id, {
      id,
      name: n.text,
      type: file ? "file" : "folder",
      fileType: file ? inferFileType(n.text) : undefined,
      children: file ? undefined : [],
    });
  }

  const roots: DocumentNode[] = [];

  // Second pass: wire up parent-child
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
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["All"]));
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: treeData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<DocumentNode[]>({
    queryKey: ["common-files"],
    queryFn: async () => {
      const { data } = await axios.get(getFullUrl("/crm/admin/attachment_common.json"), {
        headers: { Authorization: getAuthHeader() },
      });
      return buildTree(data);
    },
    retry: 2,
    staleTime: 30000,
    gcTime: 60000,
  });

  const documents: DocumentNode[] = treeData ?? [];

  // ── Search filter ──────────────────────────────────────────────────────────

  const matchesSearch = (node: DocumentNode, query: string): boolean => {
    const q = query.toLowerCase();
    if (node.name.toLowerCase().includes(q)) return true;
    if (node.children) return node.children.some((c) => matchesSearch(c, q));
    return false;
  };

  const filterTree = (nodes: DocumentNode[], query: string): DocumentNode[] => {
    if (!query.trim()) return nodes;
    return nodes
      .filter((n) => matchesSearch(n, query))
      .map((n) => ({
        ...n,
        children: n.children ? filterTree(n.children, query) : undefined,
      }));
  };

  const visibleDocuments = filterTree(documents, searchQuery);

  // ── Folder toggle ──────────────────────────────────────────────────────────

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const handleUpload = () => {
    navigate("/bms/documents/upload");
  };

  const handleDownload = (fileName: string) =>
    toast.success(`Downloading ${fileName}…`);

  const handleRefresh = () => {
    refetch();
    toast.success("Documents refreshed");
  };

  // ── Tree renderer ──────────────────────────────────────────────────────────

  const renderNode = (node: DocumentNode, level: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(node.id);
    const hasChildren = (node.children?.length ?? 0) > 0;

    if (node.type === "folder") {
      return (
        <div key={node.id}>
          <div
            className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 cursor-pointer rounded select-none"
            style={{ paddingLeft: `${level * 24 + 12}px` }}
            onClick={() => toggleFolder(node.id)}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
              )
            ) : (
              <div className="w-4 flex-shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-5 h-5 text-blue-500 flex-shrink-0" />
            ) : (
              <Folder className="w-5 h-5 text-blue-500 flex-shrink-0" />
            )}
            <span className="text-sm font-medium text-gray-700 truncate">{node.name}</span>
            {hasChildren && (
              <span className="ml-auto text-xs text-gray-400 flex-shrink-0">
                {node.children!.length}
              </span>
            )}
          </div>
          {isExpanded && hasChildren && (
            <div>
              {node.children!.map((child) => renderNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    // File node
    const handleFileClick = () => {
      navigate(`/bms/documents/view/${node.id}`);
    };

    return (
      <div
        key={node.id}
        className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded group cursor-pointer"
        style={{ paddingLeft: `${level * 24 + 36}px` }}
        onClick={handleFileClick}
      >
        <div className="flex-shrink-0">{getFileIcon(node.fileType)}</div>
        <span className="text-sm text-gray-600 flex-1 truncate" title={node.name}>
          {node.name}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="opacity-0 group-hover:opacity-100 h-7 px-2 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            handleDownload(node.name);
          }}
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

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

      <div className="bg-white rounded-lg border border-gray-200">
        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tree */}
        <div className="p-4 max-h-[600px] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Loading documents…</span>
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <p className="text-red-600 font-medium">Error loading documents</p>
              <p className="text-sm text-gray-500 mt-1">
                {error instanceof Error ? error.message : "Please try again"}
              </p>
              <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-4">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : visibleDocuments.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchQuery ? "No documents match your search" : "No documents found"}
              </p>
            </div>
          ) : (
            <div>{visibleDocuments.map((node) => renderNode(node))}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BMSDocumentsCommonFiles;
