import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Upload,
  RefreshCw,
  Loader2,
  Download,
  Search,
  FileVideo,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { API_CONFIG, getFullUrl, getAuthHeader } from "@/config/apiConfig";

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

const getExtension = (name: string | null | undefined): string =>
  name ? (name.split(".").pop()?.toLowerCase() ?? "") : "";

const FILE_EXTENSION_PATTERN =
  /\.(avi|bmp|csv|doc|docx|gif|jpeg|jpg|mkv|mov|mp4|pdf|png|ppt|pptx|rar|svg|txt|webm|webp|xls|xlsx|zip)$/i;

const getAttachmentRequestParams = () => ({
  ...(API_CONFIG.TOKEN ? { token: API_CONFIG.TOKEN } : {}),
  _: Date.now(),
});

const inferFileType = (name: string | null | undefined): string => {
  const ext = getExtension(name);
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "video";
  if (["pdf"].includes(ext)) return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) return "image";
  if (["xls", "xlsx", "csv"].includes(ext)) return "spreadsheet";
  if (["doc", "docx"].includes(ext)) return "doc";
  return "file";
};

const isFile = (node: ApiNode): boolean => {
  const id = String(node.id);
  if (id.startsWith("documents_")) return true;
  if (node.a_attr?.href?.includes("/society_flats/")) return false;
  return FILE_EXTENSION_PATTERN.test(node.text ?? "");
};

const digitsOnly = (value: string): string => value.replace(/\D/g, "");

/** jsTree flat ids (e.g. "j1_5") vs API parent ids (e.g. "5") */
const lastUnderscoreSegment = (value: string): string => {
  const idx = value.lastIndexOf("_");
  return idx >= 0 ? value.slice(idx + 1) : "";
};

const resolveFolderParent = (
  parentKey: string,
  map: Map<string, DocumentNode>,
  folderLookup: Map<string, DocumentNode>
): DocumentNode | undefined => {
  const direct = map.get(parentKey);
  if (direct?.type === "folder") return direct;

  const parentLookupKeys = [
    parentKey,
    lastUnderscoreSegment(parentKey),
    digitsOnly(parentKey),
  ].filter(Boolean);

  for (const lookupKey of parentLookupKeys) {
    const fromLookup = folderLookup.get(lookupKey);
    if (fromLookup) return fromLookup;
  }

  for (const [folderId, folder] of map) {
    if (folder.type !== "folder") continue;
    if (
      parentLookupKeys.includes(folderId) ||
      parentLookupKeys.includes(lastUnderscoreSegment(folderId)) ||
      parentLookupKeys.includes(digitsOnly(folderId)) ||
      folderId.endsWith(`_${parentKey}`)
    ) {
      return folder;
    }
  }

  return undefined;
};

/** Transform flat jstree array into nested DocumentNode[] */
const buildTree = (nodes: ApiNode[]): DocumentNode[] => {
  const map = new Map<string, DocumentNode>();
  const folderLookup = new Map<string, DocumentNode>();

  // First pass: create all nodes
  for (const n of nodes) {
    const key = String(n.id);
    const file = isFile(n);
    const node: DocumentNode = {
      id: key,
      name: n.text ?? "",
      type: file ? "file" : "folder",
      fileType: file ? inferFileType(n.text) : undefined,
      children: file ? undefined : [],
    };
    map.set(key, node);
    if (!file) {
      const register = (lookupKey: string) => {
        if (lookupKey && !folderLookup.has(lookupKey)) {
          folderLookup.set(lookupKey, node);
        }
      };
      register(key);
      register(lastUnderscoreSegment(key));
      const digits = digitsOnly(key);
      if (digits) register(digits);
    }
  }

  // Second pass: wire parent-child
  const roots: DocumentNode[] = [];
  for (const n of nodes) {
    const key = String(n.id);
    const node = map.get(key)!;
    const parentKey = String(n.parent);

    if (parentKey === "#") {
      roots.push(node);
      continue;
    }

    const parentNode = resolveFolderParent(parentKey, map, folderLookup);

    if (parentNode?.children) {
      parentNode.children.push(node);
    } else if (node.type === "file") {
      roots.push(node);
    }
  }

  return roots;
};

/** Recursive search filter */
const filterTree = (nodes: DocumentNode[], query: string): DocumentNode[] => {
  if (!query.trim()) return nodes;
  const q = query.toLowerCase();
  return nodes.reduce<DocumentNode[]>((acc, node) => {
    if (node.type === "file") {
      if (node.name.toLowerCase().includes(q)) acc.push(node);
    } else {
      const filteredChildren = filterTree(node.children ?? [], q);
      if (node.name.toLowerCase().includes(q) || filteredChildren.length > 0) {
        acc.push({ ...node, children: filteredChildren });
      }
    }
    return acc;
  }, []);
};

