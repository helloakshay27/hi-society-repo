import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Paper, Box, Avatar, Typography, Grid, Divider, Tabs, Tab } from "@mui/material";
import { ArrowLeft, User as UserIcon, Mail, Phone, Home, Calendar, Info, FileText, Edit, Download, File, FileJson, Image, FileCode, Users, Files } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddToAnotherFlatModal } from "@/components/AddToAnotherFlatModal";
import axios from "axios";
import { toast } from "sonner";

// Helper component for displaying info fields
const InfoField = ({ label, value }: { label: string; value: any }) => (
  <Box sx={{ mb: 1.5 }}>
    <Typography variant="body2" sx={{ color: "#888", fontSize: "11px", mb: 0.3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ color: "#1A1A1A", fontWeight: 500, fontSize: "13px" }}>
      {value || "-"}
    </Typography>
  </Box>
);

// Helper function to decode profile picture URL
const getProfilePictureUrl = (profileUrl: string | undefined): string | null => {
  if (!profileUrl) return null;
  try {
    // Decode URL if it's encoded
    return decodeURIComponent(profileUrl);
  } catch (error) {
    console.error("Error decoding profile URL:", error);
    return profileUrl;
  }
};

// Helper function to detect file type from URL
const getFileType = (url: string): string => {
  const lowercaseUrl = url.toLowerCase();
  if (lowercaseUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) return "image";
  if (lowercaseUrl.match(/\.pdf$/i)) return "pdf";
  if (lowercaseUrl.match(/\.(doc|docx)$/i)) return "doc";
  if (lowercaseUrl.match(/\.(xls|xlsx|csv)$/i)) return "sheet";
  return "file";
};

// Helper function to get file icon based on type
const getFileIcon = (fileType: string, size: number = 24) => {
  const sizeClass = `w-${size} h-${size}`;
  switch (fileType) {
    case "image":
      return <Image className="w-10 h-10 text-green-500" />;
    case "pdf":
      return <FileText className="w-10 h-10 text-red-500" />;
    case "doc":
      return <FileCode className="w-10 h-10" style={{ color: "#C72030" }} />;
    case "sheet":
      return <FileJson className="w-10 h-10 text-orange-500" />;
    default:
      return <File className="w-10 h-10 text-gray-500" />;
  }
};

