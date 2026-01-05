import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Paper, Box, Avatar, Typography, Grid, Divider } from "@mui/material";
import { ArrowLeft, User as UserIcon, Mail, Phone, Home, Calendar, Info, FileText } from "lucide-react";
import { Loader2 } from "lucide-react";
import { API_CONFIG } from "@/config/apiConfig";

const API_TOKEN = "bfa5004e7b0175622be8f7e69b37d01290b737f82e078414";
const USER_API = (id: string) => `${API_CONFIG.BASE_URL}/crm/admin/user_societies/${id}.json?token=${API_TOKEN}`;

export const ViewUserPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(USER_API(userId), { method: "GET" })
      .then(res => res.json())
      .then(data => setUser(data?.data || null))
      .catch(() => setError("Failed to load user details."))
      .finally(() => setLoading(false));
  }, [userId]);

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
    <Box sx={{ p: { xs: 2, md: 6 }, minHeight: "100vh", background: "#fafafa" }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <button
          onClick={() => navigate("/setup/manage-users")}
          className="flex items-center gap-1 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </button>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#1A1A1A" }}>
          User Details
        </Typography>
      </Box>

      {/* Main Card */}
      <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, boxShadow: 2, mb: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={3} sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Avatar sx={{ width: 96, height: 96, bgcolor: "#fff", border: "2px solid #C72030", color: "#C72030", mb: 2 }}>
              <UserIcon size={48} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {user.firstname} {user.lastname}
            </Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              {user.user_title}
            </Typography>
            <Typography variant="body2" sx={{ color: "#666", mt: 1 }}>
              {user.status ? "Active" : "Inactive"}
            </Typography>
          </Grid>
          <Grid item xs={12} md={9}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "#C72030", mb: 1 }}>
                    <Mail size={16} style={{ verticalAlign: "middle", marginRight: 4 }} />
                    Email
                  </Typography>
                  <Typography variant="body1">{user.email}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "#C72030", mb: 1 }}>
                    <Phone size={16} style={{ verticalAlign: "middle", marginRight: 4 }} />
                    Mobile
                  </Typography>
                  <Typography variant="body1">{user.number} ({user.country_code})</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "#C72030", mb: 1 }}>
                    <Home size={16} style={{ verticalAlign: "middle", marginRight: 4 }} />
                    Flat
                  </Typography>
                  <Typography variant="body1">{user.flat}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "#C72030", mb: 1 }}>
                    Resident Type
                  </Typography>
                  <Typography variant="body1">{user.ownership}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "#C72030", mb: 1 }}>
                    Membership Type
                  </Typography>
                  <Typography variant="body1">{user.is_primary === 1 ? "Primary" : "Secondary"}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "#C72030", mb: 1 }}>
                    <Calendar size={16} style={{ verticalAlign: "middle", marginRight: 4 }} />
                    Birth Date
                  </Typography>
                  <Typography variant="body1">{user.birthday}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "#C72030", mb: 1 }}>
                    Anniversary
                  </Typography>
                  <Typography variant="body1">{user.anniversary}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "#C72030", mb: 1 }}>
                    Spouse Birth Date
                  </Typography>
                  <Typography variant="body1">{user.spouse_birthday}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "#C72030", mb: 1 }}>
                    PAN Number
                  </Typography>
                  <Typography variant="body1">{user.pan_number}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "#C72030", mb: 1 }}>
                    GST Number
                  </Typography>
                  <Typography variant="body1">{user.gst_number}</Typography>
                </Box>
              </Grid>
            </Grid>
            <Divider sx={{ my: 3 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "#C72030", mb: 1 }}>
                    Alternate Email 1
                  </Typography>
                  <Typography variant="body1">{user.alternate_email1}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "#C72030", mb: 1 }}>
                    Alternate Email 2
                  </Typography>
                  <Typography variant="body1">{user.alternate_email2}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "#C72030", mb: 1 }}>
                    Alternate Address
                  </Typography>
                  <Typography variant="body1">{user.alternate_address}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "#C72030", mb: 1 }}>
                    Landline Number
                  </Typography>
                  <Typography variant="body1">{user.landline}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "#C72030", mb: 1 }}>
                    Intercom Number
                  </Typography>
                  <Typography variant="body1">{user.intercom}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "#C72030", mb: 1 }}>
                    EV Connection
                  </Typography>
                  <Typography variant="body1">{user.ev_connection ? "Yes" : "No"}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "#C72030", mb: 1 }}>
                    No. of Adults
                  </Typography>
                  <Typography variant="body1">{user.adults}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "#C72030", mb: 1 }}>
                    No. of Children
                  </Typography>
                  <Typography variant="body1">{user.children}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "#C72030", mb: 1 }}>
                    No. of Pets
                  </Typography>
                  <Typography variant="body1">{user.pets}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "#C72030", mb: 1 }}>
                    Differently Abled
                  </Typography>
                  <Typography variant="body1">{user.differently_abled ? "Yes" : "No"}</Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
      {/* Additional Info Card */}
      <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, boxShadow: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          <Info size={20} style={{ verticalAlign: "middle", marginRight: 8 }} />
          Additional Info
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: "#C72030", mb: 1 }}>
                Company Name
              </Typography>
              <Typography variant="body1">{user.company_name}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: "#C72030", mb: 1 }}>
                Agreement Start Date
              </Typography>
              <Typography variant="body1">{user.agreement_start_date}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: "#C72030", mb: 1 }}>
                Agreement Expire Date
              </Typography>
              <Typography variant="body1">{user.agreement_expire_date}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: "#C72030", mb: 1 }}>
                Name on Bill
              </Typography>
              <Typography variant="body1">{user.name_on_bill}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: "#C72030", mb: 1 }}>
                User Category
              </Typography>
              <Typography variant="body1">{user.user_category_id === 3 ? "Resident" : user.user_category_id === 2 ? "Staff" : "Vendor"}</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ViewUserPage;
