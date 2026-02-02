import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
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
    id: string; // This is the ID of the record being edited
    userSelectionType: "select" | "enter";
    selectedUser: string;
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    residentType: string;
    isClubMembership: boolean;
    membershipNumber: string;
    startDate: string;
    endDate: string;
    isAccessCardAllocated: boolean;
    accessCardId: string;
    idCard: File | null;
    residentPhoto: File | null;
    // For previewing existing images
    idCardUrl?: string | null;
    residentPhotoUrl?: string | null;
}

const EditCMSClubMembers = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const baseUrl = localStorage.getItem("baseUrl");
    const token = localStorage.getItem("token");
    const societyId = localStorage.getItem("selectedUserSociety");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Tower and Flat state
    const [towers, setTowers] = useState([]);
    const [flats, setFlats] = useState([]);
    const [flatUsers, setFlatUsers] = useState([]);
    const [tower, setTower] = useState("");
    const [flat, setFlat] = useState("");

    const [member, setMember] = useState<MemberForm>({
        id: "",
        userSelectionType: "select", // Default to enter for edit
        selectedUser: "",
        firstName: "",
        lastName: "",
        email: "",
        mobile: "",
        residentType: "Owner",
        isClubMembership: false,
        membershipNumber: "",
        startDate: "",
        endDate: "",
        isAccessCardAllocated: false,
        accessCardId: "",
        idCard: null,
        residentPhoto: null,
    });

    // Fetch Towers
    const fetchTowers = async () => {
        try {
            const response = await axios.get(`https://${baseUrl}/crm/admin/society_blocks.json?society_id=${societyId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTowers(response.data.society_blocks);
        } catch (error) {
            console.error("Error fetching towers:", error);
        }
    };

    // Fetch Flats (dependent on Tower)
    const fetchFlats = async (towerId: string) => {
        if (!towerId) return;
        try {
            const response = await axios.get(`https://${baseUrl}/crm/admin/society_blocks/${towerId}/flats.json?q[active_eq]=true`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFlats(response.data);
        } catch (error) {
            console.error("Error fetching flats:", error);
        }
    };

    // Fetch Users (dependent on Flat)
    const fetchUsers = async (flatId: string) => {
        if (!flatId) return;
        try {
            const response = await axios.get(`https://${baseUrl}/crm/admin/flat_users.json?q[user_flat_society_flat_id_eq]=${flatId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFlatUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    // Fetch Member Details
    const fetchMemberDetails = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await axios.get(`https://${baseUrl}/crm/admin/club_members/${id}.json`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = response.data;

            setTower(data.tower.id)
            setFlat(data.flat.id)

            setMember(prev => ({
                ...prev,
                id: data.id,
                userSelectionType: data.user_society_id ? "select" : "enter",
                selectedUser: data.user_society_id,
                firstName: data.first_name || "",
                lastName: data.last_name || "",
                email: data.email || "",
                mobile: data.mobile || "",

                residentType: data.resident_type || "Owner",

                isClubMembership: data.club_member_enabled ?? data.club_member_check ?? false,
                membershipNumber: data.membership_number || "",
                startDate: data.start_date || "",
                endDate: data.end_date || "",

                isAccessCardAllocated: data.access_card_enabled ?? data.access_card_check ?? false,
                accessCardId: data.access_card_id || "",

                idCard: null,
                residentPhoto: null,

                idCardUrl: data.identification_image.url,
                residentPhotoUrl: data.profile_image.url,
            }));

        } catch (error) {
            console.error("Error fetching member details:", error);
            toast.error("Failed to load member details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTowers();
        fetchMemberDetails();
    }, []);

    // Effect to handle Tower selection -> Fetch Flats
    useEffect(() => {
        if (tower) {
            fetchFlats(tower);
        } else {
            setFlats([]);
        }
    }, [tower]);

    // Effect to handle Flat selection -> Fetch Users
    useEffect(() => {
        if (flat) {
            fetchUsers(flat);
        } else {
            setFlatUsers([]);
        }
    }, [flat]);

    const updateMemberField = (field: keyof MemberForm, value: any) => {
        setMember(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const formData = new FormData();

            // Edit payload typically uses nested attributes under the resource key (club_member)
            formData.append("club_member[society_id]", societyId)
            formData.append("club_member[society_flat_id]", flat)
            formData.append(`club_member[user_society_id]`, member.selectedUser)
            if (!member.selectedUser) {
                formData.append("club_member[first_name]", member.firstName);
                formData.append("club_member[last_name]", member.lastName);
                formData.append("club_member[email]", member.email);
                formData.append("club_member[mobile]", member.mobile);
            }
            formData.append("club_member[resident_type]", member.residentType);
            formData.append("club_member[club_member_check]", member.isClubMembership ? "true" : "false");
            formData.append("club_member[club_member_enabled]", member.isClubMembership ? "true" : "false");

            formData.append("club_member[membership_number]", member.membershipNumber);
            formData.append("club_member[start_date]", member.startDate);
            formData.append("club_member[end_date]", member.endDate);

            formData.append("club_member[access_card_check]", member.isAccessCardAllocated ? "true" : "false");
            formData.append("club_member[access_card_enabled]", member.isAccessCardAllocated ? "true" : "false");

            formData.append("club_member[access_card_id]", member.accessCardId);

            if (member.idCard) {
                formData.append("club_member[identification_image_attributes][document]", member.idCard);
            }
            if (member.residentPhoto) {
                formData.append("club_member[profile_image_attributes][document]", member.residentPhoto);
            }

            await axios.put(`https://${baseUrl}/crm/admin/club_members/${id}.json`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                }
            });

            toast.success("Club member updated successfully!");
            navigate(-1);
        } catch (error) {
            console.error("Error updating member:", error);
            toast.error("Failed to update member");
        } finally {
            setSubmitting(false);
        }
    };

    // const getPreviewUrl = (file: File | null, existingUrl?: string | null) => {
    //     if (file) return URL.createObjectURL(file);
    //     if (existingUrl) {
    //         if (existingUrl.startsWith('%2F') || existingUrl.startsWith('/')) {
    //             const cleanPath = existingUrl.startsWith('%2F') ? decodeURIComponent(existingUrl) : existingUrl;
    //             return `https://${baseUrl}${cleanPath}`;
    //         }
    //         return existingUrl;
    //     }
    //     return null;
    // };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

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
                {/* Main Container - Same structure as Add page */}
                <div className="bg-white rounded-lg space-y-6">
                    <h2 className="text-2xl font-semibold px-1">Edit Club Members</h2>

                    {/* Header / Tower & Flat Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <FormControl required>
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

                        <FormControl required>
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
                    </div>

                    {/* Member Form - Single Card */}
                    <Card className="border shadow-sm">
                        <CardContent className="pt-6">
                            <div className="space-y-6">
                                {/* User Selection Radio - Kept for UI consistency, but defaulting to 'enter' logic mostly */}
                                <RadioGroup
                                    row
                                    value={member.userSelectionType}
                                    onChange={(e) => updateMemberField("userSelectionType", e.target.value as any)}
                                    className="mb-4"
                                >
                                    <FormControlLabel value="select" control={<Radio />} label="Select User" className="mr-8" />
                                    <FormControlLabel value="enter" control={<Radio />} label="Enter User Details" />
                                </RadioGroup>

                                {/* User Input Section */}
                                {member.userSelectionType === "select" ? (
                                    <div className="grid grid-cols-1 gap-4">
                                        <FormControl required fullWidth>
                                            <InputLabel className="bg-white px-1">User</InputLabel>
                                            <Select
                                                value={member.selectedUser}
                                                onChange={(e) => updateMemberField("selectedUser", e.target.value)}
                                                label="User"
                                                displayEmpty
                                            >
                                                <MenuItem value="" disabled>Select User</MenuItem>
                                                {
                                                    flatUsers.map((user: any) => {
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
                                            onChange={(e) => updateMemberField("firstName", e.target.value)}
                                        />
                                        <TextField
                                            required
                                            label="Last Name"
                                            placeholder="Enter Last Name"
                                            value={member.lastName}
                                            onChange={(e) => updateMemberField("lastName", e.target.value)}
                                        />
                                        <TextField
                                            label="Email"
                                            placeholder="Enter Email"
                                            value={member.email}
                                            onChange={(e) => updateMemberField("email", e.target.value)}
                                        />
                                        <TextField
                                            label="Mobile"
                                            placeholder="Enter Mobile"
                                            value={member.mobile}
                                            onChange={(e) => updateMemberField("mobile", e.target.value)}
                                        />
                                    </div>
                                )}

                                {/* Resident Type */}
                                <div className="grid grid-cols-1 gap-4">
                                    <FormControl fullWidth>
                                        <InputLabel className="bg-white px-1">Resident Type</InputLabel>
                                        <Select
                                            value={member.residentType}
                                            onChange={(e) => updateMemberField("residentType", e.target.value)}
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
                                            id="club-membership"
                                            checked={member.isClubMembership}
                                            onCheckedChange={(checked) => updateMemberField("isClubMembership", checked)}
                                        />
                                        <label
                                            htmlFor="club-membership"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Club Membership
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <TextField
                                            required
                                            label="Membership Number"
                                            placeholder="Enter Number"
                                            value={member.membershipNumber}
                                            onChange={(e) => updateMemberField("membershipNumber", e.target.value)}
                                        />
                                        <TextField
                                            required
                                            type="date"
                                            label="Start Date"
                                            value={member.startDate}
                                            onChange={(e) => updateMemberField("startDate", e.target.value)}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                        <TextField
                                            required
                                            type="date"
                                            label="End Date"
                                            value={member.endDate}
                                            onChange={(e) => updateMemberField("endDate", e.target.value)}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </div>
                                </div>

                                {/* Access Card Section */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="access-card"
                                            checked={member.isAccessCardAllocated}
                                            onCheckedChange={(checked) => updateMemberField("isAccessCardAllocated", checked)}
                                        />
                                        <label
                                            htmlFor="access-card"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Access Card Allocated
                                        </label>
                                    </div>

                                    <TextField
                                        label="Access Card ID"
                                        placeholder="Enter Access Card ID"
                                        value={member.accessCardId}
                                        onChange={(e) => updateMemberField("accessCardId", e.target.value)}
                                        className="w-full"
                                    />
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
                                                    if (file) updateMemberField("idCard", file);
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
                                                    if (file) updateMemberField("residentPhoto", file);
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
                                            ) : member.residentPhotoUrl ? (
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

                    {/* Action Buttons */}
                    <div className="flex justify-center gap-4 pt-4">
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
        </div>
    );
};

export default EditCMSClubMembers;