import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Paper,
  Box,
  Avatar,
  Typography,
  Grid,
  Divider,
  Tabs,
  Tab,
} from "@mui/material";
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  Home,
  Calendar,
  Info,
  FileText,
  Edit,
  Download,
  File,
  FileJson,
  Image,
  FileCode,
  Users,
  Files,
  X,
  Plus,
  Copy,
  Link as LinkIcon,
  Share2,
  Check,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddToAnotherFlatModal } from "@/components/AddToAnotherFlatModal";
import { SendEmailModal } from "@/components/SendEmailModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FormControl as MuiFormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  TextField,
} from "@mui/material";
import {
  fieldStyles,
  menuProps,
} from "@/components/ticket-management/fieldStyles";
import axios from "axios";
import { toast } from "sonner";
import { getFullUrl, getAuthHeader, API_CONFIG } from "@/config/apiConfig";

// Helper component for displaying info fields
const InfoField = ({ label, value }: { label: string; value: any }) => (
  <Box>
    <Typography
      variant="body2"
      sx={{
        color: "rgba(26, 26, 24, 0.48)",
        fontSize: "11px",
        mb: 0.5,
        fontWeight: 500,
      }}
    >
      {label}
    </Typography>
    <Typography
      variant="body2"
      sx={{ color: "#1A1A18", fontWeight: 500, fontSize: "13.5px" }}
    >
      {value || "-"}
    </Typography>
  </Box>
);

