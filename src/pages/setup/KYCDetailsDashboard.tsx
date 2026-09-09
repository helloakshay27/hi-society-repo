import React, { useState, useEffect } from "react";
import axios from "axios";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Eye, X } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions";
import { HI_SOCIETY_CONFIG } from "@/config/apiConfig";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 10;

interface KYCDetail {
  id: string;
  userName: string;
  userEmail: string;
  userMobile: string;
}

export const KYCDetailsDashboard = () => {
  const { shouldShow } = useDynamicPermissions();
  const navigate = useNavigate();

  const [kycDetails, setKycDetails] = useState<KYCDetail[]>([]);

  const [selectedKYCDetails, setSelectedKYCDetails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    userName: "",
    userEmail: "",
    userMobile: "",
  });

  // Define columns for the table
  const columns = [
    {
      key: "userName",
      label: "User Name",
      sortable: true,
      draggable: true,
    },
    {
      key: "userEmail",
      label: "User Email",
      sortable: true,
      draggable: true,
    },
    {
      key: "userMobile",
      label: "User Mobile",
      sortable: true,
      draggable: true,
    },
  ];

  const fetchKYCDetails = async () => {
    setLoading(true);
    try {
      const baseUrl = HI_SOCIETY_CONFIG.BASE_URL;
      const token = HI_SOCIETY_CONFIG.TOKEN;

      if (!baseUrl) {
        throw new Error("Base URL is not configured");
      }
      if (!token) {
        throw new Error("Authentication token is missing. Please login again.");
      }

      const url = `${baseUrl}/crm/admin/kyc_details.json`;
      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;
      const list: any[] = Array.isArray(data)
        ? data
        : data.data?.kyc_details || data.kyc_details || [];

      const transformed: KYCDetail[] = list.map((item: any, index: number) => {
        const user = item || {};
        return {
          id: String(item.id ?? index),
          userName:
            user.full_name ||
            [user.firstname, user.lastname].filter(Boolean).join(" ") ||
            "",
          userEmail: user.email || "",
          userMobile: user.mobile || "",
        };
      });

      setKycDetails(transformed);
    } catch (error: any) {
      console.error("Error fetching KYC details:", error);
      toast.error(error.message || "Failed to load KYC details");
      setKycDetails([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKYCDetails();
  }, []);

  // Handlers
  const handleAddKYCDetail = () => {
    setShowAddDialog(true);
  };

  const handleSubmitKYCDetail = () => {
    // Validate form
    if (!formData.userName.trim()) {
      toast.error("Please enter user name");
      return;
    }
    if (!formData.userEmail.trim()) {
      toast.error("Please enter user email");
      return;
    }
    if (!formData.userMobile.trim()) {
      toast.error("Please enter user mobile");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.userEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Validate mobile format (exactly 10 digits)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(formData.userMobile.replace(/[\s\-\(\)]/g, ""))) {
      toast.error("Please enter a valid mobile number");
      return;
    }

    const newKYCDetail: KYCDetail = {
      id: `kyc-${Date.now()}`,
      userName: formData.userName,
      userEmail: formData.userEmail,
      userMobile: formData.userMobile,
    };

    setKycDetails([...kycDetails, newKYCDetail]);
    setFormData({ userName: "", userEmail: "", userMobile: "" });
    setShowAddDialog(false);
    toast.success("KYC Detail added successfully!");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedKYCDetails(kycDetails.map((detail) => detail.id));
    } else {
      setSelectedKYCDetails([]);
    }
  };

  const handleSelectKYCDetail = (kycDetailId: string, checked: boolean) => {
    if (checked) {
      setSelectedKYCDetails([...selectedKYCDetails, kycDetailId]);
    } else {
      setSelectedKYCDetails(
        selectedKYCDetails.filter((id) => id !== kycDetailId)
      );
    }
  };

  const handleViewKYCDetail = (kycDetailId: string) => {
    navigate(`/settings/kyc-details/${kycDetailId}`);
  };

  const totalPages = Math.ceil(kycDetails.length / PAGE_SIZE) || 1;
  const paginatedKycDetails = kycDetails.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPaginationItems = () => {
    if (!totalPages || totalPages <= 0) return null;
    const items = [];
    const showEllipsis = totalPages > 5;

    if (showEllipsis) {
      items.push(
        <PaginationItem key={1} className="cursor-pointer">
          <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 4) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      } else {
        for (let i = 2; i <= Math.min(3, totalPages - 1); i++) {
          items.push(
            <PaginationItem key={i} className="cursor-pointer">
              <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }

      if (currentPage > 3 && currentPage < totalPages - 2) {
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          items.push(
            <PaginationItem key={i} className="cursor-pointer">
              <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }

      if (currentPage < totalPages - 3) {
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      } else {
        for (let i = Math.max(totalPages - 2, 2); i < totalPages; i++) {
          if (!items.find((item) => item.key === i.toString())) {
            items.push(
              <PaginationItem key={i} className="cursor-pointer">
                <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                  {i}
                </PaginationLink>
              </PaginationItem>
            );
          }
        }
      }

      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages} className="cursor-pointer">
            <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages}>
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i} className="cursor-pointer">
            <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  // Render actions for each row
  const renderActions = (item: KYCDetail) => {
    return (
      <div className="flex gap-1">
        {shouldShow("KYC Details", "show") && (
          <button
            onClick={() => handleViewKYCDetail(item.id)}
            className="text-black hover:text-gray-700"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  // Custom cell renderer
  const renderCell = (item: KYCDetail, columnKey: string) => {
    switch (columnKey) {
      case "userName":
        return <span>{item.userName}</span>;
      case "userEmail":
        return <span>{item.userEmail}</span>;
      case "userMobile":
        return <span>{item.userMobile}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-[#fafafa] min-h-screen">
      {/* Separate Header */}
      <div className="mb-3">
        <div className="py-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            KYC Details
          </h1>
        </div>
      </div>

      {/* Table Section */}
      <div className="">
        <EnhancedTable
          data={paginatedKycDetails}
          columns={columns}
          loading={loading}
          selectedItems={selectedKYCDetails}
          onSelectAll={handleSelectAll}
          onSelectItem={handleSelectKYCDetail}
          searchTerm={searchTerm}
          onSearchChange={(term) => {
            setSearchTerm(term);
            setCurrentPage(1);
          }}
          renderCell={renderCell}
          renderActions={renderActions}
          leftActions={
            <Button
              onClick={handleAddKYCDetail}
              variant="ghost"
              className="btn-primary h-9 px-4 text-sm font-medium"             >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          }
        />

        {kycDetails.length > 0 && (
          <div className="p-4 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {renderPaginationItems()}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Add KYC Detail Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add KYC Detail</DialogTitle>
            <button
              onClick={() => {
                setShowAddDialog(false);
                setFormData({ userName: "", userEmail: "", userMobile: "" });
              }}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <fieldset className="border border-[#ddd] rounded px-3 pb-1 pt-0 focus-within:border-[#C72030]">
              <legend className="px-1 text-gray-500 font-medium text-sm">
                User Name <span className="text-red-500">*</span>
              </legend>
              <Input
                id="userName"
                placeholder="Enter User Name"
                value={formData.userName}
                onChange={(e) =>
                  setFormData({ ...formData, userName: e.target.value })
                }
                className="h-9 border-0 shadow-none px-0 focus-visible:ring-0 focus-visible:outline-none"
              />
            </fieldset>
            <fieldset className="border border-[#ddd] rounded px-3 pb-1 pt-0 focus-within:border-[#C72030]">
              <legend className="px-1 text-gray-500 font-medium text-sm">
                User Email <span className="text-red-500">*</span>
              </legend>
              <Input
                id="userEmail"
                type="email"
                placeholder="Enter User Email"
                value={formData.userEmail}
                onChange={(e) =>
                  setFormData({ ...formData, userEmail: e.target.value })
                }
                className="h-9 border-0 shadow-none px-0 focus-visible:ring-0 focus-visible:outline-none"
              />
            </fieldset>
            <fieldset className="border border-[#ddd] rounded px-3 pb-1 pt-0 focus-within:border-[#C72030]">
              <legend className="px-1 text-gray-500 font-medium text-sm">
                User Mobile <span className="text-red-500">*</span>
              </legend>
              <Input
                id="userMobile"
                type="tel"
                placeholder="Enter User Mobile"
                value={formData.userMobile}
                maxLength={10}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setFormData({ ...formData, userMobile: val });
                }}
                className="h-9 border-0 shadow-none px-0 focus-visible:ring-0 focus-visible:outline-none"
              />
            </fieldset>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              className="px-6 sm:px-8 w-full sm:w-auto !bg-white border !border-[#da7756] !text-[#da7756]  h-10"
              onClick={() => {
                setShowAddDialog(false);
                setFormData({ userName: "", userEmail: "", userMobile: "" });
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitKYCDetail}
              className="bg-[#C72030] text-white"
            >
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
