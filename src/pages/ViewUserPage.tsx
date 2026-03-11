import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Paper, Box, Avatar, Typography, Grid, Divider, Tabs, Tab } from "@mui/material";
import { ArrowLeft, User as UserIcon, Mail, Phone, Home, Calendar, Info, FileText, Edit } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddToAnotherFlatModal } from "@/components/AddToAnotherFlatModal";
import axios from "axios";
import { toast } from "sonner";

// Helper component for displaying info fields
const InfoField = ({ label, value }: { label: string; value: any }) => (
  <Box sx={{ mb: 2, pb: 1.5, borderBottom: "1px solid #f0f0f0" }}>
    <Typography variant="body2" sx={{ color: "#666", fontSize: "12px", mb: 0.5 }}>
      {label}
    </Typography>
    <Typography variant="body1" sx={{ color: "#1A1A1A", fontWeight: 500 }}>
      {value || "NA"}
    </Typography>
  </Box>
);

export const ViewUserPage = () => {
  const { id: userId } = useParams();
  const navigate = useNavigate();
  const baseUrl = localStorage.getItem("baseUrl");
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [tabValue, setTabValue] = useState(0);
  const [members, setMembers] = useState<any[]>([]);
  const [isAddToAnotherFlatModalOpen, setIsAddToAnotherFlatModalOpen] = useState(false);

  useEffect(() => {
    if (!userId || !baseUrl || !token) return;
    setLoading(true);

    axios
      .get(`https://${baseUrl}/crm/admin/user_societies/${userId}.json`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setUser(response.data);
        if (!response.data) {
          setError("User data not found in response.");
        }
      })
      .catch((err) => {
        console.error("Error fetching user details:", err);
        const errorMessage = err.response?.data?.message || "Failed to load user details.";
        setError(errorMessage);
        toast.error(errorMessage);
      })
      .finally(() => setLoading(false));
  }, [userId, baseUrl, token]);

  if (loading) {
    return (
      <Box sx={{ p: 6, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
        <Loader2 className="h-8 w-8 animate-spin" />
        <Typography sx={{ ml: 2 }}>Loading user details...</Typography>
      </Box>
    );
  }

  if (error || !user) {
    return (
      <Box sx={{ p: 6, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
        <Typography color="error">{error || "User not found."}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, background: "#f5f5f5" }}>
      {/* Back Button */}
      <button
        onClick={() => navigate("/settings/manage-users")}
        className="flex items-center gap-1 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Main Container Paper */}
      <Paper sx={{ borderRadius: 2, overflow: "hidden", boxShadow: 1 }}>
        {/* Header Section with Avatar and User Info */}
        <Box sx={{ background: "linear-gradient(135deg, #E8F4F8 0%, #F0F9FB 100%)", p: 3, position: "relative" }}>
          {/* Edit Button */}
          <Box sx={{ position: "absolute", top: 12, right: 12 }}>
            <Button
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => navigate(`/settings/manage-users/edit/${userId}`)}
            >
              <Edit className="w-3 h-3 mr-1" />
              Edit
            </Button>
          </Box>

          {/* Avatar and User Info */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 2 }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: "#fff", border: "3px solid #C72030", color: "#C72030" }}>
              <UserIcon size={40} />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#1A1A1A" }}>
                {user?.full_name || user?.firstname + " " + user?.lastname}
              </Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                Flat Number - {user?.flat_no} ({user?.phase || "-"})
              </Typography>
              <Typography variant="body2" sx={{ color: "#0097a7", mt: 0.5 }}>
                {user?.status ? "Active" : "Inactive"}
              </Typography>
            </Box>
          </Box>

          {/* Add to Another Flat Button */}
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              className="bg-teal-500 hover:bg-teal-600 text-white text-sm"
              onClick={() => setIsAddToAnotherFlatModalOpen(true)}
            >
              Add to Another Flat
            </Button>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: "1px solid #e0e0e0" }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{
              "& .MuiTab-root": {
                textTransform: "none",
                fontSize: "14px",
                fontWeight: 500,
                color: "#666",
                "&.Mui-selected": {
                  color: "#0097a7",
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#0097a7",
              },
            }}
          >
            <Tab label="User Info" />
            <Tab label="Club Info" />
          </Tabs>
        </Box>

        {/* Tab Content - User Info */}
        {
          tabValue === 0 && (
            <Box sx={{ p: 3 }}>
              {/* User Details Grid */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
                {/* Column 1 */}
                <Box>
                  <InfoField label="Mobile" value={user?.mobile_number || "NA"} />
                  <InfoField label="Alternate Email-1" value={user?.alternate_email_1 || "NA"} />
                  <InfoField label="Committee Member" value={user?.committee_member ? "Yes" : "No"} />
                  <InfoField label="Lives Here" value={user?.lives_here === "true" ? "Yes" : "No"} />
                  <InfoField label="Membership Type" value={user?.membership_type || "NA"} />
                  <InfoField label="Anniversary" value={user?.anniversary || "NA"} />
                  <InfoField label="EV Connection" value={user?.ev_connection ? "Yes" : "No"} />
                  <InfoField label="No. of Children Residing" value={user?.children || "-"} />
                  <InfoField label="Date of possession:" value={user?.date_of_possession || "-"} />
                  <InfoField label="PAN" value={user?.pan_number || "NA"} />
                  <InfoField label="Intercom Number" value={user?.intercom || "NA"} />
                  <InfoField label="Alternate Address" value={user?.alternate_address || "NA"} />
                </Box>

                {/* Column 2 */}
                <Box>
                  <InfoField label="Email" value={user?.email || "NA"} />
                  <InfoField label="Alternate Email-2" value={user?.alternate_email_2 || "NA"} />
                  <InfoField label="Designation" value={user?.designation || "NA"} />
                  <InfoField label="Allow Fihout" value={user?.allow_fihout ? "Yes" : "No"} />
                  <InfoField label="Birthday" value={user?.birthday || "NA"} />
                  <InfoField label="Spouse Birthday" value={user?.spouse_birthday || "NA"} />
                  <InfoField label="No. of Adult Family Members Residing" value={user?.adults || "-"} />
                  <InfoField label="No. of Pets:" value={user?.pets || "-"} />
                  <InfoField label="Resident Type" value={user?.resident_type || "NA"} />
                  <InfoField label="GST" value={user?.gst_number || "NA"} />
                  <InfoField label="Landline Number" value={user?.landline || "NA"} />
                  <InfoField label="Phase" value={user?.phase || "Post Possession"} />
                </Box>
              </Box>

              {/* Members List Section */}
              {members.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#0097a7" }}>
                    Members List
                  </Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr" }, gap: 1 }}>
                    {members.map((member, index) => (
                      <Box key={index} sx={{ py: 1, borderBottom: "1px solid #f0f0f0" }}>
                        <Typography variant="body2" sx={{ color: "#0097a7" }}>
                          {member.flat_no || member.phase} - {member.name}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )
        }

        {/* Tab Content - Club Info */}
        {
          tabValue === 1 && (
            <Box sx={{ p: 3 }}>
              <Typography variant="body1" sx={{ color: "#666" }}>
                Club information will be displayed here
              </Typography>
            </Box>
          )
        }
      </Paper >

      {/* Add to Another Flat Modal */}
      <AddToAnotherFlatModal
        isOpen={isAddToAnotherFlatModalOpen}
        onClose={() => setIsAddToAnotherFlatModalOpen(false)}
        userData={user}
      />
    </Box >
  );
};

export default ViewUserPage;
