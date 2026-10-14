import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Upload,
  RefreshCw,
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
import {
  ENDPOINTS,
  getCrmAdminRequestConfig,
  getFullUrl,
} from "@/config/apiConfig";
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions";

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
  // Root-level nodes are flat folders (FM-101, T1-201, etc.)
  if (String(node.parent) === "#") return false;
  if (id.startsWith("documents_")) return true;
  const href = node.a_attr?.href ?? "";
  if (href && !href.includes("/society_flats/")) return true;
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
      const suffix = lastUnderscoreSegment(key);
      if (suffix) register(suffix);
      // Avoid j1_5 → "15" polluting lookup; only register when id is numeric
      if (/^\d+$/.test(key)) register(key);
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
      const flatRoot = roots.find(
        (root) =>
          root.type === "folder" &&
          (root.id === parentKey ||
            lastUnderscoreSegment(root.id) === parentKey ||
            root.id.endsWith(`_${parentKey}`))
      );
      if (flatRoot?.children) {
        flatRoot.children.push(node);
      } else {
        roots.push(node);
      }
    }
  }

  return roots;
};

const normalizeAttachmentNodes = (data: unknown): ApiNode[] => {
  if (Array.isArray(data)) return data as ApiNode[];
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    for (const key of ["data", "attachments", "nodes", "tree"]) {
      if (Array.isArray(record[key])) return record[key] as ApiNode[];
    }
  }
  return [];
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
  const cls = "w-[18px] h-[18px] shrink-0";
  switch (fileType) {
    case "video":
      return <FileVideo className={`${cls} text-[rgba(26,26,24,0.55)]`} />;
    case "pdf":
      return <FileText className={`${cls} text-[rgba(26,26,24,0.55)]`} />;
    case "image":
      return <ImageIcon className={`${cls} text-[rgba(26,26,24,0.55)]`} />;
    case "spreadsheet":
      return <FileSpreadsheet className={`${cls} text-[rgba(26,26,24,0.55)]`} />;
    case "doc":
      return <FileText className={`${cls} text-[rgba(26,26,24,0.55)]`} />;
    default:
      return <File className={`${cls} text-[rgba(26,26,24,0.55)]`} />;
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

const BMSDocumentsFlatRelated: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { shouldShow } = useDynamicPermissions();
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
        getFullUrl(ENDPOINTS.ATTACHMENTS),
        getCrmAdminRequestConfig()
      );
      return normalizeAttachmentNodes(data);
    },
    retry: 2,
    staleTime: 0,
    gcTime: 60000,
    refetchOnMount: "always",
  });

  const allDocuments = useMemo(
    () => (rawNodes ? buildTree(rawNodes) : []),
    [rawNodes]
  );
  const documents = filterTree(allDocuments, searchQuery);

  const fileHrefById = useMemo(() => {
    const map = new Map<string, string>();
    for (const node of rawNodes ?? []) {
      const href = node.a_attr?.href;
      if (href) map.set(String(node.id), href);
    }
    return map;
  }, [rawNodes]);

  useEffect(() => {
    if (!allDocuments.length) return;

    const nextExpanded = new Set<string>();
    const walk = (nodes: DocumentNode[]) => {
      for (const node of nodes) {
        if (node.type === "folder" && (node.children?.length ?? 0) > 0) {
          nextExpanded.add(node.id);
          walk(node.children ?? []);
        }
      }
    };
    walk(allDocuments);

    const fromUpload = (
      location.state as { expandFlatIds?: string[] } | null
    )?.expandFlatIds;
    fromUpload?.forEach((id) => nextExpanded.add(String(id)));

    setExpandedFolders(nextExpanded);
  }, [allDocuments, location.state]);

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
            className="flex items-center gap-2.5 py-2 px-3 hover:bg-[#FAF9F7] cursor-pointer rounded-lg transition-colors"
            style={{ paddingLeft: `${level * 24 + 12}px` }}
            onClick={() => toggleFolder(node.id)}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-[rgba(26,26,24,0.48)]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[rgba(26,26,24,0.48)]" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-[18px] h-[18px] text-[#B5A27A]" />
            ) : (
              <Folder className="w-[18px] h-[18px] text-[#B5A27A]" />
            )}
            <span className="text-[13.5px] font-medium text-[#1A1A18]">{node.name}</span>
            {childCount > 0 && (
              <span className="ml-auto min-w-[22px] h-[20px] px-1.5 inline-flex items-center justify-center rounded-full bg-[#F5F4F0] text-[11px] font-semibold text-[rgba(26,26,24,0.55)]">
                {childCount}
              </span>
            )}
          </div>
          {isExpanded && (
            <div>
              {hasChildren ? (
                node.children!.map((child) => renderNode(child, level + 1))
              ) : (
                <p
                  className="py-2 text-xs text-[rgba(26,26,24,0.4)] italic"
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
          className="flex items-center gap-2.5 py-2 px-3 hover:bg-[#FAF9F7] rounded-lg group transition-colors"
          style={{ paddingLeft: `${level * 24 + 36}px` }}
        >
          <FileIcon fileType={node.fileType} />
          <span className="text-[13px] text-[rgba(26,26,24,0.75)] flex-1 truncate">{node.name}</span>
          {shouldShow("Flat Related", "show") && (
            <Button
              size="sm"
              variant="ghost"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 rounded-lg text-[#1A1A18] hover:bg-[#F5F4F0]"
              aria-label={`Download ${node.name}`}
              onClick={() => handleDownload(node.id, node.name)}
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-[#FDFDFB] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[rgba(26,26,24,0.12)] border-t-[#1A1A18] mx-auto mb-4"></div>
          <p className="text-[13px] text-[rgba(26,26,24,0.55)]">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-[#FDFDFB] flat-docs-page">
      <style>{`
        html body #root .flat-docs-page .btn-primary svg {
          color: #ffffff !important;
          stroke: #ffffff !important;
        }
        html body #root .flat-docs-page .ref-search {
          height: 44px;
          padding-left: 40px;
          font-size: 13.5px;
          border: 1px solid rgba(26, 26, 24, 0.08) !important;
          border-radius: 12px !important;
          background: #ffffff;
          box-shadow: none !important;
        }
        html body #root .flat-docs-page .ref-search:hover {
          border-color: rgba(26, 26, 24, 0.28) !important;
        }
        html body #root .flat-docs-page .ref-search:focus,
        html body #root .flat-docs-page .ref-search:focus-visible {
          border-color: #1A1A18 !important;
          box-shadow: 0 0 0 4px rgba(26, 26, 24, 0.1) !important;
        }
        html body #root .flat-docs-page .ref-search::placeholder {
          color: rgba(26, 26, 24, 0.3);
        }
      `}</style>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em] text-[#1A1A18]">
            Flat Related Documents
          </h1>
          <p className="mt-1 text-[13px] text-[rgba(26,26,24,0.55)]">
            Browse and download documents shared with each flat
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            title="Refresh"
            aria-label="Refresh"
            className="btn-cancel h-9 w-9 p-0 bg-white border border-[#da7756] text-[#da7756] hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          {shouldShow("Flat Related", "create") && (
            <Button
              onClick={handleUpload}
              title="Upload Document"
              aria-label="Upload Document"
              className="btn-primary h-9 w-9 p-0"
            >
              <Upload className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tree Card */}
      <div className="bg-white rounded-2xl border border-[rgba(26,26,24,0.09)] overflow-hidden">
        {/* Search */}
        <div className="px-5 pt-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(26,26,24,0.4)] z-10" />
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ref-search"
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-3 pb-4 max-h-[600px] overflow-y-auto">
          {isError ? (
            <div className="text-center py-12">
              <p className="text-[14px] font-semibold text-[#A63D49]">Error loading documents</p>
              <p className="text-[13px] text-[rgba(26,26,24,0.55)] mt-1">
                {(error as Error)?.message || "Please try again"}
              </p>
              <Button onClick={() => refetch()} className="btn-primary h-9 px-4 text-sm font-medium mt-4">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="w-10 h-10 text-[rgba(26,26,24,0.2)] mx-auto mb-3" />
              <p className="text-[13.5px] text-[rgba(26,26,24,0.55)]">
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