// ─── File Type Icon ───────────────────────────────────────────────────────────

const FileIcon = ({ fileType }: { fileType?: string }) => {
  switch (fileType) {
    case "video":
      return <FileVideo className="w-5 h-5 text-purple-500" />;
    case "pdf":
      return <FileText className="w-5 h-5 text-red-500" />;
    case "image":
      return <ImageIcon className="w-5 h-5 text-green-500" />;
    case "spreadsheet":
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    case "doc":
      return <FileText className="w-5 h-5 text-blue-500" />;
    default:
      return <File className="w-5 h-5 text-gray-400" />;
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

const BMSDocumentsFlatRelated: React.FC = () => {
  const navigate = useNavigate();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: rawNodes,
    isLoading,
    error,
    isError,
    refetch,
  } = useQuery<ApiNode[]>({
    queryKey: ["flat-related-documents"],
    queryFn: async () => {
      const { data } = await axios.get(
        getFullUrl("/crm/admin/attachments.json"),
        {
          params: getAttachmentRequestParams(),
          headers: { Authorization: getAuthHeader() },
        }
      );
      return Array.isArray(data) ? data : [];
    },
    retry: 2,
    staleTime: 5000,
    gcTime: 60000,
    refetchOnMount: "always",
  });

  const allDocuments: DocumentNode[] = rawNodes ? buildTree(rawNodes) : [];
  const documents = filterTree(allDocuments, searchQuery);

  const fileHrefById = useMemo(() => {
    const map = new Map<string, string>();
    for (const node of rawNodes ?? []) {
      const href = node.a_attr?.href;
      if (href) map.set(String(node.id), href);
    }
    return map;
  }, [rawNodes]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleUpload = () => {
    navigate("/bms/documents/upload-flat", {
      state: {
        returnPath: "/bms/documents/flat-related",
        fromFlatRelated: true,
      },
    });
  };

  const handleDownload = (nodeId: string, fileName: string) => {
    const href = fileHrefById.get(nodeId);
    if (href) {
      window.open(href, "_blank", "noopener,noreferrer");
      toast.success(`Opening ${fileName}...`);
      return;
    }
    toast.error("Unable to open file. Please try again.");
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Documents refreshed");
  };

  const renderNode = (node: DocumentNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(node.id);
    const childCount = node.children?.length ?? 0;
    const hasChildren = childCount > 0;

    if (node.type === "folder") {
      return (
        <div key={node.id}>
          <div
            className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 cursor-pointer rounded"
            style={{ paddingLeft: `${level * 24 + 12}px` }}
            onClick={() => toggleFolder(node.id)}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-5 h-5 text-yellow-500" />
            ) : (
              <Folder className="w-5 h-5 text-yellow-500" />
            )}
            <span className="text-sm font-medium text-gray-700">{node.name}</span>
            {childCount > 0 && (
              <span className="ml-auto text-xs text-gray-400">{childCount}</span>
            )}
          </div>
          {isExpanded && (
            <div>
              {hasChildren ? (
                node.children!.map((child) => renderNode(child, level + 1))
              ) : (
                <p
                  className="py-2 text-xs text-gray-400 italic"
                  style={{ paddingLeft: `${(level + 1) * 24 + 36}px` }}
                >
                  No documents in this flat
                </p>
              )}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div
          key={node.id}
          className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded group"
          style={{ paddingLeft: `${level * 24 + 36}px` }}
        >
          <FileIcon fileType={node.fileType} />
          <span className="text-sm text-gray-600 flex-1 truncate">{node.name}</span>
          <Button
            size="sm"
            variant="ghost"
            className="opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2"
            onClick={() => handleDownload(node.id, node.name)}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      );
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Flat Related Documents</h1>
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

      {/* Tree Card */}
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

        {/* Content */}
        <div className="p-4 max-h-[600px] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Loading documents...</span>
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <p className="text-red-600 font-medium">Error loading documents</p>
              <p className="text-sm text-gray-500 mt-1">
                {(error as Error)?.message || "Please try again"}
              </p>
              <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-4">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchQuery ? "No documents match your search" : "No documents found"}
              </p>
            </div>
          ) : (
            <div>{documents.map((node) => renderNode(node))}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BMSDocumentsFlatRelated;
