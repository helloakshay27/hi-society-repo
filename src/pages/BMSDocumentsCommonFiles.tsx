import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  File,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Folder,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getFullUrl, getAuthHeader, ENDPOINTS } from "@/config/apiConfig";

interface TreeNode {
  id: string | number;
  parent: string | number;
  text: string;
  icon?: string;
  a_attr?: {
    href: string;
  };
}

const FILE_EXTENSION_PATTERN =
  /\.(avi|bmp|csv|doc|docx|gif|jpeg|jpg|mkv|mov|mp4|pdf|png|ppt|pptx|rar|svg|txt|webm|webp|xls|xlsx|zip)$/i;

const isFileNode = (node: TreeNode): boolean => {
  if (String(node.parent) === "#") return false;
  return (
    String(node.id).startsWith("documents_") ||
    Boolean(node.a_attr?.href) ||
    FILE_EXTENSION_PATTERN.test(node.text ?? "")
  );
};

const ALL_ROOT_NODE: TreeNode = { id: "All", parent: "#", text: "All" };

const isAllRootNode = (node: TreeNode): boolean =>
  String(node.id) === "All" ||
  String(node.text ?? "")
    .trim()
    .toLowerCase() === "all";

const isRootParent = (parentId: string, allRootId: string): boolean =>
  parentId === "#" || parentId === "All" || parentId === allRootId;

const getExtension = (name: string | null | undefined): string =>
  (name ?? "").split(".").pop()?.toLowerCase() ?? "";

const inferFileType = (name: string | null | undefined): string => {
  const extension = getExtension(name);

  if (["mp4", "mov", "avi", "mkv", "webm"].includes(extension)) {
    return "video";
  }
  if (["pdf"].includes(extension)) {
    return "pdf";
  }
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(extension)) {
    return "image";
  }
  if (["xls", "xlsx", "csv"].includes(extension)) {
    return "spreadsheet";
  }
  if (["doc", "docx"].includes(extension)) {
    return "doc";
  }
  return "file";
};

const FileIcon = ({ fileType }: { fileType?: string }) => {
  switch (fileType) {
    case "video":
      return <FileVideo className="h-5 w-5 shrink-0 text-purple-500" />;
    case "pdf":
      return <FileText className="h-5 w-5 shrink-0 text-red-500" />;
    case "image":
      return <ImageIcon className="h-5 w-5 shrink-0 text-green-500" />;
    case "spreadsheet":
      return <FileSpreadsheet className="h-5 w-5 shrink-0 text-emerald-600" />;
    case "doc":
      return <FileText className="h-5 w-5 shrink-0 text-blue-500" />;
    default:
      return <File className="h-5 w-5 shrink-0 text-gray-400" />;
  }
};

const TreeToggle: React.FC<{ isExpanded: boolean; visible: boolean }> = ({
  isExpanded,
  visible,
}) => {
  if (!visible) {
    return <span className="h-[14px] w-[13px] shrink-0" aria-hidden="true" />;
  }

  return (
    <span
      className="flex h-[14px] w-[13px] shrink-0 items-center justify-center"
      aria-hidden="true"
    >
      {isExpanded ? (
        <span className="h-0 w-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-[#3f3f3f]" />
      ) : (
        <span className="h-0 w-0 border-b-[4px] border-l-[5px] border-t-[4px] border-b-transparent border-l-[#3f3f3f] border-t-transparent" />
      )}
    </span>
  );
};

