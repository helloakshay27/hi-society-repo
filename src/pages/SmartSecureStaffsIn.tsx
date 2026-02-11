import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Phone, Mail } from "lucide-react";
import { getAuthHeader, getFullUrl } from "@/config/apiConfig";
import { toast } from "sonner";

interface StaffData {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  mobile: string;
  email: string;
  soc_staff_id: string | null;
  staff_image_url: string;
  department_name: string;
  work_type_name: string;
  unit_name: string | null;
  vendor_name: string | null;
  status_text: string;
  number_verified: boolean;
  staff_workings?: StaffWorking[];
}

interface StaffWorking {
  id: number;
  check_in: string;
  check_out: string | null;
  status: string;
}

// Dummy data for UI preview
const dummyStaffData: StaffData[] = [
  {
    id: 1,
    first_name: "Sagar",
    last_name: "Singh",
    full_name: "Sagar Singh",
    mobile: "9850562622",
    email: "sagar.singh@example.com",
    soc_staff_id: "STF001",
    staff_image_url: "",
    department_name: "Security",
    work_type_name: "Guard",
    unit_name: "Tower A",
    vendor_name: "SecureGuard Services",
    status_text: "Active",
    number_verified: true,
    staff_workings: [
      {
        id: 1,
        check_in: "2026-02-11T08:30:00",
        check_out: null,
        status: "in",
      },
    ],
  },
  {
    id: 2,
    first_name: "Devesh",
    last_name: "J",
    full_name: "Devesh J",
    mobile: "9564292826",
    email: "devesh.j@example.com",
    soc_staff_id: "STF002",
    staff_image_url: "",
    department_name: "Housekeeping",
    work_type_name: "Cleaner",
    unit_name: null,
    vendor_name: "CleanPro Ltd",
    status_text: "Active",
    number_verified: true,
    staff_workings: [
      {
        id: 2,
        check_in: "2026-02-11T09:00:00",
        check_out: null,
        status: "in",
      },
    ],
  },
  {
    id: 3,
    first_name: "Mathu",
    last_name: "Pol",
    full_name: "Mathu Pol",
    mobile: "8836101019",
    email: "",
    soc_staff_id: "STF003",
    staff_image_url: "",
    department_name: "Maintenance",
    work_type_name: "Electrician",
    unit_name: "Tower B",
    vendor_name: null,
    status_text: "Active",
    number_verified: false,
    staff_workings: [
      {
        id: 3,
        check_in: "2026-02-11T07:45:00",
        check_out: null,
        status: "in",
      },
    ],
  },
  {
    id: 4,
    first_name: "Santosh",
    last_name: "Yadav",
    full_name: "Santosh Yadav",
    mobile: "0123456789",
    email: "santosh.yadav@example.com",
    soc_staff_id: "STF004",
    staff_image_url: "",
    department_name: "Operations",
    work_type_name: "Plumber",
    unit_name: "Tower C",
    vendor_name: "FixIt Services",
    status_text: "Approved",
    number_verified: true,
    staff_workings: [
      {
        id: 4,
        check_in: "2026-02-11T08:15:00",
        check_out: null,
        status: "in",
      },
    ],
  },
  {
    id: 5,
    first_name: "Vikarm",
    last_name: "Rathod",
    full_name: "Vikarm Rathod",
    mobile: "9876543210",
    email: "vikarm.rathod@example.com",
    soc_staff_id: "STF005",
    staff_image_url: "",
    department_name: "Security",
    work_type_name: "Supervisor",
    unit_name: "Main Gate",
    vendor_name: null,
    status_text: "Active",
    number_verified: true,
    staff_workings: [
      {
        id: 5,
        check_in: "2026-02-11T06:00:00",
        check_out: null,
        status: "in",
      },
    ],
  },
  {
    id: 6,
    first_name: "Satyam",
    last_name: "M",
    full_name: "Satyam M",
    mobile: "7895789582",
    email: "satyam.m@example.com",
    soc_staff_id: "STF006",
    staff_image_url: "",
    department_name: "Gardening",
    work_type_name: "Gardener",
    unit_name: null,
    vendor_name: "GreenScape Services",
    status_text: "Active",
    number_verified: false,
    staff_workings: [
      {
        id: 6,
        check_in: "2026-02-11T07:00:00",
        check_out: null,
        status: "in",
      },
    ],
  },
];

