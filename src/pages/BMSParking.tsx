import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Plus, Eye, Edit, Trash2, Download, Filter, RefreshCw, Loader2, Car, MapPin, X, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface ParkingSlot {
  id: string;
  slotNumber: string;
  tower: string;
  flat: string;
  vehicleNumber: string;
  vehicleType: string;
  ownerName: string;
  status: "Allocated" | "Available" | "Reserved" | "Blocked";
  allocatedDate: string;
  parkingType: "Covered" | "Open" | "Basement";
  slotType: "Two Wheeler" | "Four Wheeler" | "Electric Vehicle";
  monthlyCharge: string;
  createdOn: string;
  createdBy: string;
}

const BMSParking: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedParking, setSelectedParking] = useState<ParkingSlot | null>(null);
  const [formData, setFormData] = useState({
    slotNumber: "",
    vehicleType: "",
    parkingType: "",
    stickerNumber: "",
    tower: "",
    flat: "",
    vehicleNumber: "",
    chargeApplicable: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Mock data query (replace with actual API call)
  const {
    data: parkingData,
    isLoading,
    error,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["parking-slots", debouncedSearchQuery, currentPage, pageSize],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      // Mock data for demonstration
      const mockData: ParkingSlot[] = [
        {
          id: "1",
          slotNumber: "A-101",
          tower: "A",
          flat: "101",
          vehicleNumber: "MH-12-AB-1234",
          vehicleType: "Car",
          ownerName: "Ubaid Hashmat",
          status: "Allocated",
          allocatedDate: "01/01/2025",
          parkingType: "Covered",
          slotType: "Four Wheeler",
          monthlyCharge: "₹1,500",
          createdOn: "15/12/2024 10:30AM",
          createdBy: "Admin",
        },
        {
          id: "2",
          slotNumber: "A-102",
          tower: "A",
          flat: "102",
          vehicleNumber: "MH-12-CD-5678",
          vehicleType: "Car",
          ownerName: "Godrej Living",
          status: "Allocated",
          allocatedDate: "05/01/2025",
          parkingType: "Basement",
          slotType: "Four Wheeler",
          monthlyCharge: "₹2,000",
          createdOn: "20/12/2024 02:15PM",
          createdBy: "Admin",
        },
       
        {
          id: "5",
          slotNumber: "B-102",
          tower: "FM",
          flat: "Office",
          vehicleNumber: "MH-12-GH-3456",
          vehicleType: "Car",
          ownerName: "Prashant Sangle",
          status: "Allocated",
          allocatedDate: "15/01/2025",
          parkingType: "Basement",
          slotType: "Four Wheeler",
          monthlyCharge: "₹2,000",
          createdOn: "28/12/2024 03:30PM",
          createdBy: "Admin",
        },
       
        {
          id: "7",
          slotNumber: "C-102",
          tower: "A",
          flat: "104",
          vehicleNumber: "MH-12-IJ-7890",
          vehicleType: "Car",
          ownerName: "Ashik Bhattacharya",
          status: "Allocated",
          allocatedDate: "20/01/2025",
          parkingType: "Open",
          slotType: "Four Wheeler",
          monthlyCharge: "₹1,000",
          createdOn: "10/01/2025 01:00PM",
          createdBy: "Admin",
        },
       
      ];

      return {
        parkingSlots: mockData,
        pagination: {
          total_count: mockData.length,
          total_pages: Math.ceil(mockData.length / pageSize),
          current_page: currentPage,
        },
      };
    },
    retry: 2,
    staleTime: 30000,
    gcTime: 60000,
  });

  const parkingSlots: ParkingSlot[] = parkingData?.parkingSlots || [];
  const totalCount = parkingData?.pagination?.total_count || 0;
  const totalPages = parkingData?.pagination?.total_pages || 1;

  const columns = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "slotNumber", label: "Slot Number", sortable: true },
    { key: "tower", label: "Tower", sortable: true },
    { key: "flat", label: "Flat", sortable: true },
    { key: "vehicleNumber", label: "Vehicle Number", sortable: true },
    { key: "vehicleType", label: "Vehicle Type", sortable: true },
    { key: "ownerName", label: "Owner Name", sortable: true },
    { key: "status", label: "Status", sortable: true },
    { key: "allocatedDate", label: "Allocated Date", sortable: true },
    { key: "parkingType", label: "Parking Type", sortable: true },
    { key: "slotType", label: "Slot Type", sortable: true },
    { key: "monthlyCharge", label: "Monthly Charge", sortable: true },
    { key: "createdOn", label: "Created On", sortable: true },
    { key: "createdBy", label: "Created By", sortable: true },
    
  ];

  const handleAddParking = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedParking(null);
    setFormData({
      slotNumber: "",
      vehicleType: "",
      parkingType: "",
      stickerNumber: "",
      tower: "",
      flat: "",
      vehicleNumber: "",
      chargeApplicable: "",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log("Form submitted:", formData);
      setIsSubmitting(false);
      if (isEditModalOpen) {
        toast.success("Parking slot updated successfully!");
      } else {
        toast.success("Parking slot added successfully!");
      }
      handleCloseModal();
      // Refresh the parking data
      refetch();
    }, 1000);
  };

  // Mock data for dropdowns
  const vehicleTypes = ["Two Wheeler", "Four Wheeler", "Electric Vehicle"];
  const parkingTypes = ["Covered", "Open", "Basement"];
  const towers = ["Tower A", "Tower B", "Tower C"];
  const flats = ["101", "102", "201", "202", "301", "302"];
  const chargeOptions = ["Yes", "No"];

  const handleViewParking = (item: ParkingSlot) => {
    navigate(`/parking/view/${item.id}`);
  };

  const handleEditParking = (item: ParkingSlot) => {
    setSelectedParking(item);
    setFormData({
      slotNumber: item.slotNumber,
      vehicleType: item.vehicleType,
      parkingType: item.parkingType,
      stickerNumber: "", // Add to mock data if needed
      tower: item.tower,
      flat: item.flat,
      vehicleNumber: item.vehicleNumber,
      chargeApplicable: "", // Add to mock data if needed
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteParking = (item: ParkingSlot) => {
    // TODO: Implement delete confirmation dialog
    toast.success(`Parking slot ${item.slotNumber} deleted`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Parking data refreshed");
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast.success("Exporting parking data...");
  };

  const getStatusColor = (status: ParkingSlot["status"]) => {
    switch (status) {
      case "Allocated":
        return "bg-green-100 text-green-700 border-green-200";
      case "Available":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Reserved":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Blocked":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const renderCell = (item: ParkingSlot, columnKey: string) => {
    switch (columnKey) {
        case "actions":
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleViewParking(item)}
              className="h-8 w-8 p-0 hover:bg-[#DBC2A9]"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEditParking(item)}
              className="h-8 w-8 p-0 hover:bg-[#DBC2A9]"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteParking(item)}
              className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      default:
      case "slotNumber":
        return (
          <span className="font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            {item.slotNumber}
          </span>
        );
      case "tower":
        return <span className="font-medium">{item.tower}</span>;
      case "flat":
        return <span>{item.flat}</span>;
      case "vehicleNumber":
        return (
          <span className="font-mono text-sm">
            {item.vehicleNumber || <span className="text-gray-400">-</span>}
          </span>
        );
      case "vehicleType":
        return (
          <span className="flex items-center gap-1">
            {item.vehicleType && <Car className="w-4 h-4 text-gray-500" />}
            {item.vehicleType || <span className="text-gray-400">-</span>}
          </span>
        );
      case "ownerName":
        return <span className="text-sm">{item.ownerName || <span className="text-gray-400">-</span>}</span>;
      case "status":
        return (
          <Badge variant="outline" className={`${getStatusColor(item.status)} border`}>
            {item.status}
          </Badge>
        );
      case "allocatedDate":
        return <span className="text-sm">{item.allocatedDate || <span className="text-gray-400">-</span>}</span>;
      case "parkingType":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
            {item.parkingType}
          </Badge>
        );
      case "slotType":
        return <span className="text-sm text-gray-600">{item.slotType}</span>;
      case "monthlyCharge":
        return <span className="font-medium text-gray-900">{item.monthlyCharge}</span>;
      case "createdOn":
        return <span className="text-sm text-gray-600">{item.createdOn}</span>;
      case "createdBy":
        return <span className="text-sm">{item.createdBy}</span>;
    
        return item[columnKey as keyof ParkingSlot];
    }
  };

  // Render pagination items
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i} className="cursor-pointer">
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              aria-disabled={isLoading}
              className={isLoading ? "pointer-events-none opacity-50" : ""}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1} className="cursor-pointer">
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
            aria-disabled={isLoading}
            className={isLoading ? "pointer-events-none opacity-50" : ""}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <span className="px-4">...</span>
          </PaginationItem>
        );
      }

      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={i} className="cursor-pointer">
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              aria-disabled={isLoading}
              className={isLoading ? "pointer-events-none opacity-50" : ""}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <span className="px-4">...</span>
          </PaginationItem>
        );
      }

      items.push(
        <PaginationItem key={totalPages} className="cursor-pointer">
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={currentPage === totalPages}
            aria-disabled={isLoading}
            className={isLoading ? "pointer-events-none opacity-50" : ""}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  // Render custom left actions
  const renderLeftActions = () => (
    <Button
      onClick={handleAddParking}
      className="bg-[#1A3765] text-white hover:bg-[#1A3765]/90 h-9 px-4 text-sm font-medium"
    >
      <Plus className="w-4 h-4 mr-2" />
      Add
    </Button>
  );

  // Render custom right actions
  const renderRightActions = () => (
    <div className="flex gap-2">
      {/* <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={isLoading}
        className="h-9"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
        Refresh
      </Button> */}
      {/* <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        className="h-9"
      >
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button> */}
    </div>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">Parking Management</h1>
      </div>

      <EnhancedTable
        data={parkingSlots}
        columns={columns}
        renderCell={renderCell}
        enableExport={true}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by slot, vehicle number, owner..."
        enableSearch={true}
        leftActions={renderLeftActions()}
        rightActions={renderRightActions()}
        emptyMessage="No parking slots found"
        loading={isLoading}
        pagination={false}
        storageKey="bms-parking-table"
      />

      {/* Custom Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={
                    currentPage === 1 || isLoading
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  className={
                    currentPage === totalPages || isLoading
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Loading state overlay */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Loading parking data...</span>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <p className="text-red-600 font-medium">Error loading parking data</p>
            <p className="text-sm text-gray-500 mt-1">{error?.message || "Please try again"}</p>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Add Parking Slot Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Add Parking Slot</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Parking Slot Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Slot Number */}
                <div className="space-y-2">
                  <Label htmlFor="slotNumber" className="text-sm font-medium text-gray-700">
                    Slot Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="slotNumber"
                    name="slotNumber"
                    value={formData.slotNumber}
                    onChange={handleInputChange}
                    placeholder="Enter slot number"
                    required
                    className="h-10"
                  />
                </div>

                {/* Vehicle Type */}
                <div className="space-y-2">
                  <Label htmlFor="vehicleType" className="text-sm font-medium text-gray-700">
                    Vehicle Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.vehicleType}
                    onValueChange={(value) => handleSelectChange("vehicleType", value)}
                    required
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Parking Type */}
                <div className="space-y-2">
                  <Label htmlFor="parkingType" className="text-sm font-medium text-gray-700">
                    Parking Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.parkingType}
                    onValueChange={(value) => handleSelectChange("parkingType", value)}
                    required
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select parking type" />
                    </SelectTrigger>
                    <SelectContent>
                      {parkingTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sticker Number */}
                <div className="space-y-2">
                  <Label htmlFor="stickerNumber" className="text-sm font-medium text-gray-700">
                    Sticker Number
                  </Label>
                  <Input
                    id="stickerNumber"
                    name="stickerNumber"
                    value={formData.stickerNumber}
                    onChange={handleInputChange}
                    placeholder="Enter sticker number"
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            {/* Associate With Flat Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Associate With Flat</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tower */}
                <div className="space-y-2">
                  <Label htmlFor="tower" className="text-sm font-medium text-gray-700">
                    Tower <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.tower}
                    onValueChange={(value) => handleSelectChange("tower", value)}
                    required
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select tower" />
                    </SelectTrigger>
                    <SelectContent>
                      {towers.map((tower) => (
                        <SelectItem key={tower} value={tower}>
                          {tower}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Flat */}
                <div className="space-y-2">
                  <Label htmlFor="flat" className="text-sm font-medium text-gray-700">
                    Select Flat <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.flat}
                    onValueChange={(value) => handleSelectChange("flat", value)}
                    required
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select flat" />
                    </SelectTrigger>
                    <SelectContent>
                      {flats.map((flat) => (
                        <SelectItem key={flat} value={flat}>
                          {flat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Vehicle Number */}
                <div className="space-y-2">
                  <Label htmlFor="vehicleNumber" className="text-sm font-medium text-gray-700">
                    Vehicle Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="vehicleNumber"
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleInputChange}
                    placeholder="Enter vehicle number"
                    required
                    className="h-10"
                  />
                </div>

                {/* Charge Applicable */}
                <div className="space-y-2">
                  <Label htmlFor="chargeApplicable" className="text-sm font-medium text-gray-700">
                    Charge Applicable <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.chargeApplicable}
                    onValueChange={(value) => handleSelectChange("chargeApplicable", value)}
                    required
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      {chargeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#1A3765] hover:bg-[#1A3765]/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Parking Slot Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Edit Parking Slot</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Parking Slot Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Slot Number */}
                <div className="space-y-2">
                  <Label htmlFor="edit-slotNumber" className="text-sm font-medium text-gray-700">
                    Slot Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-slotNumber"
                    name="slotNumber"
                    value={formData.slotNumber}
                    onChange={handleInputChange}
                    placeholder="Enter slot number"
                    required
                    className="h-10"
                  />
                </div>

                {/* Vehicle Type */}
                <div className="space-y-2">
                  <Label htmlFor="edit-vehicleType" className="text-sm font-medium text-gray-700">
                    Vehicle Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.vehicleType}
                    onValueChange={(value) => handleSelectChange("vehicleType", value)}
                    required
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Parking Type */}
                <div className="space-y-2">
                  <Label htmlFor="edit-parkingType" className="text-sm font-medium text-gray-700">
                    Parking Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.parkingType}
                    onValueChange={(value) => handleSelectChange("parkingType", value)}
                    required
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select parking type" />
                    </SelectTrigger>
                    <SelectContent>
                      {parkingTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sticker Number */}
                <div className="space-y-2">
                  <Label htmlFor="edit-stickerNumber" className="text-sm font-medium text-gray-700">
                    Sticker Number
                  </Label>
                  <Input
                    id="edit-stickerNumber"
                    name="stickerNumber"
                    value={formData.stickerNumber}
                    onChange={handleInputChange}
                    placeholder="Enter sticker number"
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            {/* Associate With Flat Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Associate With Flat</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tower */}
                <div className="space-y-2">
                  <Label htmlFor="edit-tower" className="text-sm font-medium text-gray-700">
                    Tower <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.tower}
                    onValueChange={(value) => handleSelectChange("tower", value)}
                    required
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select tower" />
                    </SelectTrigger>
                    <SelectContent>
                      {towers.map((tower) => (
                        <SelectItem key={tower} value={tower}>
                          {tower}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Flat */}
                <div className="space-y-2">
                  <Label htmlFor="edit-flat" className="text-sm font-medium text-gray-700">
                    Select Flat <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.flat}
                    onValueChange={(value) => handleSelectChange("flat", value)}
                    required
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select flat" />
                    </SelectTrigger>
                    <SelectContent>
                      {flats.map((flat) => (
                        <SelectItem key={flat} value={flat}>
                          {flat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Vehicle Number */}
                <div className="space-y-2">
                  <Label htmlFor="edit-vehicleNumber" className="text-sm font-medium text-gray-700">
                    Vehicle Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-vehicleNumber"
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleInputChange}
                    placeholder="Enter vehicle number"
                    required
                    className="h-10"
                  />
                </div>

                {/* Charge Applicable */}
                <div className="space-y-2">
                  <Label htmlFor="edit-chargeApplicable" className="text-sm font-medium text-gray-700">
                    Charge Applicable <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.chargeApplicable}
                    onValueChange={(value) => handleSelectChange("chargeApplicable", value)}
                    required
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      {chargeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#1A3765] hover:bg-[#1A3765]/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BMSParking;
