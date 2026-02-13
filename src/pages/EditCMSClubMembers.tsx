
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, X, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
} from "@mui/material";
import axios from "axios";
import { toast } from "sonner";

interface MemberForm {
    id: string; // Front-end ID (timestamp) or Backend ID
    backendId?: string; // Actual ID from DB if exists
    userSelectionType: "select" | "enter";
    selectedUser: string;
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    residentType: string;
    isClubMembership: boolean;
    membershipNumber: string;
    isAccessCardAllocated: boolean;
    accessCardId: string;
    idCard: File | null;
    residentPhoto: File | null;
    // For previews
    idCardUrl?: string | null;
    residentPhotoUrl?: string | null;
    _destroy?: boolean;
}

const fieldStyles = {
    backgroundColor: '#fff',
    borderRadius: '4px',
    '& .MuiOutlinedInput-root': {
        '& fieldset': {
            borderColor: '#ddd',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#C72030',
        },
    },
    '& .MuiInputLabel-root': {
        '&.Mui-focused': {
            color: '#C72030',
        },
    },
};

const EditCMSClubMembers = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>(); // This is the Allocation ID

    const baseUrl = localStorage.getItem("baseUrl");
    const token = localStorage.getItem("token");
    const societyId = localStorage.getItem("selectedUserSociety");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [towers, setTowers] = useState([])
    const [flats, setFlats] = useState([]);
    const [flatUsers, setFlatUsers] = useState([]);
    const [membershipPlans, setMembershipPlans] = useState([]);

    // Global Config State
    const [tower, setTower] = useState("");
    const [flat, setFlat] = useState("");
    const [globalStartDate, setGlobalStartDate] = useState("");
    const [globalEndDate, setGlobalEndDate] = useState("");
    const [globalMembershipPlanId, setGlobalMembershipPlanId] = useState("");
    const [globalMembershipType, setGlobalMembershipType] = useState("paid");
    const [remark, setRemark] = useState("");

    // Cost Summary States
    const [editablePlanCost, setEditablePlanCost] = useState<string>("");
    const [discountPercentage, setDiscountPercentage] = useState<string>("0");
    const [cgstPercentage, setCgstPercentage] = useState<string>("0");
    const [sgstPercentage, setSgstPercentage] = useState<string>("0");

    const [members, setMembers] = useState<MemberForm[]>([]);

    // Get selected plan details
    const selectedPlan: any = membershipPlans.find((plan: any) => plan.id === globalMembershipPlanId);

    // Initialize editable cost if not set (e.g. no payment details in API)
    useEffect(() => {
        if (selectedPlan && !editablePlanCost) {
            setEditablePlanCost(selectedPlan.price || "0");
        }
    }, [globalMembershipPlanId, membershipPlans]);

    // Cost Summary Calculations
    const planCost = parseFloat(editablePlanCost) || 0;
    const discountAmount = (planCost * (parseFloat(discountPercentage) || 0)) / 100;
    const subtotal = planCost - discountAmount;
    const cgstAmount = (subtotal * (parseFloat(cgstPercentage) || 0)) / 100;
    const sgstAmount = (subtotal * (parseFloat(sgstPercentage) || 0)) / 100;
    const totalCost = subtotal + cgstAmount + sgstAmount;

    const fetchTowers = async () => {
        try {
            const response = await axios.get(`https://${baseUrl}/crm/admin/society_blocks.json?society_id=${societyId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setTowers(response.data.society_blocks)
        } catch (error) {
            console.log(error)
        }
    }

    const fetchMembershipPlans = async () => {
        try {
            const response = await axios.get(`https://${baseUrl}/membership_plans.json`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setMembershipPlans(response.data.plans)
        } catch (error) {
            console.log(error)
        }
    }

    const fetchFlats = async (towerId: string) => {
        if (!towerId) return;
        try {
            const response = await axios.get(`https://${baseUrl}/crm/admin/society_blocks/${towerId}/flats.json?q[active_eq]=true`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setFlats(response.data)
        } catch (error) {
            console.log(error)
        }
    }

    const fetchUsers = async (flatId: string) => {
        if (!flatId) return;
        try {
            const response = await axios.get(`https://${baseUrl}/crm/admin/flat_users.json?q[user_flat_society_flat_id_eq]=${flatId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setFlatUsers(response.data || [])
        } catch (error) {
            console.log(error)
        }
    }

    const fetchAllocationDetails = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await axios.get(`https://${baseUrl}/club_member_allocations/${id}.json`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = response.data;

            setTower(data.tower?.id?.toString() || "");
            setFlat(data.flat?.id?.toString() || "");
            setGlobalStartDate(data.start_date.split("T")[0] || "");
            setGlobalEndDate(data.end_date.split("T")[0] || "");
            setGlobalMembershipPlanId(data.membership_plan_id?.toString() || "");
            setGlobalMembershipType(data.membership_type || "paid");
            setRemark(data.remark || "");

            if (data.allocation_payment_detail) {
                const base = parseFloat(data.allocation_payment_detail.base_amount) || 0;
                setEditablePlanCost(base.toString());
                if (base > 0) {
                    const disc = parseFloat(data.allocation_payment_detail.discount) || 0;
                    setDiscountPercentage(((disc / base) * 100).toString());
                    const sub = base - disc;
                    const cgst = parseFloat(data.allocation_payment_detail.cgst) || 0;
                    const sgst = parseFloat(data.allocation_payment_detail.sgst) || 0;
                    if (sub > 0) {
                        setCgstPercentage(((cgst / sub) * 100).toString());
                        setSgstPercentage(((sgst / sub) * 100).toString());
                    }
                }
            }

            if (data.club_members && Array.isArray(data.club_members)) {
                const mappedMembers: MemberForm[] = data.club_members.map((m: any) => ({
                    id: m.id,
                    userSelectionType: m.user_society_id ? "select" : "enter",
                    selectedUser: m.user_society_id?.toString() || "",
                    firstName: m.first_name || "",
                    lastName: m.last_name || "",
                    email: m.email || "",
                    mobile: m.mobile || "",
                    residentType: m.resident_type || "Owner",
                    isClubMembership: m.club_member_enabled ?? m.club_member_check ?? false,
                    membershipNumber: m.membership_number || "",
                    isAccessCardAllocated: m.access_card_enabled ?? m.access_card_check ?? false,
                    accessCardId: m.access_card_id || "",
                    idCard: null,
                    residentPhoto: null,
                    idCardUrl: m.identification_image?.url, // API usually returns URL string or obj
                    residentPhotoUrl: m.profile_image?.url,
                }));
                setMembers(mappedMembers);
            }

        } catch (error) {
            console.error("Error fetching allocation details:", error);
            toast.error("Failed to load allocation details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTowers();
        fetchMembershipPlans();
        fetchAllocationDetails();
    }, []);

    useEffect(() => {
        if (tower) {
            fetchFlats(tower);
        } else {
            setFlats([]);
        }
    }, [tower]);

    useEffect(() => {
        if (flat) {
            fetchUsers(flat);
        } else {
            setFlatUsers([]);
        }
    }, [flat]);

    const addMember = () => {
        setMembers([
            ...members,
            {
                id: Date.now().toString(),
                userSelectionType: "select",
                selectedUser: "",
                firstName: "",
                lastName: "",
                email: "",
                mobile: "",
                residentType: "Owner",
                isClubMembership: false,
                membershipNumber: "",
                isAccessCardAllocated: false,
                accessCardId: "",
                idCard: null,
                residentPhoto: null,
            },
        ]);
    };

    const removeMember = (id: string) => {
        if (members.filter(m => !m._destroy).length > 1) {
            setMembers(members.map(member =>
                member.id === id ? { ...member, _destroy: true } : member
            ));
        } else {
            toast.warning("At least one member is required.");
        }
    };

    const updateMember = (id: string, field: keyof MemberForm, value: any) => {
        setMembers(
            members.map((member) =>
                member.id === id ? { ...member, [field]: value } : member
            )
        );
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const formData = new FormData();

            formData.append("club_member_allocation[society_id]", societyId!)
            formData.append("club_member_allocation[society_flat_id]", flat)
            formData.append(`club_member_allocation[start_date]`, globalStartDate)
            formData.append(`club_member_allocation[end_date]`, globalEndDate)
            formData.append(`club_member_allocation[membership_plan_id]`, globalMembershipPlanId)
            formData.append(`club_member_allocation[membership_type]`, globalMembershipType)
            formData.append(`club_member_allocation[remark]`, remark);

            // Add payment details from cost summary
            formData.append("club_member_allocation[allocation_payment_detail_attributes][base_amount]", editablePlanCost);
            formData.append("club_member_allocation[allocation_payment_detail_attributes][discount]", discountAmount.toString());
            formData.append("club_member_allocation[allocation_payment_detail_attributes][cgst]", cgstAmount.toString());
            formData.append("club_member_allocation[allocation_payment_detail_attributes][sgst]", sgstAmount.toString());
            formData.append("club_member_allocation[allocation_payment_detail_attributes][total_tax]", (cgstAmount + sgstAmount).toString());
            formData.append("club_member_allocation[allocation_payment_detail_attributes][total_amount]", totalCost.toString());
            formData.append("club_member_allocation[allocation_payment_detail_attributes][landed_amount]", totalCost.toString());
            // formData.append("club_member_allocation[allocation_payment_detail_attributes][payment_status]", "pending");

            members.forEach((member, idx) => {
                formData.append(`members[${idx}][id]`, member.id)

                if (member._destroy) {
                    formData.append(`members[${idx}][_destroy]`, 'true')
                    return;
                }
                formData.append(`members[${idx}][user_society_id]`, member.selectedUser)
                formData.append(`members[${idx}][first_name]`, member.firstName)
                formData.append(`members[${idx}][last_name]`, member.lastName)
                formData.append(`members[${idx}][email]`, member.email)
                formData.append(`members[${idx}][mobile]`, member.mobile)
                formData.append(`members[${idx}][resident_type]`, member.residentType)

                formData.append(`members[${idx}][club_member_check]`, member.isClubMembership ? "true" : "false")
                formData.append(`members[${idx}][membership_number]`, member.membershipNumber)

                formData.append(`members[${idx}][access_card_check]`, member.isAccessCardAllocated ? "true" : "false")
                formData.append(`members[${idx}][access_card_id]`, member.accessCardId)

                if (member.idCard) {
                    formData.append(`members[${idx}][identification_image_attributes][document]`, member.idCard)
                }
                if (member.residentPhoto) {
                    formData.append(`members[${idx}][profile_image_attributes][document]`, member.residentPhoto)
                }
            })

            // PUT request to allocation
            await axios.patch(`https://${baseUrl}/club_member_allocations/${id}.json`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                }
            })

            toast.success("Allocation updated successfully!");
            navigate(-1);
        } catch (error) {
            console.error('Error updating allocation:', error)
            toast.error("Failed to update allocation");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 bg-white min-h-screen">
            <div className="mb-4 space-y-3">
                <button
                    onClick={() => navigate(-1)}
                    className="text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <p className="text-gray-600 text-sm">Back</p>
                </button>

                <h2 className="text-lg font-semibold text-[#1a1a1a] mb-2">Edit Club Member</h2>
            </div>

            <div className="space-y-6">
                {/* Plan Selection Card */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-[#1a1a1a] mb-2">Select Membership Plan</h2>
                            {membershipPlans.length === 0 ? (
                                <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed">
                                    <p className="text-gray-500 text-sm">No membership plans available.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {membershipPlans.map((plan: any) => (
                                        <div
                                            key={plan.id}
                                            onClick={() => {
                                                setGlobalMembershipPlanId(plan.id);
                                                setEditablePlanCost(plan.price || "0");
                                            }}
                                            className={`border-2 rounded-lg p-4 cursor-pointer transition-all relative ${globalMembershipPlanId === plan.id || globalMembershipPlanId === plan.id.toString()
                                                ? 'border-[#C72030] bg-red-50'
                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{plan.name}</h4>
                                                    <p className="text-xs text-gray-500 mt-1 capitalize">
                                                        {plan.renewal_terms} Membership
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-bold text-[#C72030]">₹{plan.price}</p>
                                                    <p className="text-[10px] text-gray-400 capitalize">per {plan.renewal_terms}</p>
                                                </div>
                                            </div>

                                            {plan.plan_amenities && plan.plan_amenities.length > 0 && (
                                                <div className="mt-2 pt-2 border-t border-gray-100">
                                                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                                                        {plan.plan_amenities.slice(0, 3).map((amenity: any) => (
                                                            <div key={amenity.id} className="flex items-center gap-1">
                                                                <div className="w-1 h-1 rounded-full bg-green-500"></div>
                                                                <span className="text-[11px] text-gray-600">
                                                                    {amenity.facility_setup_name || amenity.facility_setup?.name || 'Amenity'}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {plan.plan_amenities.length > 3 && (
                                                            <span className="text-[11px] text-gray-400">+{plan.plan_amenities.length - 3} more</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-[#1a1a1a]">Membership Info</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormControl required sx={fieldStyles}>
                                    <InputLabel className="bg-white px-1">Tower</InputLabel>
                                    <Select
                                        value={tower}
                                        onChange={(e) => setTower(e.target.value)}
                                        label="Tower"
                                        displayEmpty
                                    >
                                        <MenuItem value="" disabled>Select Tower</MenuItem>
                                        {
                                            towers.map((tower: any) => (
                                                <MenuItem key={tower.id} value={tower.id}>{tower.name}</MenuItem>
                                            ))
                                        }
                                    </Select>
                                </FormControl>
                                <FormControl required sx={fieldStyles}>
                                    <InputLabel className="bg-white px-1">Flat</InputLabel>
                                    <Select
                                        value={flat}
                                        onChange={(e) => setFlat(e.target.value)}
                                        label="Flat"
                                        displayEmpty
                                    >
                                        <MenuItem value="" disabled>Select Flat</MenuItem>
                                        {
                                            flats.map((flat: any) => (
                                                <MenuItem key={flat.id} value={flat.id}>{flat.flat_no}</MenuItem>
                                            ))
                                        }
                                    </Select>
                                </FormControl>
                                <TextField
                                    required
                                    type="date"
                                    label="Start Date (Applies to all)"
                                    value={globalStartDate}
                                    onChange={(e) => setGlobalStartDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={fieldStyles}
                                />
                                <TextField
                                    required
                                    type="date"
                                    label="End Date (Applies to all)"
                                    value={globalEndDate}
                                    onChange={(e) => setGlobalEndDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={fieldStyles}
                                />
                                <FormControl fullWidth sx={fieldStyles}>
                                    <InputLabel className="bg-white px-1">Membership Type</InputLabel>
                                    <Select
                                        value={globalMembershipType}
                                        onChange={(e) => setGlobalMembershipType(e.target.value)}
                                        label="Membership Type"
                                    >
                                        <MenuItem value="paid">Paid</MenuItem>
                                        <MenuItem value="free">Free</MenuItem>
                                    </Select>
                                </FormControl>
                            </div>
                            <TextField
                                label="Remark"
                                placeholder="Enter Remark"
                                value={remark}
                                onChange={(e) => setRemark(e.target.value)}
                                sx={fieldStyles}
                                fullWidth
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Cost Summary Card */}
                {globalMembershipPlanId && (
                    <Card className="bg-gray-50 border-gray-200">
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-[#1a1a1a]">Cost Summary</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Left Column: Inputs */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <label className="text-sm font-medium text-gray-700 w-32">Plan Cost (₹):</label>
                                            <TextField
                                                value={editablePlanCost}
                                                onChange={(e) => setEditablePlanCost(e.target.value)}
                                                type="number"
                                                size="small"
                                                sx={{ ...fieldStyles, flex: 1 }}
                                            />
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <label className="text-sm font-medium text-gray-700 w-32">Discount (%):</label>
                                            <div className="flex items-center gap-2 flex-1">
                                                <TextField
                                                    value={discountPercentage}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === "" || (parseFloat(val) >= 0 && parseFloat(val) <= 100)) {
                                                            setDiscountPercentage(val);
                                                        }
                                                    }}
                                                    type="number"
                                                    size="small"
                                                    sx={{ ...fieldStyles, width: '100px' }}
                                                />
                                                <span className="text-xs text-gray-500">
                                                    Amount: ₹{discountAmount.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <label className="text-sm font-medium text-gray-700 w-32">CGST (%):</label>
                                            <div className="flex items-center gap-2 flex-1">
                                                <TextField
                                                    value={cgstPercentage}
                                                    onChange={(e) => setCgstPercentage(e.target.value)}
                                                    type="number"
                                                    size="small"
                                                    sx={{ ...fieldStyles, width: '100px' }}
                                                />
                                                <span className="text-xs text-gray-500">
                                                    Amount: ₹{cgstAmount.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <label className="text-sm font-medium text-gray-700 w-32">SGST (%):</label>
                                            <div className="flex items-center gap-2 flex-1">
                                                <TextField
                                                    value={sgstPercentage}
                                                    onChange={(e) => setSgstPercentage(e.target.value)}
                                                    type="number"
                                                    size="small"
                                                    sx={{ ...fieldStyles, width: '100px' }}
                                                />
                                                <span className="text-xs text-gray-500">
                                                    Amount: ₹{sgstAmount.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Calculations */}
                                    <div className="bg-white p-4 rounded-md border border-gray-200 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Plan Base Cost:</span>
                                            <span className="font-medium">₹{planCost.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-red-600">
                                            <span>Discount:</span>
                                            <span>-₹{discountAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="border-t pt-2 flex justify-between text-sm font-semibold">
                                            <span>Subtotal:</span>
                                            <span>₹{subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Total Tax (CGST + SGST):</span>
                                            <span className="font-medium">₹{(cgstAmount + sgstAmount).toFixed(2)}</span>
                                        </div>
                                        <div className="border-t-2 border-double pt-2 flex justify-between items-center mt-2">
                                            <span className="text-base font-bold text-gray-900">Total Amount:</span>
                                            <span className="text-xl font-bold text-[#C72030]">₹{totalCost.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}


                {/* Dynamic Member Forms */}
                {members.map((member, index) => {
                    if (member._destroy) return null;
                    return (
                        <Card key={member.id} className="border shadow-sm">
                            <CardContent className="pt-6">
                                {index >= 0 && (
                                    <div className="flex justify-end mb-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeMember(member.id)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <X className="w-4 h-4 mr-1" /> Remove Member
                                        </Button>
                                    </div>
                                )}

                                <div className="space-y-6">
                                    {/* User Selection Radio */}
                                    <RadioGroup
                                        row
                                        value={member.userSelectionType}
                                        onChange={(e) => updateMember(member.id, "userSelectionType", e.target.value)}
                                        className="mb-4"
                                    >
                                        <FormControlLabel value="select" control={<Radio />} label="Select User" className="mr-8" />
                                        <FormControlLabel value="enter" control={<Radio />} label="Enter User Details" />
                                    </RadioGroup>

                                    {/* User Input Section */}
                                    {member.userSelectionType === "select" ? (
                                        <div className="grid grid-cols-1 gap-4">
                                            <FormControl required fullWidth sx={fieldStyles}>
                                                <InputLabel className="bg-white px-1">User</InputLabel>
                                                <Select
                                                    value={member.selectedUser}
                                                    onChange={(e) => updateMember(member.id, "selectedUser", e.target.value)}
                                                    label="User"
                                                    displayEmpty
                                                >
                                                    <MenuItem value="" disabled>Select User</MenuItem>
                                                    {
                                                        (flatUsers || []).map((user: any) => {
                                                            const [username, id] = user;
                                                            return (
                                                                <MenuItem key={id} value={id}>
                                                                    {username}
                                                                </MenuItem>
                                                            )
                                                        })
                                                    }
                                                </Select>
                                            </FormControl>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <TextField
                                                required
                                                label="First Name"
                                                placeholder="Enter First Name"
                                                value={member.firstName}
                                                onChange={(e) => updateMember(member.id, "firstName", e.target.value)}
                                                sx={fieldStyles}
                                            />
                                            <TextField
                                                required
                                                label="Last Name"
                                                placeholder="Enter Last Name"
                                                value={member.lastName}
                                                onChange={(e) => updateMember(member.id, "lastName", e.target.value)}
                                                sx={fieldStyles}
                                            />
                                            <TextField
                                                label="Email"
                                                placeholder="Enter Email"
                                                value={member.email}
                                                onChange={(e) => updateMember(member.id, "email", e.target.value)}
                                                sx={fieldStyles}
                                            />
                                            <TextField
                                                label="Mobile"
                                                placeholder="Enter Mobile"
                                                value={member.mobile}
                                                onChange={(e) => updateMember(member.id, "mobile", e.target.value)}
                                                sx={fieldStyles}
                                            />
                                        </div>
                                    )}

                                    {/* Resident Type */}
                                    <div className="grid grid-cols-1 gap-4">
                                        <FormControl fullWidth sx={fieldStyles}>
                                            <InputLabel className="bg-white px-1">Resident Type</InputLabel>
                                            <Select
                                                value={member.residentType}
                                                onChange={(e) => updateMember(member.id, "residentType", e.target.value)}
                                                label="Resident Type"
                                            >
                                                <MenuItem value="Owner">Owner</MenuItem>
                                                <MenuItem value="Tenant">Tenant</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </div>

                                    {/* Club Membership Section */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id={`club-membership-${member.id}`}
                                                checked={member.isClubMembership}
                                                onCheckedChange={(checked) => updateMember(member.id, "isClubMembership", checked)}
                                            />
                                            <label
                                                htmlFor={`club-membership-${member.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                Club Membership
                                            </label>
                                        </div>

                                        {
                                            member.isClubMembership && (
                                                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                                                    <TextField
                                                        required
                                                        label="Membership Number"
                                                        placeholder="Enter Number"
                                                        value={member.membershipNumber}
                                                        onChange={(e) => updateMember(member.id, "membershipNumber", e.target.value)}
                                                        sx={fieldStyles}
                                                    />
                                                </div>
                                            )
                                        }
                                    </div>

                                    {/* Access Card Section */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id={`access-card-${member.id}`}
                                                checked={member.isAccessCardAllocated}
                                                onCheckedChange={(checked) => updateMember(member.id, "isAccessCardAllocated", checked)}
                                            />
                                            <label
                                                htmlFor={`access-card-${member.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                Access Card Allocated / Face Base
                                            </label>
                                        </div>

                                        {
                                            member.isAccessCardAllocated && (
                                                <TextField
                                                    label="Access Card ID"
                                                    placeholder="Enter Access Card ID"
                                                    value={member.accessCardId}
                                                    onChange={(e) => updateMember(member.id, "accessCardId", e.target.value)}
                                                    className="w-full"
                                                    sx={fieldStyles}
                                                />
                                            )
                                        }
                                    </div>

                                    {/* File Uploads */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* ID Card */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">ID Card</label>
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer relative group">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) updateMember(member.id, "idCard", file);
                                                    }}
                                                />
                                                {member.idCard ? (
                                                    <div className="w-full h-48 flex items-center justify-center">
                                                        <img
                                                            src={URL.createObjectURL(member.idCard)}
                                                            alt="ID Card Preview"
                                                            className="max-w-full max-h-full object-contain rounded"
                                                        />
                                                    </div>
                                                ) : member.idCardUrl ? (
                                                    <div className="w-full h-48 flex items-center justify-center">
                                                        <img
                                                            src={member.idCardUrl}
                                                            alt="ID Card Preview"
                                                            className="max-w-full max-h-full object-contain rounded"
                                                        />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="w-12 h-12 mb-2 text-gray-400">
                                                            <Upload className="w-full h-full" />
                                                        </div>
                                                        <span className="text-xl font-medium text-gray-400">Upload</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Resident's Photo */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Resident's Photo</label>
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer relative group">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) updateMember(member.id, "residentPhoto", file);
                                                    }}
                                                />
                                                {member.residentPhoto ? (
                                                    <div className="w-full h-48 flex items-center justify-center">
                                                        <img
                                                            src={URL.createObjectURL(member.residentPhoto)}
                                                            alt="Resident Photo Preview"
                                                            className="max-w-full max-h-full object-contain rounded"
                                                        />
                                                    </div>
                                                ) : (member.residentPhotoUrl && !member.residentPhotoUrl.includes('profile.png')) ? (
                                                    <div className="w-full h-48 flex items-center justify-center">
                                                        <img
                                                            src={member.residentPhotoUrl}
                                                            alt="Resident Photo Preview"
                                                            className="max-w-full max-h-full object-contain rounded"
                                                        />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="w-12 h-12 mb-2 text-gray-400">
                                                            <Upload className="w-full h-full" />
                                                        </div>
                                                        <span className="text-xl font-medium text-gray-400">Upload</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </CardContent>
                        </Card>
                    )
                })}

                {/* Action Buttons */}
                <div className="flex justify-center gap-4 pt-4">
                    <Button
                        variant="outline"
                        className="border-green-600 text-green-600 hover:bg-green-50 min-w-[120px]"
                        onClick={addMember}
                        disabled={members.filter(m => !m._destroy).length === 8}
                    >
                        Add Member
                    </Button>
                    <Button
                        variant="default"
                        className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]"
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? "Updating..." : "Update"}
                    </Button>
                </div>

            </div>
        </div>
    );
};

export default EditCMSClubMembers;