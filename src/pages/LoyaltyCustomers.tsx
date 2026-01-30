import React, { useState } from "react";
import { Eye, Edit, Trash2 } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const LoyaltyCustomers = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Mock data for customers
    const customersData = [
        {
            id: 1,
            customerId: "1234",
            customerName: "Deepa Synghal",
            tierLevel: "Plexits",
            tierValidity: "24/05/2026",
            websites: "V4I48",
            dateJoined: "13/04/2024",
        },
        {
            id: 2,
            customerId: "6789",
            customerName: "Sarita Thakur",
            tierLevel: "TEJAS",
            tierValidity: "04/05/2018",
            websites: "TEJA",
            dateJoined: "03/04/2001",
        },
        {
            id: 3,
            customerId: "4530",
            customerName: "Samuel Desousha",
            tierLevel: "Plexits",
            tierValidity: "02/04/2018",
            websites: "TEJA",
            dateJoined: "13/04/2026",
        },
        {
            id: 4,
            customerId: "4530",
            customerName: "Supreet",
            tierLevel: "Plexits",
            tierValidity: "02/04/2018",
            websites: "TEJA",
            dateJoined: "13/04/2026",
        },
    ];

    // Define columns for EnhancedTable
    const columns = [
        { key: "actions", label: "Actions", sortable: false },
        { key: "customerId", label: "Customer ID", sortable: true },
        { key: "customerName", label: "Customer Name", sortable: true },
        { key: "tierLevel", label: "Tier Level", sortable: true },
        { key: "tierValidity", label: "Tier Validity", sortable: true },
        { key: "websites", label: "Websites", sortable: true },
        { key: "dateJoined", label: "Date Joined", sortable: true },
    ];

    const renderCell = (item: any, columnKey: string) => {
        switch (columnKey) {
            case "actions":
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-600 hover:text-[#C72030] hover:bg-gray-100"
                            onClick={() => handleView(item.id)}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-600 hover:text-[#C72030] hover:bg-gray-100"
                            onClick={() => handleEdit(item.id)}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-600 hover:text-red-600 hover:bg-gray-100"
                            onClick={() => handleDelete(item.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                );
            case "customerId":
                return <span className="font-medium">{item.customerId || "-"}</span>;
            case "customerName":
                return <span>{item.customerName || "-"}</span>;
            case "tierLevel":
                return <span>{item.tierLevel || "-"}</span>;
            case "tierValidity":
                return <span>{item.tierValidity || "-"}</span>;
            case "websites":
                return <span>{item.websites || "-"}</span>;
            case "dateJoined":
                return <span>{item.dateJoined || "-"}</span>;
            default:
                return null;
        }
    };

    const handleView = (id: number) => {
        console.log("View customer:", id);
        navigate(`/loyalty/customers/${id}`);
    };

    const handleEdit = (id: number) => {
        console.log("Edit customer:", id);
        // navigate(`/loyalty/customers/${id}/edit`);
    };

    const handleDelete = (id: number) => {
        console.log("Delete customer:", id);
        // Show delete confirmation dialog
    };

    const handleGlobalSearch = (term: string) => {
        setSearchTerm(term);
    };

    const handleExport = () => {
        console.log("Exporting customers data...");
    };

    return (
        <div className="p-6 space-y-6 bg-white min-h-screen">
            {/* Customers Table */}
            <div className="space-y-4">
                <EnhancedTable
                    data={customersData}
                    columns={columns}
                    renderCell={renderCell}
                    enableExport={true}
                    enableGlobalSearch={true}
                    onGlobalSearch={handleGlobalSearch}
                    handleExport={handleExport}
                    loading={loading}
                    loadingMessage="Loading customers..."
                    emptyMessage="No customers found"
                />
            </div>
        </div>
    );
};

export default LoyaltyCustomers;
