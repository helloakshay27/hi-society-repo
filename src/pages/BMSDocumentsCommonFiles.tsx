import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, Folder, FolderOpen, File, FileText, Upload, RefreshCw, Loader2, Download, Search, FileVideo, Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface DocumentNode {
  id: string;
  name: string;
  type: "folder" | "file";
  children?: DocumentNode[];
  fileType?: string;
  size?: string;
  uploadedOn?: string;
}

const BMSDocumentsCommonFiles: React.FC = () => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["all"]));
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data query (replace with actual API call)
  const {
    data: documentsData,
    isLoading,
    error,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["common-files"],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      const mockData: DocumentNode[] = [
        {
          id: "all",
          name: "All",
          type: "folder",
          children: [
            {
              id: "godrej-app-video",
              name: "Godrej Living App Video",
              type: "folder",
              children: [
                {
                  id: "godrej-video-file",
                  name: "Godrej_Living_Mobile_Application_Manual.mp4",
                  type: "file",
                  fileType: "video",
                  size: "45.2 MB",
                  uploadedOn: "10/12/2024",
                },
              ],
            },
            {
              id: "electricity-bill",
              name: "Electricity Bill Name Change",
              type: "folder",
              children: [
                {
                  id: "electricity-pdf",
                  name: "Oasis_Energy_Meter_QR_Codes.pdf",
                  type: "file",
                  fileType: "pdf",
                  size: "1.8 MB",
                  uploadedOn: "15/12/2024",
                },
              ],
            },
            {
              id: "club-guidebook",
              name: "The_Club_at_Godrej_Living_Guidebook.pdf",
              type: "file",
              fileType: "pdf",
              size: "3.4 MB",
              uploadedOn: "20/12/2024",
            },
            {
              id: "woods-manual",
              name: "Woods_Fit_out_Manual_Booklet.pdf",
              type: "file",
              fileType: "pdf",
              size: "5.6 MB",
              uploadedOn: "25/12/2024",
            },
            {
              id: "app-manual",
              name: "Godrej_Living_Mobile_Application_Manual.pdf",
              type: "file",
              fileType: "pdf",
              size: "2.1 MB",
              uploadedOn: "28/12/2024",
            },
          ],
        },
      ];
      return mockData;
    },
    retry: 2,
    staleTime: 30000,
    gcTime: 60000,
  });

  const documents: DocumentNode[] = documentsData || [];

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleUpload = () => {
    toast.success("Upload functionality coming soon");
  };

  const handleDownload = (fileName: string) => {
    toast.success(`Downloading ${fileName}...`);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Documents refreshed");
  };

  const getFileIcon = (fileType?: string) => {
    switch (fileType) {
      case "video":
        return <FileVideo className="w-5 h-5 text-purple-500" />;
      case "pdf":
        return <FileText className="w-5 h-5 text-red-500" />;
      case "image":
        return <ImageIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <File className="w-5 h-5 text-gray-400" />;
    }
  };

  const renderNode = (node: DocumentNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    if (node.type === "folder") {
      return (
        <div key={node.id}>
          <div
            className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 cursor-pointer rounded"
            style={{ paddingLeft: `${level * 24 + 12}px` }}
            onClick={() => toggleFolder(node.id)}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )
            ) : (
              <div className="w-4" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-5 h-5 text-blue-500" />
            ) : (
              <Folder className="w-5 h-5 text-blue-500" />
            )}
            <span className="text-sm font-medium text-gray-700">{node.name}</span>
          </div>
          {isExpanded && hasChildren && (
            <div>
              {node.children!.map((child) => renderNode(child, level + 1))}
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
          {getFileIcon(node.fileType)}
          <span className="text-sm text-gray-600 flex-1">{node.name}</span>
          {node.size && (
            <span className="text-xs text-gray-400 mr-2">{node.size}</span>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="opacity-0 group-hover:opacity-100 h-7 px-2"
            onClick={() => handleDownload(node.name)}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      );
    }
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="mb-4 sm:mb-6 flex items-center justify-between">
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
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="p-4 max-h-[600px] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Loading documents...</span>
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <p className="text-red-600 font-medium">Error loading documents</p>
              <p className="text-sm text-gray-500 mt-1">{error?.message || "Please try again"}</p>
              <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-4">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No documents found</p>
            </div>
          ) : (
            <div>{documents.map((node) => renderNode(node))}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BMSDocumentsCommonFiles;
