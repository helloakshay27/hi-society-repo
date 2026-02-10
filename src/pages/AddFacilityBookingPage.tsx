import {
  FormControl,
  InputLabel,
  MenuItem,
  Select as MuiSelect,
  TextField,
} from "@mui/material";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const fieldStyles = {
  height: "45px",
  backgroundColor: "#fff",
  borderRadius: "4px",
  "& .MuiOutlinedInput-root": {
    height: "45px",
    "& fieldset": {
      borderColor: "#ddd",
    },
    "&:hover fieldset": {
      borderColor: "#C72030",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#C72030",
    },
  },
  "& .MuiInputLabel-root": {
    "&.Mui-focused": {
      color: "#C72030",
    },
  },
};

const AddFacilityBookingPage = () => {
  const navigate = useNavigate();

  const baseUrl = localStorage.getItem("baseUrl");
  const token = localStorage.getItem("token");
  const societyId = localStorage.getItem("selectedUserSociety");

  const [selectedTowerId, setSelectedTowerId] = useState("");
  const [towers, setTowers] = useState([]);
  const [selectedFlatId, setSelectedFlatId] = useState("");
  const [flats, setFlats] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [users, setUsers] = useState([]);

  // Facility Info states
  const [selectedFacilitySetup, setSelectedFacilitySetup] = useState("");
  const [facilitySetups, setFacilitySetups] = useState([]);
  const [facilityDetails, setFacilityDetails] = useState<any>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [numOfPersons, setNumOfPersons] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSubFacility, setSelectedSubFacility] = useState("");
  const [subFacilityDetails, setSubFacilityDetails] = useState<any>(null);

  console.log(facilityDetails);

  // Member counts state
  const [memberCounts, setMemberCounts] = useState({
    adultMember: 0,
    childMember: 0,
    adultGuest: 0,
    childGuest: 0,
    adultTenant: 0,
    childTenant: 0,
    adultNonMember: 0,
    childNonMember: 0,
  });

  // Get total people count
  const getTotalPeople = () => {
    return Object.values(memberCounts).reduce((sum, count) => sum + count, 0);
  };

  // Get max people limit
  const getMaxPeople = () => {
    if (selectedSubFacility && subFacilityDetails) {
      return subFacilityDetails.max_people || 0;
    }
    return facilityDetails?.max_people || 0;
  };

  // Calculate costs
  const calculateCosts = () => {
    const charge =
      selectedSubFacility && subFacilityDetails
        ? subFacilityDetails.facility_charge
        : facilityDetails?.facility_charge;

    if (!charge)
      return { subTotal: 0, gst: 0, convenienceCharge: 0, grandTotal: 0 };

    let subTotal = 0;

    // Member charges
    subTotal += memberCounts.adultMember * (charge.adult_member_charge || 0);
    subTotal += memberCounts.childMember * (charge.child_member_charge || 0);

    // Guest charges
    subTotal += memberCounts.adultGuest * (charge.adult_guest_charge || 0);
    subTotal += memberCounts.childGuest * (charge.child_guest_charge || 0);

    // Tenant charges
    subTotal += memberCounts.adultTenant * (charge.adult_tenant_charge || 0);
    subTotal += memberCounts.childTenant * (charge.child_tenant_charge || 0);

    // Non-member charges
    subTotal +=
      memberCounts.adultNonMember * (charge.adult_non_member_charge || 0);
    subTotal +=
      memberCounts.childNonMember * (charge.child_non_member_charge || 0);

    const gst_percentage =
      selectedSubFacility && subFacilityDetails
        ? (subFacilityDetails.gst || 0) / 100
        : 0.18; // Default 18% GST if not from sub-facility

    const gst = subTotal * gst_percentage;
    const convenienceCharge = 0; // Can be configured
    const grandTotal = subTotal + gst + convenienceCharge;

    return { subTotal, gst, convenienceCharge, grandTotal };
  };

  // Handle count change
  const handleCountChange = (
    field: keyof typeof memberCounts,
    delta: number
  ) => {
    const newValue = memberCounts[field] + delta;
    const newTotal = getTotalPeople() + delta;

    // Don't allow negative values
    if (newValue < 0) return;

    // Don't exceed max people limit
    if (newTotal > getMaxPeople()) return;

    setMemberCounts((prev) => ({
      ...prev,
      [field]: newValue,
    }));
  };

  // Reset member counts when facility changes
  const resetMemberCounts = () => {
    setMemberCounts({
      adultMember: 0,
      childMember: 0,
      adultGuest: 0,
      childGuest: 0,
      adultTenant: 0,
      childTenant: 0,
      adultNonMember: 0,
      childNonMember: 0,
    });
    setNumOfPersons("");
    setPaymentMethod("");
    setAvailableSlots([]);
    setSelectedSlotIds([]);
    setSelectedSubFacility("");
    setSubFacilityDetails(null);
  };

  // Helper function to check if slots are consecutive
  const areConsecutiveSlots = (currentSlotIds: string[], newSlotId: string): boolean => {
    if (currentSlotIds.length === 0) return true; // First slot is always valid

    // Find the slot objects for validation
    const allSlotIds = [...currentSlotIds, newSlotId].map(id => parseInt(id));
    allSlotIds.sort((a, b) => a - b);

    // Check if all IDs are consecutive numbers
    for (let i = 1; i < allSlotIds.length; i++) {
      if (allSlotIds[i] !== allSlotIds[i - 1] + 1) {
        return false;
      }
    }

    return true;
  };

  // Helper function to check if a slot should be enabled
  const isSlotEnabled = (slotId: string): boolean => {
    // If consecutive slots not required, all slots are enabled
    if (!facilityDetails?.consecutive_slot) return true;

    // If slot is already selected, it's enabled (for deselection)
    if (selectedSlotIds.includes(slotId)) return true;

    // If no slots selected yet, all slots are enabled
    if (selectedSlotIds.length === 0) return true;

    // Check if adding this slot would maintain consecutiveness
    return areConsecutiveSlots(selectedSlotIds, slotId);
  };

  // Fetch Towers
  const fetchTowers = async () => {
    try {
      const response = await axios.get(
        `https://${baseUrl}/crm/admin/society_blocks.json?society_id=${societyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setTowers(response.data.society_blocks);
    } catch (error) {
      console.log(error);
    }
  };

  // Fetch Flats based on selected tower
  const fetchFlats = async () => {
    try {
      const response = await axios.get(
        `https://${baseUrl}/crm/admin/society_blocks/${selectedTowerId}/flats.json?q[active_eq]=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setFlats(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  // Fetch Users based on selected flat
  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        `https://${baseUrl}/crm/admin/flat_users.json?q[user_flat_society_flat_id_eq]=${selectedFlatId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUsers(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  // Fetch Facility Setups
  const fetchFacilitySetups = async () => {
    try {
      const response = await axios.get(
        `https://${baseUrl}/crm/admin/facility_setups.json`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setFacilitySetups(response.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  // Initial fetch of towers and facility setups
  useEffect(() => {
    fetchTowers();
    fetchFacilitySetups();
  }, []);

  // Fetch flats when tower changes
  useEffect(() => {
    if (selectedTowerId) {
      setSelectedFlatId("");
      setSelectedUserId("");
      setFlats([]);
      setUsers([]);
      fetchFlats();
    }
  }, [selectedTowerId]);

  // Fetch users when flat changes
  useEffect(() => {
    if (selectedFlatId) {
      setSelectedUserId("");
      setUsers([]);
      fetchUsers();
    }
  }, [selectedFlatId]);

  // Fetch Facility Details
  const fetchFacilityDetails = async () => {
    try {
      const response = await axios.get(
        `https://${baseUrl}/crm/admin/facility_setups/${selectedFacilitySetup}.json`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setFacilityDetails(response.data.facility_setup);
    } catch (error) {
      console.log(error);
    }
  };

  // Fetch Sub-Facility Details
  const fetchSubFacilityDetails = async (subFacilityId: string) => {
    try {
      const response = await axios.get(
        `https://${baseUrl}/get_sub_facility.json?sub_facility_id=${subFacilityId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSubFacilityDetails(response.data.sub_facility);
    } catch (error) {
      console.log(error);
      setSubFacilityDetails(null);
    }
  };

  // Fetch facility details when facility is selected
  useEffect(() => {
    if (selectedFacilitySetup) {
      resetMemberCounts();
      fetchFacilityDetails();
    } else {
      setFacilityDetails(null);
      resetMemberCounts();
    }
  }, [selectedFacilitySetup]);

  // Fetch Slots (Bookable or Requestable)
  const fetchSlots = async () => {
    if (!selectedFacilitySetup || !bookingDate) return;

    setLoadingSlots(true);
    try {
      const formattedDate = bookingDate.replace(/-/g, "/");
      let url = "";

      if (facilityDetails?.fac_type === "bookable") {
        url = `https://${baseUrl}/get_schedules_admin_facility.json?id=${selectedFacilitySetup}&q[on_date]=${formattedDate}&user_society_id=${societyId}`;
      } else if (facilityDetails?.fac_type === "request") {
        url = `https://${baseUrl}/requestable_slots.json?id=${selectedFacilitySetup}&q[on_date]=${formattedDate}`;
      }

      if (url) {
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAvailableSlots(
          response.data.slots || response.data.requestable_slots || []
        );
      }
    } catch (error) {
      console.log("Error fetching slots:", error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Fetch slots when date or facility details change
  useEffect(() => {
    if (facilityDetails && bookingDate) {
      fetchSlots();
    }
  }, [facilityDetails, bookingDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const booked_members_attributes: any[] = [];

      const getBaseName = (key: string) => {
        if (key.includes("Member")) return "member";
        if (key.includes("Guest")) return "guest";
        if (key.includes("Tenant")) return "tenant";
        if (key.includes("NonMember")) return "non_member";
        return key;
      };

      const mapping: Record<string, string> = {
        adultMember: "adult_member",
        childMember: "child_member",
        adultGuest: "adult_guest",
        childGuest: "child_guest",
        adultTenant: "adult_tenant",
        childTenant: "child_tenant",
        adultNonMember: "adult_non_member",
        childNonMember: "child_non_member",
      };

      Object.entries(memberCounts).forEach(([key, value]) => {
        if (value > 0) {
          booked_members_attributes.push({
            name: getBaseName(key),
            oftype: mapping[key] || key,
            total: value,
            user_id: localStorage.getItem("userId"),
          });
        }
      });

      const payload = {
        tower: selectedTowerId,
        flat: selectedFlatId,
        facility_booking: {
          facility_id: selectedFacilitySetup,
          user_society_id: selectedUserId,
          resource_id: selectedFacilitySetup,
          resource_type: "FacilitySetup",
          startdate: bookingDate.replace(/-/g, "/"),
          selected_slots: selectedSlotIds,
          payment_method: paymentMethod,
          fac_type: facilityDetails?.fac_type,
          person_no: numOfPersons,
          sub_facility_setup_id: selectedSubFacility || undefined,
          book_by_id: selectedSlotIds[0],
          book_by: "slot",
          booked_members_attributes,
        },
      };

      await axios.post(
        `https://${baseUrl}/crm/admin/facility_bookings.json`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Facility booking created successfully");
      navigate(-1);
    } catch (error) {
      console.log(error);
      toast.error("Failed to create facility booking");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 hover:text-gray-800 mb-4 text-gray-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-medium text-gray-900">User Selection</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormControl fullWidth>
                <InputLabel shrink>Tower *</InputLabel>
                <MuiSelect
                  value={selectedTowerId}
                  onChange={(e) => setSelectedTowerId(e.target.value)}
                  label="Tower *"
                  displayEmpty
                  sx={fieldStyles}
                >
                  <MenuItem value="">
                    <em>Select Tower</em>
                  </MenuItem>
                  {towers.map((tower: any) => (
                    <MenuItem key={tower.id} value={tower.id}>
                      {tower.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel shrink>Flat *</InputLabel>
                <MuiSelect
                  value={selectedFlatId}
                  onChange={(e) => setSelectedFlatId(e.target.value)}
                  label="Flat *"
                  displayEmpty
                  disabled={!selectedTowerId}
                  sx={fieldStyles}
                >
                  <MenuItem value="">
                    <em>Select Flat</em>
                  </MenuItem>
                  {flats.map((flat: any) => (
                    <MenuItem key={flat.id} value={flat.id}>
                      {flat.flat_no}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel shrink>User *</InputLabel>
                <MuiSelect
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  label="User *"
                  displayEmpty
                  disabled={!selectedFlatId}
                  sx={fieldStyles}
                >
                  <MenuItem value="">
                    <em>Select User</em>
                  </MenuItem>
                  {users.map((u: any) => {
                    const [name, id] = u;
                    return (
                      <MenuItem key={id} value={id}>
                        {name}
                      </MenuItem>
                    );
                  })}
                </MuiSelect>
              </FormControl>
            </div>
          </div>
        </div>

        {/* Facility Info Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-medium text-gray-900">Facility Info</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormControl fullWidth>
                <InputLabel shrink>Facility *</InputLabel>
                <MuiSelect
                  value={selectedFacilitySetup}
                  onChange={(e) => setSelectedFacilitySetup(e.target.value)}
                  label="Facility *"
                  displayEmpty
                  sx={fieldStyles}
                >
                  <MenuItem value="">
                    <em>Select Facility</em>
                  </MenuItem>
                  {facilitySetups.map((facility: any) => (
                    <MenuItem key={facility.id} value={facility.id}>
                      {facility.fac_name} ({facility.fac_type})
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              {facilityDetails?.sub_facility_enabled && (
                <FormControl fullWidth>
                  <InputLabel shrink>Sub-Facility *</InputLabel>
                  <MuiSelect
                    value={selectedSubFacility}
                    onChange={(e) => {
                      const val = e.target.value as string;
                      setSelectedSubFacility(val);
                      if (val) fetchSubFacilityDetails(val);
                      else setSubFacilityDetails(null);
                    }}
                    label="Sub-Facility *"
                    displayEmpty
                    sx={fieldStyles}
                  >
                    <MenuItem value="">
                      <em>Select Sub-Facility</em>
                    </MenuItem>
                    {facilityDetails.sub_facilities?.map((sub: any) => (
                      <MenuItem
                        key={sub.sub_facility.id}
                        value={sub.sub_facility.id}
                      >
                        {sub.sub_facility.name}
                      </MenuItem>
                    ))}
                  </MuiSelect>
                </FormControl>
              )}

              <TextField
                label="Date *"
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                sx={fieldStyles}
              />
            </div>

            {/* Slots Selection UI */}
            {(facilityDetails?.fac_type === "bookable" ||
              facilityDetails?.fac_type === "request") &&
              bookingDate && (
                <div className="mt-8 space-y-6 animate-in fade-in duration-500 border-t border-gray-100 pt-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      Select Slot <span className="text-[#C72030]">*</span>
                      {loadingSlots && (
                        <span className="text-xs font-normal text-gray-500 animate-pulse">
                          (Loading...)
                        </span>
                      )}
                      {facilityDetails?.consecutive_slot && (
                        <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-md">
                          Consecutive slots only
                        </span>
                      )}
                    </h3>

                    {availableSlots.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {availableSlots.map((slot: any) => {
                          const slotIdStr = slot.id.toString();
                          const isEnabled = isSlotEnabled(slotIdStr);
                          const isSelected = selectedSlotIds.includes(slotIdStr);

                          return (
                            <div
                              key={slot.id}
                              className={`flex items-center space-x-3 p-4 border rounded-lg transition-all ${isEnabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                                } ${isSelected
                                  ? "border-[#C72030] bg-[#C72030]/5 shadow-sm"
                                  : isEnabled
                                    ? "border-gray-100 bg-white hover:border-gray-200"
                                    : "border-gray-100 bg-gray-50"
                                }`}
                              onClick={() => {
                                if (!isEnabled) return;

                                // Check if we're deselecting
                                if (isSelected) {
                                  // If consecutive slots are required, check if remaining slots would still be consecutive
                                  if (facilityDetails?.consecutive_slot && selectedSlotIds.length > 1) {
                                    const remainingSlots = selectedSlotIds.filter((id) => id !== slotIdStr);

                                    // Check if remaining slots are consecutive
                                    if (remainingSlots.length > 1) {
                                      const sortedIds = remainingSlots.map(id => parseInt(id)).sort((a, b) => a - b);
                                      let isConsecutive = true;

                                      for (let i = 1; i < sortedIds.length; i++) {
                                        if (sortedIds[i] !== sortedIds[i - 1] + 1) {
                                          isConsecutive = false;
                                          break;
                                        }
                                      }

                                      if (!isConsecutive) {
                                        toast.error("Cannot deselect this slot - remaining slots must be consecutive");
                                        return;
                                      }
                                    }
                                  }

                                  setSelectedSlotIds((prev) => prev.filter((id) => id !== slotIdStr));
                                  return;
                                }

                                // Add the slot
                                setSelectedSlotIds((prev) => [...prev, slotIdStr]);
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={!isEnabled}
                                onChange={() => { }} // Handled by div click
                                className="w-4 h-4 text-[#C72030] rounded border-gray-300 focus:ring-[#C72030] disabled:opacity-50"
                              />
                              <span className={`text-sm font-medium ${isEnabled ? 'text-gray-800' : 'text-gray-400'
                                }`}>
                                {slot.ampm ||
                                  `${slot.start_time} to ${slot.end_time}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      !loadingSlots && (
                        <div className="rounded-lg">
                          <p className="text-sm text-gray-500">
                            No slots available for the selected date.
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Member Details Section - Only show if facility is bookable and has charges */}
            {facilityDetails?.fac_type === "bookable" &&
              (facilityDetails?.facility_charge ||
                subFacilityDetails?.facility_charge) && (
                <div className="mt-8 space-y-6 animate-in fade-in duration-500">
                  <div className="border-t border-gray-100 pt-6">
                    <div className="flex justify-between items-end mb-6">
                      <h3 className="text-[18px] font-semibold text-gray-900">
                        Members Details
                      </h3>
                      <div className="text-[14px] text-gray-500">
                        Total:{" "}
                        <span className="font-bold text-gray-900">
                          {getTotalPeople()}
                        </span>{" "}
                        /{" "}
                        <span className="font-bold text-gray-900">
                          {getMaxPeople()} Max
                        </span>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-100">
                      <table className="w-full text-sm text-left">
                        <thead className="text-[11px] text-gray-500 uppercase bg-[#F8F9FA] border-b border-gray-100">
                          <tr>
                            <th className="px-6 py-4 font-bold tracking-wider w-1/3">
                              CATEGORY
                            </th>
                            <th className="px-6 py-4 font-bold tracking-wider text-center w-1/3">
                              ADULT
                            </th>
                            <th className="px-6 py-4 font-bold tracking-wider text-center w-1/3">
                              CHILD
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                          {(() => {
                            const activeCharge =
                              selectedSubFacility && subFacilityDetails
                                ? subFacilityDetails.facility_charge
                                : facilityDetails?.facility_charge;

                            if (!activeCharge) return null;

                            return [
                              {
                                label: "Member",
                                key: "Member",
                                visible: activeCharge.member,
                                adultCharge: activeCharge.adult_member_charge,
                                childCharge: activeCharge.child_member_charge,
                              },
                              {
                                label: "Guest",
                                key: "Guest",
                                visible: activeCharge.guest,
                                adultCharge: activeCharge.adult_guest_charge,
                                childCharge: activeCharge.child_guest_charge,
                              },
                              {
                                label: "Tenant",
                                key: "Tenant",
                                visible: activeCharge.tenant,
                                adultCharge: activeCharge.adult_tenant_charge,
                                childCharge: activeCharge.child_tenant_charge,
                              },
                              {
                                label: "Non Member",
                                key: "NonMember",
                                visible: activeCharge.non_member,
                                adultCharge:
                                  activeCharge.adult_non_member_charge,
                                childCharge:
                                  activeCharge.child_non_member_charge,
                              },
                            ].map(
                              (row) =>
                                row.visible && (
                                  <tr
                                    key={row.key}
                                    className="hover:bg-gray-50/50 transition-colors"
                                  >
                                    <td className="px-6 py-5 font-semibold text-gray-900">
                                      {row.label}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-center gap-4">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleCountChange(
                                                `adult${row.key}` as any,
                                                -1
                                              )
                                            }
                                            className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-[#E53E3E] hover:bg-red-50 hover:border-red-200 transition-all active:scale-95"
                                          >
                                            <span className="text-xl leading-none mb-1">
                                              -
                                            </span>
                                          </button>
                                          <span className="text-[16px] font-bold text-gray-900 w-4">
                                            {
                                              memberCounts[
                                              `adult${row.key}` as keyof typeof memberCounts
                                              ]
                                            }
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleCountChange(
                                                `adult${row.key}` as any,
                                                1
                                              )
                                            }
                                            className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-[#38A169] hover:bg-green-50 hover:border-green-200 transition-all active:scale-95"
                                          >
                                            <span className="text-xl leading-none">
                                              +
                                            </span>
                                          </button>
                                        </div>
                                        <div className="text-[10px] font-medium text-gray-500">
                                          Charge: ₹ {row.adultCharge || 0}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-center gap-4">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleCountChange(
                                                `child${row.key}` as any,
                                                -1
                                              )
                                            }
                                            className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-[#E53E3E] hover:bg-red-50 hover:border-red-200 transition-all active:scale-95"
                                          >
                                            <span className="text-xl leading-none mb-1">
                                              -
                                            </span>
                                          </button>
                                          <span className="text-[16px] font-bold text-gray-900 w-4">
                                            {
                                              memberCounts[
                                              `child${row.key}` as keyof typeof memberCounts
                                              ]
                                            }
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleCountChange(
                                                `child${row.key}` as any,
                                                1
                                              )
                                            }
                                            className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-[#38A169] hover:bg-green-50 hover:border-green-200 transition-all active:scale-95"
                                          >
                                            <span className="text-xl leading-none">
                                              +
                                            </span>
                                          </button>
                                        </div>
                                        <div className="text-[10px] font-medium text-gray-500">
                                          Charge: ₹ {row.childCharge || 0}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Cost Summary Card */}
                  <div className="bg-[#F8F9FA] p-8 rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center text-gray-600">
                      <span className="text-sm font-medium">Sub Total</span>
                      <span className="text-sm font-semibold text-gray-900">
                        ₹{" "}
                        {calculateCosts().subTotal.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600">
                      <span className="text-sm font-medium">GST (18%)</span>
                      <span className="text-sm font-semibold text-gray-900">
                        ₹{" "}
                        {calculateCosts().gst.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600 border-b border-gray-200 pb-5">
                      <span className="text-sm font-medium">
                        Convenience Charge
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        ₹{" "}
                        {calculateCosts().convenienceCharge.toLocaleString(
                          "en-IN",
                          { minimumFractionDigits: 2 }
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-[18px] font-bold text-gray-900">
                        Grand Total
                      </span>
                      <span className="text-[20px] font-extrabold text-[#C72030]">
                        ₹{" "}
                        {calculateCosts().grandTotal.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            {/* Request Type Section */}
            {facilityDetails?.fac_type === "request" && (
              <div className="mt-8 space-y-6 animate-in fade-in duration-500 border-t border-gray-100 pt-6">
                <div className="flex items-center gap-6">
                  <div className="flex-1 flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700 min-w-[140px]">
                      Number of Persons
                    </label>
                    <TextField
                      placeholder="Enter Number of Persons"
                      value={numOfPersons}
                      onChange={(e) => setNumOfPersons(e.target.value)}
                      fullWidth
                      sx={fieldStyles}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[14px] font-medium text-gray-700 min-w-[140px]">
                    Refundable Deposit
                  </span>
                  <span className="text-[20px] font-bold text-blue-600">
                    ₹ {facilityDetails.deposit || 0}
                  </span>
                </div>
              </div>
            )}

            {/* Payment Summary Section (Merged) */}
            {facilityDetails && (
              <div className="mt-8 space-y-8 animate-in fade-in duration-500 border-t border-gray-100 pt-8">
                <div>
                  <label className="text-[18px] font-bold text-gray-900 mb-4 block">
                    Payment Method <span className="text-[#C72030]">*</span>
                  </label>
                  <div className="space-y-4">
                    {[
                      { key: "postpaid", label: "Postpaid" },
                      { key: "prepaid", label: "Prepaid" },
                      { key: "pay_on_facility", label: "Pay on Facility" },
                      { key: "complementary", label: "Complimentary" },
                    ].map((method) => {
                      const isAvailable =
                        facilityDetails[method.key] === 1 ||
                        facilityDetails[method.key] === "true";
                      if (!isAvailable) return null;

                      return (
                        <div
                          key={method.key}
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => setPaymentMethod(method.key)}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === method.key
                              ? "border-[#C72030]"
                              : "border-gray-300 group-hover:border-gray-400"
                              }`}
                          >
                            {paymentMethod === method.key && (
                              <div className="w-2 h-2 rounded-full bg-[#C72030]" />
                            )}
                          </div>
                          <span
                            className={`text-[16px] transition-all ${paymentMethod === method.key
                              ? "text-gray-900"
                              : "text-gray-900"
                              }`}
                          >
                            {method.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-center pt-4">
          <Button type="submit">Submit</Button>
        </div>
      </form>
    </div>
  );
};

export default AddFacilityBookingPage;
