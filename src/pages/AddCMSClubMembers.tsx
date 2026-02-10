import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
    id: string;
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
}

const fieldStyles = {
    backgroundColor: "#fff",
    borderRadius: "4px",
    "& .MuiOutlinedInput-root": {
        "& fieldset": {
            borderColor: "#ddd",
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

const AddCMSClubMembers = () => {
    const navigate = useNavigate();

    const baseUrl = localStorage.getItem("baseUrl");
    const token = localStorage.getItem("token");
    const societyId = localStorage.getItem("selectedUserSociety");

    const [towers, setTowers] = useState([]);
    const [flats, setFlats] = useState([]);
    const [flatUsers, setFlatUsers] = useState([]);
    const [membershipPlans, setMembershipPlans] = useState([]);
    const [tower, setTower] = useState("");
    const [flat, setFlat] = useState("");

    // Global Date State
    const [globalStartDate, setGlobalStartDate] = useState("");
    const [globalEndDate, setGlobalEndDate] = useState("");
    const [globalMembershipPlanId, setGlobalMembershipPlanId] = useState("");
    const [globalMembershipType, setGlobalMembershipType] = useState("paid");
    const [remark, setRemark] = useState("");
    const [futureMembershipNumbers, setFutureMembershipNumbers] = useState<Record<string, string>>({});

    const [members, setMembers] = useState<MemberForm[]>([
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

    const fetchMembershipPlans = async () => {
        try {
            const response = await axios.get(
                `https://${baseUrl}/membership_plans.json`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setMembershipPlans(response.data.plans);
        } catch (error) {
            console.log(error);
        }
    };

    const fetchFlats = async () => {
        try {
            const response = await axios.get(
                `https://${baseUrl}/crm/admin/society_blocks/${tower}/flats.json?q[active_eq]=true`,
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

    const fetchUsers = async () => {
        try {
            const response = await axios.get(
                `https://${baseUrl}/crm/admin/flat_users.json?q[user_flat_society_flat_id_eq]=${flat}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setFlatUsers(response.data);
        } catch (error) {
            console.log(error);
        }
    };

    const fetchFutureMembershipNumbers = async () => {
        try {
            const response = await axios.get(
                `https://${baseUrl}/club_member_allocations/future_membership_numbers.json?society_id=${societyId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setFutureMembershipNumbers(response.data);
            return response.data;
        } catch (error) {
            console.log(error);
            toast.error("Failed to fetch membership numbers");
            return {};
        }
    };

    useEffect(() => {
        fetchTowers();
        fetchMembershipPlans();
    }, []);

    useEffect(() => {
        if (tower) {
            fetchFlats();
        }
    }, [tower]);

    useEffect(() => {
        if (flat) {
            fetchUsers();
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
        if (members.length > 1) {
            setMembers(members.filter((member) => member.id !== id));
        }
    };

    const updateMember = async (id: string, field: keyof MemberForm, value: any) => {
        // If club membership checkbox is being checked
        console.log(field, value)
        if (field === "isClubMembership" && value === true) {
            // Fetch membership numbers if not already fetched
            let membershipNumbers = futureMembershipNumbers;
            if (Object.keys(membershipNumbers).length === 0) {
                membershipNumbers = await fetchFutureMembershipNumbers();
            }

            // Find the index of the current member
            const memberIndex = members.findIndex((member) => member.id === id);
            console.log(membershipNumbers)

            // Get the membership number for this member (1-indexed in the API response)
            const membershipNumber = membershipNumbers.membership_numbers[(memberIndex + 1).toString()] || "";
            console.log(membershipNumber)

            // Update the member with both isClubMembership and membershipNumber
            setMembers(
                members.map((member) =>
                    member.id === id
                        ? { ...member, isClubMembership: value, membershipNumber }
                        : member
                )
            );
        } else if (field === "isClubMembership" && value === false) {
            // If unchecking, clear the membership number
            setMembers(
                members.map((member) =>
                    member.id === id
                        ? { ...member, isClubMembership: value, membershipNumber: "" }
                        : member
                )
            );
        } else {
            // Normal update for other fields
            setMembers(
                members.map((member) =>
                    member.id === id ? { ...member, [field]: value } : member
                )
            );
        }
    };

    console.log(members)

    const handleSubmit = async () => {
        try {
            const formData = new FormData();

            formData.append("club_member_allocation[society_id]", societyId);
            formData.append("club_member_allocation[society_flat_id]", flat);
            formData.append("club_member_allocation[status]", "active");
            formData.append(`club_member_allocation[start_date]`, globalStartDate);
            formData.append(`club_member_allocation[end_date]`, globalEndDate);
            formData.append(
                `club_member_allocation[membership_plan_id]`,
                globalMembershipPlanId
            );
            formData.append(
                `club_member_allocation[membership_type]`,
                globalMembershipType
            );
            formData.append(`club_member_allocation[remark]`, remark);
            members.forEach((member, idx) => {
                formData.append(
                    `members[${idx}][user_society_id]`,
                    member.selectedUser
                );
                formData.append(`members[${idx}][first_name]`, member.firstName);
                formData.append(`members[${idx}][last_name]`, member.lastName);
                formData.append(`members[${idx}][email]`, member.email);
                formData.append(`members[${idx}][mobile]`, member.mobile);
                formData.append(`members[${idx}][resident_type]`, member.residentType);
                formData.append(
                    `members[${idx}][club_member_check]`,
                    member.isClubMembership ? "true" : "false"
                );
                formData.append(
                    `members[${idx}][membership_number]`,
                    member.membershipNumber
                );
                formData.append(
                    `members[${idx}][access_card_check]`,
                    member.isAccessCardAllocated ? "true" : "false"
                );
                formData.append(`members[${idx}][access_card_id]`, member.accessCardId);
                formData.append(
                    `members[${idx}][identification_image_attributes][document]`,
                    member.idCard
                );
                formData.append(
                    `members[${idx}][profile_image_attributes][document]`,
                    member.residentPhoto
                );
            });

            await axios.post(
                `https://${baseUrl}/club_member_allocations.json`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            toast.success("Club members added successfully!");
            navigate(-1);
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div className="p-6 bg-white min-h-screen">
            <div className="mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <p className="text-gray-600 text-sm">Back</p>
                </button>
            </div>

            <div className="space-y-6">
                {/* Main Container */}
                <div className="space-y-6">
                    <Card>
                        <CardContent className="mt-8">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormControl required sx={fieldStyles}>
                                        <InputLabel className="bg-white px-1">Tower</InputLabel>
                                        <Select
                                            value={tower}
                                            onChange={(e) => setTower(e.target.value)}
                                            label="Tower"
                                            displayEmpty
                                        >
                                            <MenuItem value="" disabled>
                                                Select Tower
                                            </MenuItem>
                                            {towers.map((tower: any) => (
                                                <MenuItem key={tower.id} value={tower.id}>
                                                    {tower.name}
                                                </MenuItem>
                                            ))}
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
                                            <MenuItem value="" disabled>
                                                Select Flat
                                            </MenuItem>
                                            {flats.map((flat: any) => (
                                                <MenuItem key={flat.id} value={flat.id}>
                                                    {flat.flat_no}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <FormControl fullWidth sx={fieldStyles}>
                                        <InputLabel className="bg-white px-1">
                                            Membership Plan
                                        </InputLabel>
                                        <Select
                                            value={globalMembershipPlanId}
                                            onChange={(e) =>
                                                setGlobalMembershipPlanId(e.target.value)
                                            }
                                            label="Membership Plan"
                                            displayEmpty
                                        >
                                            <MenuItem value="">Select Membership Plan</MenuItem>
                                            {membershipPlans.map((plan: any) => (
                                                <MenuItem key={plan.id} value={plan.id}>
                                                    {plan.name}
                                                </MenuItem>
                                            ))}
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
                                        <InputLabel className="bg-white px-1">
                                            Membership Type
                                        </InputLabel>
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
                                    required
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

                    {/* Dynamic Member Forms */}
                    {members.map((member, index) => (
                        <Card key={member.id} className="border shadow-sm">
                            <CardContent className="pt-6">
                                {index > 0 && (
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
                                        onChange={(e) =>
                                            updateMember(
                                                member.id,
                                                "userSelectionType",
                                                e.target.value
                                            )
                                        }
                                        className="mb-4"
                                    >
                                        <FormControlLabel
                                            value="select"
                                            control={<Radio />}
                                            label="Select User"
                                            className="mr-8"
                                        />
                                        <FormControlLabel
                                            value="enter"
                                            control={<Radio />}
                                            label="Enter User Details"
                                        />
                                    </RadioGroup>

                                    {/* User Input Section */}
                                    {member.userSelectionType === "select" ? (
                                        <div className="grid grid-cols-1 gap-4">
                                            <FormControl required fullWidth sx={fieldStyles}>
                                                <InputLabel className="bg-white px-1">User</InputLabel>
                                                <Select
                                                    value={member.selectedUser}
                                                    onChange={(e) =>
                                                        updateMember(
                                                            member.id,
                                                            "selectedUser",
                                                            e.target.value
                                                        )
                                                    }
                                                    label="User"
                                                    displayEmpty
                                                >
                                                    <MenuItem value="" disabled>
                                                        Select User
                                                    </MenuItem>
                                                    {flatUsers.map((user: any) => {
                                                        const [username, id] = user;
                                                        return (
                                                            <MenuItem key={id} value={id}>
                                                                {username}
                                                            </MenuItem>
                                                        );
                                                    })}
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
                                                onChange={(e) =>
                                                    updateMember(member.id, "firstName", e.target.value)
                                                }
                                                sx={fieldStyles}
                                            />
                                            <TextField
                                                required
                                                label="Last Name"
                                                placeholder="Enter Last Name"
                                                value={member.lastName}
                                                onChange={(e) =>
                                                    updateMember(member.id, "lastName", e.target.value)
                                                }
                                                sx={fieldStyles}
                                            />
                                            <TextField
                                                label="Email"
                                                placeholder="Enter Email"
                                                value={member.email}
                                                onChange={(e) =>
                                                    updateMember(member.id, "email", e.target.value)
                                                }
                                                sx={fieldStyles}
                                            />
                                            <TextField
                                                label="Mobile"
                                                placeholder="Enter Mobile"
                                                value={member.mobile}
                                                onChange={(e) =>
                                                    updateMember(member.id, "mobile", e.target.value)
                                                }
                                                sx={fieldStyles}
                                            />
                                        </div>
                                    )}

                                    {/* Resident Type */}
                                    <div className="grid grid-cols-1 gap-4">
                                        <FormControl fullWidth sx={fieldStyles}>
                                            <InputLabel className="bg-white px-1">
                                                Resident Type
                                            </InputLabel>
                                            <Select
                                                value={member.residentType}
                                                onChange={(e) =>
                                                    updateMember(
                                                        member.id,
                                                        "residentType",
                                                        e.target.value
                                                    )
                                                }
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
                                                onCheckedChange={(checked) =>
                                                    updateMember(member.id, "isClubMembership", checked)
                                                }
                                            />
                                            <label
                                                htmlFor={`club-membership-${member.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                Club Membership
                                            </label>
                                        </div>

                                        {member.isClubMembership && (
                                            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                                                <TextField
                                                    required
                                                    label="Membership Number"
                                                    placeholder="Enter Number"
                                                    value={member.membershipNumber}
                                                    onChange={(e) =>
                                                        updateMember(
                                                            member.id,
                                                            "membershipNumber",
                                                            e.target.value
                                                        )
                                                    }
                                                    sx={fieldStyles}
                                                    InputProps={{
                                                        readOnly: true,
                                                    }}
                                                    helperText="Auto-assigned from system"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Access Card Section */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id={`access-card-${member.id}`}
                                                checked={member.isAccessCardAllocated}
                                                onCheckedChange={(checked) =>
                                                    updateMember(
                                                        member.id,
                                                        "isAccessCardAllocated",
                                                        checked
                                                    )
                                                }
                                            />
                                            <label
                                                htmlFor={`access-card-${member.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                Access Card Allocated / Face Base
                                            </label>
                                        </div>

                                        {member.isAccessCardAllocated && (
                                            <TextField
                                                label="Access Card ID"
                                                placeholder="Enter Access Card ID"
                                                value={member.accessCardId}
                                                onChange={(e) =>
                                                    updateMember(
                                                        member.id,
                                                        "accessCardId",
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full"
                                                sx={fieldStyles}
                                            />
                                        )}
                                    </div>

                                    {/* File Uploads */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* ID Card */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">
                                                ID Card
                                            </label>
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
                                                ) : (
                                                    <>
                                                        <div className="w-12 h-12 mb-2 text-gray-400">
                                                            <Upload className="w-full h-full" />
                                                        </div>
                                                        <span className="text-xl font-medium text-gray-400">
                                                            Upload
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Resident's Photo */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">
                                                Resident's Photo
                                            </label>
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer relative group">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file)
                                                            updateMember(member.id, "residentPhoto", file);
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
                                                ) : (
                                                    <>
                                                        <div className="w-12 h-12 mb-2 text-gray-400">
                                                            <Upload className="w-full h-full" />
                                                        </div>
                                                        <span className="text-xl font-medium text-gray-400">
                                                            Upload
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Action Buttons */}
                    <div className="flex justify-center gap-4 pt-4">
                        <Button
                            variant="outline"
                            className="border-green-600 text-green-600 hover:bg-green-50 min-w-[120px]"
                            onClick={addMember}
                            disabled={members.length === 8}
                        >
                            Add
                        </Button>
                        <Button
                            variant="default"
                            className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]"
                            onClick={handleSubmit}
                        >
                            Submit
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddCMSClubMembers;