// Helper function to get filename from URL
const getFilenameFromUrl = (url: string): string => {
  const urlParts = url.split("/");
  const filename = urlParts[urlParts.length - 1];
  // Remove query parameters if any
  return filename?.split("?")[0] || "Attachment";
};

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
        // Extract other_members from the response
        if (response.data?.other_members && Array.isArray(response.data.other_members)) {
          setMembers(response.data.other_members);
        }
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


  const handleDownloadDocument = async (documentUrl: string, index: number) => {
    if (!documentUrl) {
      toast.error("Document URL not available.");
      return;
    }

    try {
      const filename = getFilenameFromUrl(documentUrl);

      // Fetch the document
      const response = await axios.get(documentUrl, {
        responseType: "blob",
        timeout: 10000,
      });

      // Create blob and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Document downloaded successfully.");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document. Please try again.");
    }
  };

  const handleOpenDocument = (documentUrl: string) => {
    if (!documentUrl) {
      toast.error("Document URL not available.");
      return;
    }
    window.open(documentUrl, "_blank");
  };

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
        <Box sx={{ background: "linear-gradient(135deg, #C72030 0%, #A01A24 100%)", p: 4, position: "relative" }}>
          {/* Edit Button */}
          <Box sx={{ position: "absolute", top: 16, right: 16 }}>
            <Button
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white shadow-md"
              onClick={() => navigate(`/settings/manage-users/edit/${userId}`)}
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit User
            </Button>
          </Box>

          {/* Avatar and User Info */}
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3 }}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                bgcolor: "#E7E3D9",
                border: "4px solid #fff",
                color: "#C72030",
                fontSize: "36px",
                fontWeight: 700,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden"
              }}
              onError={(e: any) => {
                e.target.style.display = "none";
              }}
            >
              {getProfilePictureUrl(user?.profile_picture) ? (
                <img
                  src={getProfilePictureUrl(user?.profile_picture) || ""}
                  alt="profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : null}
              {!getProfilePictureUrl(user?.profile_picture) && (
                <Box sx={{ textAlign: "center" }}>
                  <UserIcon size={50} />
                </Box>
              )}
            </Avatar>
            <Box sx={{ flex: 1, color: "white" }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {user?.full_name || (user?.firstname && user?.lastname ? `${user.firstname} ${user.lastname}` : "User")}
              </Typography>
              <Box sx={{ display: "flex", gap: 3, mb: 1.5, flexWrap: "wrap" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Home className="w-4 h-4" />
                  <Typography variant="body2">
                    {user?.flat_no ? `${user.flat_no}, ${user?.block_no || ""}` : "No Flat"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Calendar className="w-4 h-4" />
                  <Typography variant="body2">
                    {user?.phase || "Post Possession"}
                  </Typography>
                </Box>
              </Box>
              {/* Status Badge */}
              <Box sx={{ display: "inline-block" }}>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    px: 2,
                    py: 0.75,
                    borderRadius: "20px",
                    backgroundColor: user?.approved ? "#10b981" : user?.approved === false ? "#ef4444" : "#f59e0b",
                    color: "white",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.4)" }} />
                  {user?.approved ? "Approved" : user?.approved === false ? "Rejected" : "Pending"}
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Add to Another Flat Button */}
          <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 3 }}>
            <Button
              className="bg-white hover:bg-gray-50 font-semibold shadow-md"
              style={{ color: "#C72030", borderColor: "#C72030" }}
              onClick={() => setIsAddToAnotherFlatModalOpen(true)}
            >
              + Add to Another Flat
            </Button>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: "2px solid #e5e7eb", background: "#fff" }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{
              "& .MuiTab-root": {
                textTransform: "none",
                fontSize: "14px",
                fontWeight: 600,
                color: "#666",
                py: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
                "&.Mui-selected": {
                  color: "#C72030",
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#C72030",
                height: "3px",
              },
            }}
          >
            <Tab label="User Info" icon={<UserIcon className="w-4 h-4" />} iconPosition="start" />
            <Tab label="Club Info" icon={<Info className="w-4 h-4" />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Tab Content - User Info */}
        {
          tabValue === 0 && (
            <Box sx={{ p: 4, background: "#fafafa" }}>
              {/* Contact Information Section */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                  <Mail className="w-5 h-5 text-C72030" style={{ color: "#C72030" }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#1A1A1A", m: 0 }}>
                    Contact Information
                  </Typography>
                </Box>
                <Paper sx={{ p: 3, background: "#fff", borderRadius: "8px" }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
                    <InfoField label="Email" value={user?.email || "-"} />
                    <InfoField label="Mobile Number" value={user?.mobile_number || "-"} />
                    <InfoField label="Alternate Email 1" value={user?.alternate_email_1 || "-"} />
                    <InfoField label="Alternate Email 2" value={user?.alternate_email_2 || "-"} />
                    <InfoField label="Landline Number" value={user?.landline || "-"} />
                    <InfoField label="Intercom Number" value={user?.intercom || "-"} />
                  </Box>
                </Paper>
              </Box>

              {/* Personal Details Section */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                  <UserIcon className="w-5 h-5" style={{ color: "#C72030" }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#1A1A1A", m: 0 }}>
                    Personal Details
                  </Typography>
                </Box>
                <Paper sx={{ p: 3, background: "#fff", borderRadius: "8px" }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
                    <InfoField label="Date of Birth" value={user?.birthday || "-"} />
                    <InfoField label="Anniversary" value={user?.anniversary || "-"} />
                    <InfoField label="Spouse Birthday" value={user?.spouse_birthday || "-"} />
                    <InfoField label="Resident Type" value={user?.resident_type || "-"} />
                    <InfoField label="Lives Here" value={user?.lives_here === "true" ? "Yes" : "No"} />
                    <InfoField label="Membership Type" value={user?.is_primary ? "Primary" : "Secondary"} />
                  </Box>
                </Paper>
              </Box>

              {/* Residential Details Section */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                  <Home className="w-5 h-5" style={{ color: "#C72030" }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#1A1A1A", m: 0 }}>
                    Residential Details
                  </Typography>
                </Box>
                <Paper sx={{ p: 3, background: "#fff", borderRadius: "8px" }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
                    <InfoField label="Phase" value={user?.phase || "Post Possession"} />
                    <InfoField label="Alternate Address" value={user?.alternate_address || "-"} />
                    <InfoField label="Adults Residing" value={user?.adults || "-"} />
                    <InfoField label="Children Residing" value={user?.children || "-"} />
                    <InfoField label="Pets" value={user?.pets || "-"} />
                    <InfoField label="EV Connection" value={user?.ev_connection ? "Yes" : "No"} />
                  </Box>
                </Paper>
              </Box>

              {/* Official Details Section */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                  <Info className="w-5 h-5" style={{ color: "#C72030" }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#1A1A1A", m: 0 }}>
                    Official Details
                  </Typography>
                </Box>
                <Paper sx={{ p: 3, background: "#fff", borderRadius: "8px" }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
                    <InfoField label="GST Number" value={user?.gst_number || "-"} />
                    <InfoField label="PAN Number" value={user?.pan_number || "-"} />
                    <InfoField label="Designation" value={user?.designation || "-"} />
                    <InfoField label="Committee Member" value={user?.committee_member ? "Yes" : "No"} />
                  </Box>
                </Paper>
              </Box>

              {/* Members List Section */}
              {members.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                    <Users className="w-5 h-5" style={{ color: "#C72030" }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "#1A1A1A", m: 0 }}>
                      Members List ({members.length})
                    </Typography>
                  </Box>
                  <Paper sx={{ p: 3, background: "#fff", borderRadius: "8px" }}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {members.map((member, index) => (
                        <Typography
                          key={index}
                          variant="body2"
                          sx={{
                            color: "#1A1A1A",
                            py: 1,
                            px: 1.5,
                            borderRadius: "4px",
                          }}
                        >
                          • {member}
                        </Typography>
                      ))}
                    </Box>
                  </Paper>
                </Box>
              )}

              {/* Documents Section */}
              {user?.user_flat_documents && user?.user_flat_documents.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                    <Files className="w-5 h-5" style={{ color: "#C72030" }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "#1A1A1A", m: 0 }}>
                      Attachments ({user.user_flat_documents.length})
                    </Typography>
                  </Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)" }, gap: 2 }}>
                    {user.user_flat_documents.map((doc: any, index: number) => {
                      const fileType = getFileType(doc.document_url);
                      const filename = getFilenameFromUrl(doc.document_url);
                      const isImage = fileType === "image";

                      return (
                        <Box
                          key={doc.id || index}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: 2.5,
                            border: "2px solid #e5e7eb",
                            borderRadius: "12px",
                            backgroundColor: "#fff",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                          }}
                          onClick={() => handleOpenDocument(doc.document_url)}
                        >
                          {/* Preview Area */}
                          <Box
                            sx={{
                              width: "100%",
                              height: "140px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "#fafafa",
                              borderRadius: "8px",
                              mb: 2,
                              overflow: "hidden",
                            }}
                          >
                            {isImage ? (
                              <img
                                src={doc.document_url}
                                alt={filename}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                  const parent = (e.target as HTMLImageElement).parentElement;
                                  if (parent) {
                                    const fallbackBox = document.createElement("div");
                                    fallbackBox.style.display = "flex";
                                    fallbackBox.style.alignItems = "center";
                                    fallbackBox.style.justifyContent = "center";
                                    fallbackBox.innerHTML = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C72030" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>';
                                    parent.appendChild(fallbackBox);
                                  }
                                }}
                              />
                            ) : (
                              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                                {getFileIcon(fileType, 40)}
                              </Box>
                            )}
                          </Box>

                          {/* File Info */}
                          <Box sx={{ width: "100%", textAlign: "center" }}>
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 600,
                                color: "#1A1A1A",
                                display: "block",
                                mb: 0.7,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontSize: "12px",
                              }}
                              title={filename}
                            >
                              {filename}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "#C72030",
                                fontSize: "11px",
                                display: "block",
                                fontWeight: 500,
                              }}
                            >
                              Click to preview
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
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