// Helper function to decode profile picture URL
const getProfilePictureUrl = (
  profileUrl: string | undefined
): string | null => {
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

const getInviteVisitorLink = (encryptedId: string): string =>
  `${window.location.origin}/invite-visitor/${encryptedId}`;

// "YYYY-MM-DDTHH:mm" in local time, for datetime-local value/min
const toDateTimeLocalValue = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// datetime-local "2026-11-20T18:00" -> API "2026-11-20 18:00"
const toApiValidTill = (value: string): string => value.replace("T", " ");

// "2026-11-19T17:26" -> "19 Nov 2026, 05:26 pm"
const formatInviteValidTill = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// Quick validity choices shown under the date-time picker
const INVITE_VALIDITY_PRESETS: { label: string; getDate: () => Date }[] = [
  {
    label: "2 hours",
    getDate: () => new Date(Date.now() + 2 * 60 * 60 * 1000),
  },
  {
    label: "End of day",
    getDate: () => {
      const d = new Date();
      d.setHours(23, 59, 0, 0);
      return d;
    },
  },
  { label: "1 day", getDate: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
  {
    label: "7 days",
    getDate: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
];

// POST /short_urls response shape isn't typed yet — accept the common keys
// POST /short_urls response:
// { code: 201, message, short_url: { id, url, short_url, valid_till, expired, ... } }
interface CreateShortUrlResponse {
  code?: number;
  message?: string;
  short_url?: {
    id?: number;
    url?: string;
    short_url?: string;
    valid_till?: string;
    expired?: boolean;
  };
}

const extractShortUrl = (data: CreateShortUrlResponse): string | null => {
  const shortUrl = data?.short_url?.short_url;
  return typeof shortUrl === "string" && shortUrl ? shortUrl : null;
};

const shareInviteVisitorLink = async (link: string): Promise<void> => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: "Invite Visitor Link",
        text: "Please fill your visitor details before you arrive.",
        url: link,
      });
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") {
        console.error("Failed to share invite link:", error);
        toast.error("Failed to share link");
      }
    }
    return;
  }

  try {
    await navigator.clipboard.writeText(link);
    toast.success(
      "Sharing isn't supported on this browser — link copied instead"
    );
  } catch {
    toast.error("Failed to copy link");
  }
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
  const [isAddToAnotherFlatModalOpen, setIsAddToAnotherFlatModalOpen] =
    useState(false);
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const [isConfigureDetailsModalOpen, setIsConfigureDetailsModalOpen] =
    useState(false);
  const [inviteVisitorLinkOpen, setInviteVisitorLinkOpen] = useState(false);
  // Invite link validity + the short URL returned by POST /short_urls
  const [inviteValidTill, setInviteValidTill] = useState("");
  const [generatedInviteLink, setGeneratedInviteLink] = useState("");
  const [isGeneratingInviteLink, setIsGeneratingInviteLink] = useState(false);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [clubFormData, setClubFormData] = useState({
    clubMembershipChecked: false,
    membershipNumber: "",
    startDate: "",
    endDate: "",
    accessCardChecked: false,
    accessCardId: "",
  });

  // Credit Wallet Dialog State
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditRemarks, setCreditRemarks] = useState("");
  const [creditPaymentMode, setCreditPaymentMode] = useState("cash");
  const [creditLoading, setCreditLoading] = useState(false);

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
        if (
          response.data?.other_members &&
          Array.isArray(response.data.other_members)
        ) {
          setMembers(response.data.other_members);
        }
        if (!response.data) {
          setError("User data not found in response.");
        }
      })
      .catch((err) => {
        console.error("Error fetching user details:", err);
        const errorMessage =
          err.response?.data?.message || "Failed to load user details.";
        setError(errorMessage);
        toast.error(errorMessage);
      })
      .finally(() => setLoading(false));
  }, [userId, baseUrl, token]);

  if (loading) {
    return (
      <div className="p-6 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <Box
        sx={{
          p: 6,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "40vh",
        }}
      >
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

  const handleClubFormChange = (field: string, value: any) => {
    setClubFormData((prev) => ({ ...prev, [field]: value }));
  };

  // POST /short_urls with the invite link + validity; backend returns the
  // shareable (short, expiring) URL that we show for copy/share
  const resetInviteVisitorLink = () => {
    setInviteValidTill("");
    setGeneratedInviteLink("");
    setInviteLinkCopied(false);
  };

  const handleInviteValidTillChange = (value: string) => {
    setInviteValidTill(value);
    // A new validity needs a new link
    setGeneratedInviteLink("");
    setInviteLinkCopied(false);
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard
      .writeText(generatedInviteLink)
      .then(() => {
        setInviteLinkCopied(true);
        toast.success("Link copied to clipboard");
        window.setTimeout(() => setInviteLinkCopied(false), 2000);
      })
      .catch(() => toast.error("Failed to copy link"));
  };

  const handleGenerateInviteLink = async () => {
    if (!user?.encrypted_id) return;
    if (!inviteValidTill) {
      toast.error("Please select the validity date and time");
      return;
    }
    // if (new Date(inviteValidTill).getTime() <= Date.now()) {
    //   toast.error("Validity must be a future date and time");
    //   return;
    // }
    if (!baseUrl || !token) {
      toast.error("Missing authentication details. Please login again.");
      return;
    }

    setIsGeneratingInviteLink(true);
    setGeneratedInviteLink("");
    try {
      const response = await axios.post<CreateShortUrlResponse>(
        `https://${baseUrl}/short_urls.json`,
        {
          url: getInviteVisitorLink(user.encrypted_id),
          valid_till: toApiValidTill(inviteValidTill),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const shortUrl = extractShortUrl(response.data);
      if (!shortUrl) {
        console.error("Unexpected /short_urls response:", response.data);
        toast.error("Failed to generate link");
        return;
      }

      setGeneratedInviteLink(shortUrl);
      toast.success(response.data?.message || "Link generated");
    } catch (error) {
      console.error("Error generating invite link:", error);
      const message =
        (
          error as {
            response?: { data?: { message?: string; error?: string } };
          }
        )?.response?.data?.message ||
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ||
        "Failed to generate link";
      toast.error(message);
    } finally {
      setIsGeneratingInviteLink(false);
    }
  };

  const handleCreditWallet = async () => {
    if (!creditAmount || parseFloat(creditAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!creditRemarks.trim()) {
      toast.error("Please enter remarks");
      return;
    }

    setCreditLoading(true);
    try {
      const token = API_CONFIG.TOKEN || "";
      const url = getFullUrl(
        `/loyalty/members/credit_wallet.json?token=${token}`
      );
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_code: user?.customer_code,
          amount: parseFloat(creditAmount),
          remarks: creditRemarks.trim(),
          payment_mode: creditPaymentMode,
          topup_by: "admin",
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Wallet credited successfully");
        setCreditDialogOpen(false);
        setCreditAmount("");
        setCreditRemarks("");
        setCreditPaymentMode("cash");
        window.location.reload();
      } else {
        toast.error(result.message || "Failed to credit wallet");
      }
    } catch (error) {
      console.error("Error crediting wallet:", error);
      toast.error("Failed to credit wallet. Please try again.");
    } finally {
      setCreditLoading(false);
    }
  };

  // Helper function to format date from API response
  const formatDateFromAPI = (dateString: string | null | undefined): string => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  };

  const handleSubmitClubDetails = async () => {
    try {
      if (!baseUrl || !token || !user) {
        toast.error("Missing authentication details.");
        return;
      }

      // Validate form inputs
      if (
        clubFormData.clubMembershipChecked &&
        !clubFormData.membershipNumber.trim()
      ) {
        toast.error("Please enter Membership Number");
        return;
      }
      if (!clubFormData.startDate) {
        toast.error("Please select Start Date");
        return;
      }
      if (!clubFormData.endDate) {
        toast.error("Please select End Date");
        return;
      }
      if (clubFormData.endDate < clubFormData.startDate) {
        toast.error("End Date must be on or after Start Date");
        return;
      }
      if (clubFormData.accessCardChecked && !clubFormData.accessCardId.trim()) {
        toast.error("Please enter Access Card ID");
        return;
      }

      const societyId = localStorage.getItem("selectedUserSociety");
      if (!societyId) {
        toast.error("Society ID not found");
        return;
      }

      const formData = new FormData();

      // Add club_member_allocation details
      formData.append("club_member_allocation[society_id]", societyId);
      formData.append(
        "club_member_allocation[society_flat_id]",
        user.society_flat_id || ""
      );
      formData.append("club_member_allocation[status]", "active");
      formData.append(
        "club_member_allocation[start_date]",
        clubFormData.startDate
      );
      formData.append("club_member_allocation[end_date]", clubFormData.endDate);

      // Add member (current user)
      formData.append("members[0][user_society_id]", userId);
      formData.append("members[0][first_name]", user.firstname);
      formData.append("members[0][last_name]", user.lastname || "");
      formData.append("members[0][email]", user.email || "");
      formData.append("members[0][mobile]", user.mobile || "");
      formData.append(
        "members[0][resident_type]",
        user.resident_type || "owner"
      );

      // Add club membership details
      formData.append(
        "members[0][club_member_check]",
        clubFormData.clubMembershipChecked ? "true" : "false"
      );
      formData.append(
        "members[0][membership_number]",
        clubFormData.membershipNumber
      );

      // Add access card details
      formData.append(
        "members[0][access_card_check]",
        clubFormData.accessCardChecked ? "true" : "false"
      );
      formData.append("members[0][access_card_id]", clubFormData.accessCardId);

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

      toast.success("Club membership configured successfully!");
      setIsConfigureDetailsModalOpen(false);
      // Refresh user data
      window.location.reload();
    } catch (error) {
      console.error("Error saving club details:", error);
      const errorMessage =
        error.response?.data?.errors?.[0] ||
        "Failed to save club details. Please try again.";
      toast.error(errorMessage);
    }
  };

  return (
    <Box
      sx={{ p: { xs: 2, md: 3 }, background: "#FDFDFB", minHeight: "100vh" }}
    >
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate("/settings/manage-users")}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[rgba(26,26,24,0.48)] hover:text-[#1A1A18] transition-colors mb-[14px]"
      >
        <ArrowLeft className="w-[18px] h-[18px]" />
        Back to Manage Users
      </button>

      {/* Main Container */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 0,
          overflow: "visible",
          boxShadow: "none",
          background: "transparent",
        }}
      >
        {/* Header Section with Avatar and User Info */}
        <Box
          sx={{
            background: "#FFFFFF",
            border: "1px solid rgba(26, 26, 24, 0.09)",
            borderRadius: "16px",
            p: "22px 24px",
            position: "relative",
          }}
        >
          {/* Edit Button */}
          <Box sx={{ position: "absolute", top: 16, right: 16 }}>
            <Button
              size="sm"
              className="btn-primary h-9 px-4 text-sm font-medium inline-flex items-center gap-1.5 [&_svg]:!text-white"
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
                width: 72,
                height: 72,
                bgcolor: "#F5F4F0",
                border: "none",
                color: "#1A1A18",
                fontSize: "28px",
                fontWeight: 600,
                boxShadow: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
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
                  <UserIcon size={32} />
                </Box>
              )}
            </Avatar>
            <Box sx={{ flex: 1, color: "rgba(26, 26, 24, 0.48)" }}>
              <Typography
                sx={{
                  fontSize: "22px",
                  fontWeight: 600,
                  lineHeight: 1.2,
                  letterSpacing: "-0.015em",
                  color: "#1A1A18",
                  mb: 1,
                }}
              >
                {user?.full_name ||
                  (user?.firstname && user?.lastname
                    ? `${user.firstname} ${user.lastname}`
                    : "User")}
              </Typography>
              <Box sx={{ display: "flex", gap: 3, mb: 1.5, flexWrap: "wrap" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Home className="w-4 h-4" />
                  <Typography variant="body2">
                    {user?.flat_no
                      ? `${user.flat_no}, ${user?.block_no || ""}`
                      : "No Flat"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Calendar className="w-4 h-4" />
                  <Typography variant="body2">{user?.phase || "-"}</Typography>
                </Box>
              </Box>
              {/* Status Badge */}
              <Box sx={{ display: "inline-block" }}>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.25,
                    py: 0.375,
                    borderRadius: "999px",
                    backgroundColor: user?.approved
                      ? "rgba(18, 161, 80, 0.12)"
                      : user?.approved === false
                        ? "rgba(229, 72, 77, 0.12)"
                        : "rgba(242, 163, 18, 0.3)",
                    color: user?.approved
                      ? "#0E7F3F"
                      : user?.approved === false
                        ? "#A32126"
                        : "#8A5B00",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: "currentColor",
                    }}
                  />
                  {user?.approved
                    ? "Approved"
                    : user?.approved === false
                      ? "Rejected"
                      : "Pending"}
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Add to Another Flat Button */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-start",
              mt: 3,
              gap: 2,
            }}
          >
            <Button
              className="btn-cancel h-9 px-4 text-sm font-medium inline-flex items-center gap-1.5"
              onClick={() => setIsAddToAnotherFlatModalOpen(true)}
            >
              + Add to Another Flat
            </Button>
            <Button
              className="btn-cancel h-9 px-4 text-sm font-medium inline-flex items-center gap-1.5"
              onClick={() => setCreditDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Credit Wallet
            </Button>
            <Button
              className="btn-cancel h-9 px-4 text-sm font-medium inline-flex items-center gap-1.5"
              onClick={() => setSendEmailOpen(true)}
            >
              <Mail className="w-4 h-4 mr-1" />
              Send Email
            </Button>
            <Button
              className="btn-cancel h-9 px-4 text-sm font-medium inline-flex items-center gap-1.5"
              onClick={() => setInviteVisitorLinkOpen(true)}
              disabled={!user?.encrypted_id}
            >
              <Mail className="w-4 h-4 mr-1" />
              Invite Visitor Link
            </Button>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ mt: 3, mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{
              minHeight: 0,
              "& .MuiTabs-flexContainer": { gap: "3px" },
              "& .MuiTab-root": {
                textTransform: "none",
                fontSize: "12.5px",
                fontWeight: 600,
                color: "rgba(26, 26, 24, 0.55)",
                minHeight: 0,
                py: "8px",
                px: "16px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: 1,
                "&:hover": { color: "#1A1A18" },
              },
              // theme.css styles [role="tablist"] tabs as a segmented control but only
              // highlights Radix tabs (data-state="active"); MUI marks the selected tab
              // with .Mui-selected, so highlight it here with a selector strong enough to win.
              "& .MuiTabs-flexContainer[role='tablist'] .MuiTab-root.Mui-selected.Mui-selected.Mui-selected":
                {
                  color: "#1A1A18 !important",
                  backgroundColor: "#FFFFFF !important",
                  boxShadow:
                    "0 1px 2px rgba(26, 26, 24, 0.1), 0 0 0 1px rgba(26, 26, 24, 0.05) !important",
                },
              "& .MuiTabs-indicator": {
                display: "none",
              },
            }}
          >
            <Tab
              label="User Info"
              icon={<UserIcon className="w-4 h-4" />}
              iconPosition="start"
            />
            <Tab
              label="Club Info"
              icon={<Info className="w-4 h-4" />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Tab Content - User Info */}
        {tabValue === 0 && (
          <Box sx={{ p: 0, background: "transparent" }}>
            {[
              {
                title: "Booking Details",
                icon: Home,
                fields: [
                  {
                    label: "Flat / Block",
                    value: user?.flat_no
                      ? `${user.flat_no}${user?.block_no ? `, ${user.block_no}` : ""}`
                      : "-",
                  },
                  { label: "Phase", value: user?.phase || "-" },
                  {
                    label: "Resident Type",
                    value: user?.resident_type || "-",
                  },
                  {
                    label: "Membership Type",
                    value: user?.is_primary ? "Primary" : "Secondary",
                  },
                  {
                    label: "Lives Here",
                    value: user?.lives_here === "true" ? "Yes" : "No",
                  },
                  { label: "Move In Date", value: user?.movein_date || "-" },
                  {
                    label: "Date of Possession",
                    value: formatDateFromAPI(user?.date_of_possession),
                  },
                  {
                    label: "Agreement Expire Date",
                    value: user?.user_flat?.agreement_expire_date || "-",
                  },
                  {
                    label: "Landline Number",
                    value: user?.user_flat?.landline || "-",
                  },
                  { label: "Intercom Number", value: user?.intercom || "-" },
                ],
              },
              {
                title: "Applicant Details",
                icon: UserIcon,
                fields: [
                  { label: "Email", value: user?.email || "-" },
                  {
                    label: "Mobile Number",
                    value: user?.mobile_number || "-",
                  },
                  {
                    label: "Alternate Email 1",
                    value: user?.alternate_email_1 || "-",
                  },
                  {
                    label: "Alternate Email 2",
                    value: user?.alternate_email_2 || "-",
                  },
                  { label: "Date of Birth", value: user?.birthday || "-" },
                  { label: "PAN Number", value: user?.pan_number || "-" },
                  { label: "GST Number", value: user?.gst_number || "-" },
                  { label: "Designation", value: user?.designation || "-" },
                ],
              },
              {
                title: "Additional Details",
                icon: Info,
                fields: [
                  { label: "Anniversary", value: user?.anniversary || "-" },
                  {
                    label: "Spouse Birthday",
                    value: user?.spouse_birthday || "-",
                  },
                  {
                    label: "Alternate Address",
                    value: user?.alternate_address || "-",
                  },
                  { label: "Adults Residing", value: user?.adults || "-" },
                  { label: "Children Residing", value: user?.children || "-" },
                  { label: "Pets", value: user?.pets || "-" },
                  {
                    label: "EV Connection",
                    value: user?.ev_connection ? "Yes" : "No",
                  },
                  {
                    label: "Committee Member",
                    value: user?.committee_member ? "Yes" : "No",
                  },
                ],
              },
            ].map((section) => {
              const SectionIcon = section.icon;
              return (
                <Box
                  key={section.title}
                  sx={{
                    mb: 2.5,
                    background: "#FFFFFF",
                    border: "1px solid rgba(26, 26, 24, 0.09)",
                    borderRadius: "16px",
                    p: "22px 24px",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 2,
                    }}
                  >
                    <span className="w-8 h-8 rounded-full flex items-center justify-center bg-[#F5F4F0] flex-none">
                      <SectionIcon
                        className="w-[14px] h-[14px]"
                        style={{ color: "#1A1A18" }}
                      />
                    </span>
                    <Typography
                      sx={{
                        fontSize: "14px",
                        fontWeight: 600,
                        lineHeight: 1.4,
                        color: "#1A1A18",
                        m: 0,
                      }}
                    >
                      {section.title}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "1fr 1fr",
                        lg: "repeat(4, 1fr)",
                      },
                      gap: "18px 24px",
                    }}
                  >
                    {section.fields.map((field) => (
                      <InfoField
                        key={field.label}
                        label={field.label}
                        value={field.value}
                      />
                    ))}
                  </Box>
                </Box>
              );
            })}

            {/* Members List Section */}
            {members.length > 0 && (
              <Box
                sx={{
                  mb: 2.5,
                  background: "#FFFFFF",
                  border: "1px solid rgba(26, 26, 24, 0.09)",
                  borderRadius: "16px",
                  p: "22px 24px",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 2,
                  }}
                >
                  <span className="w-8 h-8 rounded-full flex items-center justify-center bg-[#F5F4F0] flex-none">
                    <Users
                      className="w-[14px] h-[14px]"
                      style={{ color: "#1A1A18" }}
                    />
                  </span>
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 600,
                      lineHeight: 1.4,
                      color: "#1A1A18",
                      m: 0,
                    }}
                  >
                    Members List ({members.length})
                  </Typography>
                </Box>
                <Paper
                  elevation={0}
                  sx={{
                    p: 0,
                    background: "transparent",
                    borderRadius: 0,
                    boxShadow: "none",
                  }}
                >
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
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
            {user?.user_flat_documents &&
              user?.user_flat_documents.length > 0 && (
                <Box
                  sx={{
                    mb: 2.5,
                    background: "#FFFFFF",
                    border: "1px solid rgba(26, 26, 24, 0.09)",
                    borderRadius: "16px",
                    p: "22px 24px",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 2,
                    }}
                  >
                    <span className="w-8 h-8 rounded-full flex items-center justify-center bg-[#F5F4F0] flex-none">
                      <Files
                        className="w-[14px] h-[14px]"
                        style={{ color: "#1A1A18" }}
                      />
                    </span>
                    <Typography
                      sx={{
                        fontSize: "14px",
                        fontWeight: 600,
                        lineHeight: 1.4,
                        color: "#1A1A18",
                        m: 0,
                      }}
                    >
                      Attachments ({user.user_flat_documents.length})
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "repeat(2, 1fr)",
                        sm: "repeat(3, 1fr)",
                        md: "repeat(4, 1fr)",
                      },
                      gap: 2,
                    }}
                  >
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
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                  const parent = (e.target as HTMLImageElement)
                                    .parentElement;
                                  if (parent) {
                                    const fallbackBox =
                                      document.createElement("div");
                                    fallbackBox.style.display = "flex";
                                    fallbackBox.style.alignItems = "center";
                                    fallbackBox.style.justifyContent = "center";
                                    fallbackBox.innerHTML =
                                      '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C72030" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>';
                                    parent.appendChild(fallbackBox);
                                  }
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
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
                                color: "rgba(26, 26, 24, 0.48)",
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
        )}

        {/* Tab Content - Club Info */}
        {tabValue === 1 && (
          <Box
            sx={{
              background: "#FFFFFF",
              border: "1px solid rgba(26, 26, 24, 0.09)",
              borderRadius: "16px",
              p: "22px 24px",
            }}
          >
            {!user?.club_member ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Typography variant="body1" sx={{ color: "#666" }}>
                  No club membership details configured
                </Typography>
                <Button
                  onClick={() => setIsConfigureDetailsModalOpen(true)}
                  className="btn-primary h-9 px-4 text-sm font-medium inline-flex items-center gap-1.5"
                >
                  Configure Details
                </Button>
              </Box>
            ) : (
              <Box>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <InfoField
                      label="Membership Number"
                      value={user?.club_member?.membership_number || "-"}
                    />
                  </div>
                  <div>
                    <InfoField
                      label="Start Date"
                      value={formatDateFromAPI(user?.club_member?.startdate)}
                    />
                  </div>
                  <div>
                    <InfoField
                      label="End Date"
                      value={formatDateFromAPI(user?.club_member?.enddate)}
                    />
                  </div>
                  <div>
                    <InfoField
                      label="Access Card ID"
                      value={user?.club_member?.access_card_id || "-"}
                    />
                  </div>
                  {user?.club_member?.club_member_check && (
                    <div>
                      <InfoField label="Club Membership" value="Active" />
                    </div>
                  )}
                  {user?.club_member?.access_card_check && (
                    <div>
                      <InfoField label="Access Card" value="Allocated" />
                    </div>
                  )}
                </div>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* Add to Another Flat Modal */}
      <AddToAnotherFlatModal
        isOpen={isAddToAnotherFlatModalOpen}
        onClose={() => setIsAddToAnotherFlatModalOpen(false)}
        userData={user}
      />

      {/* Send Email Modal */}
      <SendEmailModal
        open={sendEmailOpen}
        onOpenChange={setSendEmailOpen}
        recipients={[
          {
            email: user?.email || "",
            name:
              user?.full_name ||
              [user?.firstname, user?.lastname].filter(Boolean).join(" ") ||
              undefined,
            first_name: user?.firstname || undefined,
            last_name: user?.lastname || undefined,
            mobile: user?.mobile || user?.mobile_number || undefined,
            flat: user?.flat_no || undefined,
            tower: user?.block_no || undefined,
          },
        ]}
      />

      {/* Invite Visitor Link Modal */}
      <Dialog
        modal={false}
        open={inviteVisitorLinkOpen}
        onOpenChange={(open) => {
          setInviteVisitorLinkOpen(open);
          if (!open) resetInviteVisitorLink();
        }}
      >
        <DialogContent className="max-w-[480px] p-0 overflow-visible bg-white border-none shadow-2xl">
          <DialogHeader className="px-6 pt-5 pb-3 flex flex-row items-start justify-between space-y-0">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[rgba(218,119,86,0.15)] flex items-center justify-center shrink-0">
                <LinkIcon className="w-4 h-4 text-[#da7756]" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-[#1a1a18]">
                  Invite Visitor Link
                </DialogTitle>
                <p className="text-xs text-[#888780] mt-0.5">
                  Your guest fills their visitor details before arriving.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setInviteVisitorLinkOpen(false);
                resetInviteVisitorLink();
              }}
              className="text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-4">
            {/* Step 1: validity */}
            <div className="space-y-2">
              <TextField
                label="Link valid till"
                type="datetime-local"
                value={inviteValidTill}
                onChange={(e) => handleInviteValidTillChange(e.target.value)}
                fullWidth
                size="small"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: toDateTimeLocalValue(new Date()) }}
                InputProps={{ sx: fieldStyles }}
              />
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-[#888780] mr-0.5">
                  Quick pick:
                </span>
                {INVITE_VALIDITY_PRESETS.map((preset) => {
                  const value = toDateTimeLocalValue(preset.getDate());
                  const active = inviteValidTill === value;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleInviteValidTillChange(value)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                        active
                          ? "border-[#da7756] bg-[rgba(218,119,86,0.15)] text-[#da7756]"
                          : "border-[#e5e5e5] bg-white text-[#2c2c2c] hover:border-[#da7756] hover:text-[#da7756]"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              type="button"
              className="btn-primary w-full h-10 justify-center"
              disabled={isGeneratingInviteLink || !inviteValidTill}
              onClick={handleGenerateInviteLink}
            >
              {isGeneratingInviteLink ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LinkIcon className="w-4 h-4" />
              )}
              {isGeneratingInviteLink
                ? "Generating..."
                : generatedInviteLink
                  ? "Regenerate Link"
                  : "Generate Link"}
            </Button>

            {/* Step 2: generated link */}
            {generatedInviteLink && (
              <div className="rounded-xl border border-[#e5e5e5] bg-[#f6f4ee] p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#798c5e]">
                    <CheckCircle2 className="w-4 h-4" />
                    Link ready to share
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-[#888780]">
                    <Clock className="w-3.5 h-3.5" />
                    Valid till {formatInviteValidTill(inviteValidTill)}
                  </span>
                </div>

                <div
                  className="rounded-lg bg-white border border-[#e5e5e5] px-3 py-2 text-xs text-[#2c2c2c] font-mono break-all select-all"
                  title={generatedInviteLink}
                >
                  {generatedInviteLink}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    className="btn-cancel w-full h-9 justify-center"
                    onClick={handleCopyInviteLink}
                  >
                    {inviteLinkCopied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {inviteLinkCopied ? "Copied" : "Copy Link"}
                  </Button>
                  <Button
                    type="button"
                    className="btn-cancel w-full h-9 justify-center"
                    onClick={() => shareInviteVisitorLink(generatedInviteLink)}
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Configure Club Details Modal */}
      <Dialog
        modal={false}
        open={isConfigureDetailsModalOpen}
        onOpenChange={setIsConfigureDetailsModalOpen}
      >
        <DialogContent className="max-w-[500px] p-0 overflow-hidden bg-white border-none shadow-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="bg-[#EAEAEA] py-3 px-6 flex flex-row items-center justify-between shrink-0">
            <DialogTitle className="text-base font-bold text-gray-800 text-center w-full">
              Configure Details
            </DialogTitle>
            <button
              onClick={() => setIsConfigureDetailsModalOpen(false)}
              className="text-red-500 hover:text-red-700 transition-colors absolute right-4"
            >
              <X className="h-5 w-5 fill-current" />
            </button>
          </DialogHeader>

          <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
            {/* Club Membership Section */}
            <div className="space-y-3 border-b pb-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="clubMembership"
                  checked={clubFormData.clubMembershipChecked}
                  onChange={(e) =>
                    handleClubFormChange(
                      "clubMembershipChecked",
                      e.target.checked
                    )
                  }
                  className="w-4 h-4 cursor-pointer"
                />
                <label
                  htmlFor="clubMembership"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  Club Membership
                </label>
              </div>
              {clubFormData.clubMembershipChecked && (
                <div className="space-y-3 ml-6">
                  <TextField
                    label="Membership Number"
                    placeholder="Enter membership number"
                    value={clubFormData.membershipNumber}
                    onChange={(e) =>
                      handleClubFormChange("membershipNumber", e.target.value)
                    }
                    fullWidth
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ sx: fieldStyles }}
                  />
                  <TextField
                    label="Start Date"
                    type="date"
                    value={clubFormData.startDate}
                    onChange={(e) =>
                      handleClubFormChange("startDate", e.target.value)
                    }
                    fullWidth
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ sx: fieldStyles }}
                  />
                  <TextField
                    label="End Date"
                    type="date"
                    value={clubFormData.endDate}
                    onChange={(e) =>
                      handleClubFormChange("endDate", e.target.value)
                    }
                    fullWidth
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ sx: fieldStyles }}
                  />
                </div>
              )}
            </div>

            {/* Access Card Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="accessCard"
                  checked={clubFormData.accessCardChecked}
                  onChange={(e) =>
                    handleClubFormChange("accessCardChecked", e.target.checked)
                  }
                  className="w-4 h-4 cursor-pointer"
                />
                <label
                  htmlFor="accessCard"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  Access Card Allocated
                </label>
              </div>
              {clubFormData.accessCardChecked && (
                <div className="ml-6">
                  <TextField
                    label="Access Card ID"
                    placeholder="Enter access card ID"
                    value={clubFormData.accessCardId}
                    onChange={(e) =>
                      handleClubFormChange("accessCardId", e.target.value)
                    }
                    fullWidth
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ sx: fieldStyles }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 p-4 border-t bg-white">
            <Button
              onClick={() => setIsConfigureDetailsModalOpen(false)}
              variant="outline"
              className="px-8 h-9 border-[#00A65A] text-[#00A65A] hover:bg-[#00A65A]/10 font-semibold text-sm rounded shadow-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitClubDetails}
              className="px-8 h-9 bg-[#00A65A] hover:bg-[#008D4C] text-white font-semibold text-sm rounded shadow-sm"
            >
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credit Wallet Dialog */}
      <Dialog
        modal={false}
        open={creditDialogOpen}
        onOpenChange={setCreditDialogOpen}
      >
        <DialogContent className="max-w-[480px] p-0 overflow-visible bg-white border-none shadow-2xl">
          <DialogHeader className="py-3 px-6 flex flex-row items-center justify-between">
            <DialogTitle className="text-base font-bold text-gray-800">
              Credit Wallet
            </DialogTitle>
            <button
              onClick={() => setCreditDialogOpen(false)}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <X className="h-5 w-5 fill-current" />
            </button>
          </DialogHeader>

          <div className="p-6 space-y-5">
            <TextField
              label="Customer Code"
              type="text"
              value={user?.customer_code || ""}
              disabled
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />
            <TextField
              label={
                <>
                  Amount <span style={{ color: "red" }}>*</span>
                </>
              }
              type="number"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              placeholder="Enter amount"
              inputProps={{ min: 1 }}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />
            <MuiFormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: "white", px: 1 }}>
                Payment Mode <span style={{ color: "red" }}>*</span>
              </InputLabel>
              <MuiSelect
                value={creditPaymentMode}
                onChange={(e) => setCreditPaymentMode(e.target.value)}
                label="Payment Mode *"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="online">Online</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="upi">UPI</MenuItem>
              </MuiSelect>
            </MuiFormControl>
            <TextField
              label={
                <>
                  Remarks <span style={{ color: "red" }}>*</span>
                </>
              }
              value={creditRemarks}
              onChange={(e) => setCreditRemarks(e.target.value)}
              placeholder="Enter remarks"
              multiline
              rows={3}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />
          </div>

          <div className="flex justify-center gap-4 p-4 border-t bg-white">
            <Button
              variant="outline"
              onClick={() => {
                setCreditDialogOpen(false);
                setCreditAmount("");
                setCreditRemarks("");
                setCreditPaymentMode("cash");
              }}
              disabled={creditLoading}
              className="px-6 sm:px-8 w-full sm:w-auto !bg-white border !border-[#da7756] !text-[#da7756] hover:!bg-gray-100  h-10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreditWallet}
              disabled={creditLoading}
              className="px-8 border-0 bg-[#C72030] hover:bg-[#A01828] !text-white flex items-center gap-2"
            >
              {creditLoading ? "Crediting..." : "Credit Points"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ViewUserPage;