const SmartSecureStaffsIn: React.FC = () => {
  const [staffsIn, setStaffsIn] = useState<StaffData[]>(dummyStaffData);
  const [filteredStaffs, setFilteredStaffs] = useState<StaffData[]>(dummyStaffData);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedStaffId, setExpandedStaffId] = useState<number | null>(null);

  // Fetch staff in data
  const fetchStaffsIn = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        getFullUrl("/crm/admin/society_staffs.json"),
        {
          headers: {
            Authorization: getAuthHeader(),
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Filter only staff who are currently checked in
        const staffsInData = (data.society_staffs || []).filter(
          (staff: StaffData) =>
            staff.staff_workings &&
            staff.staff_workings.length > 0 &&
            staff.staff_workings[0].check_out === null
        );
        setStaffsIn(staffsInData);
        setFilteredStaffs(staffsInData);
      }
    } catch (error) {
      console.error("Error fetching staffs in:", error);
      // Using dummy data on error
      setStaffsIn(dummyStaffData);
      setFilteredStaffs(dummyStaffData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Comment out API call to use dummy data
    // fetchStaffsIn();
  }, []);

  // Search handler
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredStaffs(staffsIn);
    } else {
      const filtered = staffsIn.filter(
        (staff) =>
          staff.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          staff.mobile.includes(searchTerm) ||
          staff.department_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          staff.work_type_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStaffs(filtered);
    }
  }, [searchTerm, staffsIn]);

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("active") || statusLower.includes("approved")) {
      return "bg-green-100 text-green-800";
    } else if (statusLower.includes("pending")) {
      return "bg-yellow-100 text-yellow-800";
    } else {
      return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Staffs In</h1>
          <Button
            onClick={fetchStaffsIn}
            variant="outline"
            className="border-gray-300"
          >
            Refresh
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search using staff's name or mobile number"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
      </div>

      {/* Staff Cards */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-gray-500">Loading staffs...</div>
          </div>
        ) : filteredStaffs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-gray-400 text-lg mb-2">No Staff In</div>
            <div className="text-gray-500 text-sm">
              {searchTerm
                ? "No staff found matching your search"
                : "No staff are currently checked in"}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredStaffs.map((staff) => (
              <div key={staff.id} className="bg-white border border-gray-200 rounded-none shadow-sm">
                {/* Main Staff Info Section */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    {/* Profile Photo */}
                    {staff.staff_image_url ? (
                      <img
                        src={staff.staff_image_url}
                        alt={staff.full_name}
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center border-2 border-gray-200">
                        <span className="text-white font-semibold text-2xl">
                          {getInitials(staff.full_name)}
                        </span>
                      </div>
                    )}

                    {/* Name, ID, Badge */}
                    <div>
                      <h2 className="text-2xl font-normal text-gray-900 mb-1">
                        {staff.full_name}
                      </h2>
                      <p className="text-gray-600 text-base mb-2">
                        {staff.mobile}
                      </p>
                      <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 rounded-full px-3 py-1 text-sm font-normal">
                        Personal
                      </Badge>
                    </div>
                  </div>

                  {/* IN Button */}
                  <div className="border-2 border-green-400 text-green-500 px-8 py-2 text-xl font-semibold rounded">
                    IN
                  </div>
                </div>

                {/* Associated Flats Section */}
                <div
                  className={`${
                    expandedStaffId === staff.id
                      ? "bg-sky-400"
                      : "bg-gray-100 hover:bg-gray-200"
                  } transition-colors cursor-pointer`}
                  onClick={() =>
                    setExpandedStaffId(
                      expandedStaffId === staff.id ? null : staff.id
                    )
                  }
                >
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-lg font-medium ${
                          expandedStaffId === staff.id
                            ? "text-white"
                            : "text-gray-700"
                        }`}
                      >
                        Associated Flats
                      </span>
                      <span
                        className={`${
                          expandedStaffId === staff.id
                            ? "bg-white text-sky-500"
                            : "bg-orange-400 text-white"
                        } rounded-full w-7 h-7 flex items-center justify-center text-sm font-semibold`}
                      >
                        1
                      </span>
                    </div>
                    <button
                      className={`text-2xl font-bold ${
                        expandedStaffId === staff.id
                          ? "text-white"
                          : "text-gray-600"
                      }`}
                    >
                      {expandedStaffId === staff.id ? "−" : "+"}
                    </button>
                  </div>

                  {/* Expanded Content */}
                  {expandedStaffId === staff.id && (
                    <div className="bg-white px-4 py-3 border-t border-gray-200">
                      <p className="text-gray-700">
                        {staff.unit_name || "A - 101"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartSecureStaffsIn;
