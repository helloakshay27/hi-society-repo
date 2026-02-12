import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
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
    first_name: "Devesh",
    last_name: "J",
    full_name: "Devesh J",
    mobile: "9564292826",
    email: "devesh.j@example.com",
    soc_staff_id: "STF001",
    staff_image_url: "",
    department_name: "Housekeeping",
    work_type_name: "Cleaner",
    unit_name: "Tower A",
    vendor_name: "CleanPro Ltd",
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
    first_name: "Deepak",
    last_name: "Gupta",
    full_name: "Deepak Gupta",
    mobile: "7378490762",
    email: "deepak.gupta@example.com",
    soc_staff_id: "STF002",
    staff_image_url: "",
    department_name: "Security",
    work_type_name: "Guard",
    unit_name: "Main Gate",
    vendor_name: null,
    status_text: "Active",
    number_verified: true,
    staff_workings: [
      {
        id: 2,
        check_in: "2026-02-11T07:00:00",
        check_out: null,
        status: "in",
      },
    ],
  },
  {
    id: 3,
    first_name: "Sagar",
    last_name: "Singh",
    full_name: "Sagar Singh",
    mobile: "1145454884",
    email: "sagar.singh@example.com",
    soc_staff_id: "STF003",
    staff_image_url: "",
    department_name: "Maintenance",
    work_type_name: "Electrician",
    unit_name: "Tower B",
    vendor_name: "FixIt Services",
    status_text: "Active",
    number_verified: true,
    staff_workings: [
      {
        id: 3,
        check_in: "2026-02-11T09:15:00",
        check_out: null,
        status: "in",
      },
    ],
  },
  {
    id: 4,
    first_name: "Ubaid",
    last_name: "Hashmat",
    full_name: "Ubaid Hashmat",
    mobile: "9876543210",
    email: "ubaid.hashmat@example.com",
    soc_staff_id: "STF004",
    staff_image_url: "",
    department_name: "Operations",
    work_type_name: "Supervisor",
    unit_name: "Tower C",
    vendor_name: null,
    status_text: "Active",
    number_verified: false,
    staff_workings: [
      {
        id: 4,
        check_in: "2026-02-11T08:00:00",
        check_out: null,
        status: "in",
      },
    ],
  },
];

const SmartSecureStaffsOut: React.FC = () => {
  const [staffsIn, setStaffsIn] = useState<StaffData[]>(dummyStaffData);
  const [filteredStaffs, setFilteredStaffs] = useState<StaffData[]>(dummyStaffData);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch staff in data (who need to check out)
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
          staff.mobile.includes(searchTerm)
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

  const handleCheckOut = async (staffId: number) => {
    toast.success("Check out functionality will be implemented");
    // TODO: Implement check out API call
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Staffs Out</h1>
        </div>

        {/* Search Bar with Go Button */}
        <div className="flex items-center gap-2 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search using staff's name or mobile number"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <Button className="bg-green-600 hover:bg-green-700 text-white px-6 h-10">
            Go!
          </Button>
        </div>
      </div>

      {/* Staff List */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-gray-500">Loading staffs...</div>
          </div>
        ) : filteredStaffs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-gray-400 text-lg mb-2">No Staff Available</div>
            <div className="text-gray-500 text-sm">
              {searchTerm
                ? "No staff found matching your search"
                : "No staff are currently checked in"}
            </div>
          </div>
        ) : (
          <div className="bg-white border-l-4 border-blue-400 shadow-sm">
            {filteredStaffs.map((staff, index) => (
              <div
                key={staff.id}
                className={`flex items-center justify-between px-4 py-4 ${
                  index !== filteredStaffs.length - 1 ? "border-b border-gray-200" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Profile Photo */}
                  {staff.staff_image_url ? (
                    <img
                      src={staff.staff_image_url}
                      alt={staff.full_name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-300 to-orange-400 flex items-center justify-center border-2 border-gray-200">
                      <span className="text-white font-semibold text-lg">
                        {getInitials(staff.full_name)}
                      </span>
                    </div>
                  )}

                  {/* Name, Mobile, Badges */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {staff.full_name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">{staff.mobile}</p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 rounded-full px-3 py-0.5 text-xs font-normal">
                        Personal
                      </Badge>
                      <Badge className="bg-green-500 text-white hover:bg-green-500 rounded px-2 py-0.5 text-xs font-medium">
                        Check In
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* OUT Button */}
                <Button
                  onClick={() => handleCheckOut(staff.id)}
                  className="border-2 border-orange-500 bg-white text-orange-500 hover:bg-orange-50 px-8 py-2 text-lg font-semibold rounded h-auto"
                >
                  OUT
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartSecureStaffsOut;