const BMSDocumentsCommonFiles: React.FC = () => {
  const navigate = useNavigate();
  const [expandedFolders, setExpandedFolders] = useState<Set<string | number>>(
    new Set(["All"])
  );

  const {
    data: treeData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<TreeNode[]>({
    queryKey: ["attachment-common"],
    queryFn: async () => {
      const { data } = await axios.get(
        getFullUrl(ENDPOINTS.ATTACHMENT_COMMON),
        {
          headers: { Authorization: getAuthHeader() },
        }
      );

      return Array.isArray(data) ? data : [];
    },
    retry: 1,
    staleTime: 5000,
    refetchOnMount: "always",
  });

  const childrenByParent = useMemo(() => {
    const map = new Map<string, TreeNode[]>();
    const allRootNode = (treeData ?? []).find(isAllRootNode);
    const allRootId = String(allRootNode?.id ?? ALL_ROOT_NODE.id);
    const knownNodeIds = new Set(
      (treeData ?? []).map((node) => String(node.id))
    );

    for (const node of treeData ?? []) {
      const nodeId = String(node.id);
      const rawParentId = String(node.parent);
      const parentExists =
        isRootParent(rawParentId, allRootId) || knownNodeIds.has(rawParentId);

      if (nodeId === allRootId) {
        continue;
      }

      // Place root-level files and orphan files directly under the All root
      // so they remain visible instead of being silently dropped.
      const parentId =
        isRootParent(rawParentId, allRootId) || !parentExists
          ? allRootId
          : rawParentId;
      const siblings = map.get(parentId) ?? [];
      siblings.push(node);
      map.set(parentId, siblings);
    }

    return map;
  }, [treeData]);

  const getChildren = (parentId: string | number): TreeNode[] =>
    childrenByParent.get(String(parentId)) ?? [];

  const isFolder = (node: TreeNode): boolean =>
    getChildren(node.id).length > 0 || !isFileNode(node);

  const roots = useMemo<TreeNode[]>(() => {
    if (!treeData?.length) return [];

    const allNode = treeData.find(isAllRootNode);
    if (allNode) return [allNode];

    return [ALL_ROOT_NODE];
  }, [treeData]);

  useEffect(() => {
    if (!treeData?.length) return;

    const allRootNode = treeData.find(isAllRootNode);
    setExpandedFolders(
      new Set<string | number>([allRootNode?.id ?? ALL_ROOT_NODE.id])
    );
  }, [treeData]);

  const toggleFolder = (folderId: string | number) => {
    setExpandedFolders((current) => {
      const next = new Set(current);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleUpload = () => {
    navigate("/bms/documents/upload", {
      state: { returnPath: "/bms/documents/common-files" },
    });
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Folder refreshed");
  };

  const handleDownload = (fileName: string, nodeId: string | number) => {
    try {
      const authHeader = getAuthHeader();
      const token = authHeader.replace("Bearer ", "").replace("Token ", "");
      const baseUrl = getFullUrl("/crm/admin/attachments_common");
      const downloadUrl = `${baseUrl}?id=${nodeId}&token=${token}`;

      window.open(downloadUrl, "_blank");
      toast.success(`Opening ${fileName}...`);
    } catch (downloadError) {
      console.error("Error opening file:", downloadError);
      toast.error("Unable to open file. Please try again.");
    }
  };

  const renderConnectorLines = (
    depth: number,
    isLast: boolean,
    ancestorHasNextSibling: boolean[]
  ) => (
    <>
      {ancestorHasNextSibling.map((hasNextSibling, index) =>
        hasNextSibling ? (
          <span
            key={index}
            className="pointer-events-none absolute bottom-0 top-0 border-l border-[#9f9f9f]"
            style={{ left: `${23 + index * 18}px` }}
          />
        ) : null
      )}
      {depth > 0 && (
        <>
          <span
            className="pointer-events-none absolute top-0 border-l border-[#9f9f9f]"
            style={{
              left: `${23 + (depth - 1) * 18}px`,
              height: isLast ? "10px" : "20px",
            }}
          />
          <span
            className="pointer-events-none absolute border-t border-[#9f9f9f]"
            style={{
              left: `${23 + (depth - 1) * 18}px`,
              top: "10px",
              width: "11px",
            }}
          />
        </>
      )}
    </>
  );

  const renderTreeNode = (
    node: TreeNode,
    depth = 0,
    isLast = true,
    ancestorHasNextSibling: boolean[] = []
  ): React.ReactNode => {
    const children = getChildren(node.id);
    const nodeIsFolder = isFolder(node);
    const isExpanded = expandedFolders.has(node.id);

    if (!nodeIsFolder) {
      return (
        <div
          key={node.id}
          className="relative flex h-[20px] cursor-pointer items-center whitespace-nowrap text-[12px] leading-none text-[#333] hover:bg-[#eef6fb]"
          style={{ paddingLeft: `${16 + depth * 18}px` }}
          title={node.text ?? ""}
          onClick={() => handleDownload(node.text ?? "file", node.id)}
        >
          {renderConnectorLines(depth, isLast, ancestorHasNextSibling)}
          <span className="relative z-[1] flex h-full items-center gap-[5px]">
            <span className="h-[14px] w-[13px] shrink-0" aria-hidden="true" />
            <FileIcon fileType={inferFileType(node.text ?? "")} />
            <span>{node.text ?? ""}</span>
          </span>
        </div>
      );
    }

    return (
      <div key={node.id}>
        <div
          className="relative flex h-[20px] cursor-pointer select-none items-center whitespace-nowrap text-[12px] leading-none text-[#333] hover:bg-[#eef6fb]"
          style={{ paddingLeft: `${16 + depth * 18}px` }}
          onClick={() => toggleFolder(node.id)}
        >
          {renderConnectorLines(depth, isLast, ancestorHasNextSibling)}
          <span className="relative z-[1] flex h-full items-center gap-[5px]">
            <TreeToggle isExpanded={isExpanded} visible={children.length > 0} />
            {isExpanded ? (
              <FolderOpen className="h-5 w-5 shrink-0 text-yellow-500" />
            ) : (
              <Folder className="h-5 w-5 shrink-0 text-yellow-500" />
            )}
            <span>{node.text ?? ""}</span>
          </span>
        </div>

        {isExpanded &&
          children.map((child, index) =>
            renderTreeNode(child, depth + 1, index === children.length - 1, [
              ...ancestorHasNextSibling,
              index !== children.length - 1,
            ])
          )}
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-7rem)] bg-white font-[Arial] text-[#333]">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between px-6 pt-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Common Files</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-9"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
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

      <div className="relative min-h-[520px] overflow-auto bg-white pl-[16px] pr-[28px] pt-[7px]">
        {isLoading ? (
          <div className="flex h-[40px] items-center gap-2 text-[12px] text-[#666]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading files...
          </div>
        ) : isError ? (
          <div className="pt-2 text-[12px] text-[#555]">
            <p className="text-[#b42318]">Error loading folder contents</p>
            <p className="mt-1">
              {error instanceof Error ? error.message : "Please try again"}
            </p>
            <button
              type="button"
              className="mt-2 border border-[#a4a4a4] bg-[#f7f7f7] px-2 py-1 text-[11px] text-[#333] hover:bg-[#ececec]"
              onClick={() => refetch()}
            >
              Retry
            </button>
          </div>
        ) : roots.length === 0 ? (
          <div className="pt-2 text-[12px] text-[#666]">
            No folders available
          </div>
        ) : (
          <div className="min-w-max">
            {roots.map((root, index) =>
              renderTreeNode(root, 0, index === roots.length - 1, [])
            )}
          </div>
        )}
      </div>

      <div
        className="fixed right-0 top-1/2 z-40 rounded-l-[4px] bg-[#f1bd00] px-[4px] py-[9px] text-[11px] font-bold leading-none text-white shadow-sm"
        style={{
          writingMode: "vertical-rl",
          transform: "translateY(-50%) rotate(180deg)",
        }}
      >
        SUPPORT
      </div>
    </div>
  );
};

export default BMSDocumentsCommonFiles;
